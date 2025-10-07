// AddField.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createFields } from '../../features/fields/fieldSlice';
import { useTranslation } from 'react-i18next';

// Helper function to map irrigation system types
function mapIrrigationSystem(system: string): 'flood' | 'drip' | 'sprinkler' | 'none' | 'other' {
  switch (system?.toLowerCase()) {
    case 'drip':
      return 'drip';
    case 'sprinkler':
      return 'sprinkler';
    case 'surface irrigation':
      return 'flood';
    case 'subsurface irrigation':
      return 'other';
    case 'none':
      return 'none';
    default:
      return 'other';
  }
}

interface FieldFormData {
  name: string;
  size: string;
  unit: 'acre' | 'hectare';
  location: string;
  soilType: string;
  irrigationType: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
  description: string;
}

const soilTypes = ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'];
const irrigationTypes = [
  'drip',
  'sprinkler',
  'surface irrigation',
  'subsurface irrigation',
  'none'
];
const areaUnits: ('acre' | 'hectare')[] = ['acre', 'hectare'];

const AddField: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { loading } = useSelector((state: RootState) => state.fields);

  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    size: '',
    unit: 'acre', // default unit
    location: '',
    soilType: '',
    irrigationType: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t('addField.fieldNameRequired');
    if (!formData.size.trim()) {
      newErrors.size = t('addField.sizeRequired');
    } else if (isNaN(Number(formData.size))) {
      newErrors.size = t('addField.sizeMustBeNumber');
    }
    if (!formData.location.trim()) newErrors.location = t('addField.locationRequired');
    if (!formData.soilType) newErrors.soilType = t('addField.soilTypeRequired');
    if (!formData.irrigationType) newErrors.irrigationType = t('addField.irrigationTypeRequired');
    if (formData.coordinates.latitude && isNaN(Number(formData.coordinates.latitude))) {
      newErrors.latitude = t('addField.latitudeInvalid');
    }
    if (formData.coordinates.longitude && isNaN(Number(formData.coordinates.longitude))) {
      newErrors.longitude = t('addField.longitudeInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof FieldFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    };

  const handleCoordinateChange = (coord: 'latitude' | 'longitude') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        coordinates: { ...prev.coordinates, [coord]: e.target.value }
      }));
    };

  const handleSelectChange = (field: keyof FieldFormData) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);

    if (!validateForm()) return;

    try {
      const newField = {
        name: formData.name,
        area: parseFloat(formData.size),
        location: {
          type: 'Point' as const,
          coordinates: [
            Number(formData.coordinates.longitude) || 0,
            Number(formData.coordinates.latitude) || 0
          ]
        },
        soilType: formData.soilType,
        crops: [],
        status: 'active' as const,
        irrigationSource: 'rainfed' as const,
        irrigationSystem: mapIrrigationSystem(formData.irrigationType)
      };

      await dispatch(createFields(newField)).unwrap();
      setTimeout(() => navigate('/farmer/fields'), 2000);
    } catch (err: any) {
      setErrors({ general: err.message || t('addField.failedToAddField') });
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          {t('addField.addNewField')}
        </Typography>

        {errors.general && <Alert severity="error">{errors.general}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('addField.fieldName')}
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label={t('addField.size')}
                value={formData.size}
                onChange={handleInputChange('size')}
                fullWidth
                required
                type="number"
                inputProps={{ step: '0.1', min: '0' }}
                error={!!errors.size}
                helperText={errors.size}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="unit-label">{t('addField.unit')}</InputLabel>
                <Select
                  labelId="unit-label"
                  id="unit"
                  value={formData.unit}
                  onChange={handleSelectChange('unit')}
                  label={t('addField.unit')}
                >
                  {areaUnits.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Soil and Irrigation */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="soil-label">{t('addField.soilType')}</InputLabel>
                <Select
                  labelId="soil-label"
                  id="soilType"
                  value={formData.soilType}
                  onChange={handleSelectChange('soilType')}
                  label={t('addField.soilType')}
                >
                  {soilTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="irrigation-label">{t('addField.irrigationType')}</InputLabel>
                <Select
                  labelId="irrigation-label"
                  id="irrigationType"
                  value={formData.irrigationType}
                  onChange={handleSelectChange('irrigationType')}
                  label={t('addField.irrigationType')}
                >
                  {irrigationTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('addField.location')}
                value={formData.location}
                onChange={handleInputChange('location')}
                fullWidth
                required
                error={!!errors.location}
                helperText={errors.location}
              />
            </Grid>

            {/* GPS Coordinates */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary">
                {t('addField.gpsCoordinates')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t('addField.latitude')}
                value={formData.coordinates.latitude}
                onChange={handleCoordinateChange('latitude')}
                fullWidth
                type="number"
                error={!!errors.latitude}
                helperText={errors.latitude}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t('addField.longitude')}
                value={formData.coordinates.longitude}
                onChange={handleCoordinateChange('longitude')}
                fullWidth
                type="number"
                error={!!errors.longitude}
                helperText={errors.longitude}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                label={t('addField.description')}
                value={formData.description}
                onChange={handleInputChange('description')}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/farmer/fields"
                  disabled={loading}
                >
                  {t('addField.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? t('addField.adding') : t('addField.saveField')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddField;
