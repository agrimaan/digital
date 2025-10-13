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
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createFields, Fields } from '../../features/fields/fieldSlice';

// Helper function to map irrigation system types
function mapIrrigationSystem(
  system: string
): 'flood' | 'drip' | 'sprinkler' | 'none' | 'other' {
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

const soilTypes = ['Clay', 'Sandy', 'Loam', 'Silty', 'Peaty', 'Chalky'];
const irrigationTypes = ['Drip Irrigation', 'Sprinkler', 'Surface Irrigation', 'Subsurface Irrigation', 'None'];
const areaUnits: ('acre' | 'hectare')[] = ['acre', 'hectare'];

interface FormDataType {
  name: string;
  area: string;
  unit: 'acre' | 'hectare';
  location: string;
  soilType: string;
  irrigationType: string;
  description: string;
  coordinates: { latitude: string; longitude: string };
}

const AddField: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.fields);

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    area: '',
    unit: 'acre',
    location: '',
    soilType: '',
    irrigationType: '',
    description: '',
    coordinates: { latitude: '', longitude: '' },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Input handlers
  const handleChange = (key: keyof FormDataType) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [key]: e.target.value as string,
    }));
  };

  const handleCoordChange = (coord: 'latitude' | 'longitude') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { ...prev.coordinates, [coord]: e.target.value },
    }));
  };

  const handleSelectChange = (key: keyof FormDataType) => (
    e: { target: { value: unknown } }
  ) => {
    setFormData(prev => ({
      ...prev,
      [key]: e.target.value as string,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Field name required';
    if (!formData.area.trim() || isNaN(Number(formData.area))) newErrors.area = 'Valid area required';
    if (!formData.location.trim()) newErrors.location = 'Location required';
    if (!formData.soilType) newErrors.soilType = 'Soil type required';
    if (!formData.irrigationType) newErrors.irrigationType = 'Irrigation type required';
    if (formData.coordinates.latitude && isNaN(Number(formData.coordinates.latitude)))
      newErrors.latitude = 'Latitude must be number';
    if (formData.coordinates.longitude && isNaN(Number(formData.coordinates.longitude)))
      newErrors.longitude = 'Longitude must be number';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newField: Partial<Fields> = {
        name: formData.name,
        area: parseFloat(formData.area),
        location: {
          type: 'Point',
          coordinates: [
            Number(formData.coordinates.longitude) || 0,
            Number(formData.coordinates.latitude) || 0,
          ],
        },
        soilType: formData.soilType.toLowerCase() as Fields['soilType'],
        locationName: formData.location,
        unit: formData.unit,
        crops: [],
        status: 'active',
        irrigationSource: 'rainfed',
        irrigationSystem: mapIrrigationSystem(formData.irrigationType),
        description: formData.description,  // send description
      };

      await dispatch(createFields(newField)).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/farmer/fields'), 1500);
    } catch (err: any) {
      console.error(err);
      setFormErrors({ general: err.message || 'Failed to add field' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Add New Field
        </Typography>

        {formErrors.general && <Alert severity="error">{formErrors.general}</Alert>}
        {success && <Alert severity="success">Field added successfully! Redirecting...</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Size"
                value={formData.area}
                onChange={handleChange('area')}
                error={!!formErrors.area}
                helperText={formErrors.area}
                required
                type="number"
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="unit-label">Unit</InputLabel>
                <Select
                  labelId="unit-label"
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'acre' | 'hectare' }))}
                >
                  {areaUnits.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.soilType}>
                <InputLabel id="soilType-label">Soil Type</InputLabel>
                <Select
                  labelId="soilType-label"
                  label="Soil Type"
                  value={formData.soilType}
                  onChange={handleSelectChange('soilType')}
                  required
                >
                  {soilTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.soilType && (
                  <Typography variant="caption" color="error">
                    {formErrors.soilType}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.irrigationType}>
                <InputLabel id="irrigationType-label">Irrigation Type</InputLabel>
                <Select
                  labelId="irrigationType-label"
                  label="Irrigation Type"
                  value={formData.irrigationType}
                  onChange={handleSelectChange('irrigationType')}
                  required
                >
                  {irrigationTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.irrigationType && (
                  <Typography variant="caption" color="error">
                    {formErrors.irrigationType}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                error={!!formErrors.location}
                helperText={formErrors.location}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                value={formData.coordinates.latitude}
                onChange={handleCoordChange('latitude')}
                error={!!formErrors.latitude}
                helperText={formErrors.latitude}
                type="number"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                value={formData.coordinates.longitude}
                onChange={handleCoordChange('longitude')}
                error={!!formErrors.longitude}
                helperText={formErrors.longitude}
                type="number"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/farmer/fields')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={20} /> : 'Save Field'}
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
