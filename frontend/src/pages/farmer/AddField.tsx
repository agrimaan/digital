import React, { useState, useEffect } from 'react';
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
import Autocomplete from '@mui/material/Autocomplete';

/* --------------------- Helper Functions --------------------- */
function mapIrrigationSystem(
  system: string
): 'flood' | 'drip' | 'sprinkler' | 'none' | 'other' {
  const s = system?.toLowerCase().trim();
  switch (s) {
    case 'drip irrigation':
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

const soilTypes = ['Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky'];
const irrigationTypes = [
  'Drip Irrigation',
  'Sprinkler',
  'Surface Irrigation',
  'Subsurface Irrigation',
  'None'
];
const areaUnits: ('acre' | 'hectare')[] = ['acre', 'hectare'];

/* --------------------- Types --------------------- */
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

/* --------------------- Debounce Hook --------------------- */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* --------------------- Geolocation Search --------------------- */
type GeoSuggestion = { display_name: string; lat: string; lon: string };

async function searchNominatim(query: string, limit = 5): Promise<GeoSuggestion[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=${limit}&addressdetails=0`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  return (await res.json()) as GeoSuggestion[];
}

/* --------------------- Address Autocomplete --------------------- */
const AddressAutocomplete: React.FC<{
  value: string;
  onPicked: (address: string, lat: number, lon: number) => void;
  label?: string;
  placeholder?: string;
}> = ({ value, onPicked, label = 'Field Location', placeholder }) => {
  const [input, setInput] = React.useState(value || '');
  const debounced = useDebouncedValue(input, 350);
  const [options, setOptions] = React.useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setInput(value || ''), [value]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!debounced.trim()) {
        setOptions([]);
        return;
      }
      try {
        setLoading(true);
        const results = await searchNominatim(debounced, 7);
        if (!cancelled) setOptions(results);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const commitFreeText = async () => {
    if (!input.trim()) return;
    try {
      const [first] = await searchNominatim(input, 1);
      if (first) onPicked(first.display_name, Number(first.lat), Number(first.lon));
      else onPicked(input, 0, 0);
    } catch {
      onPicked(input, 0, 0);
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      loading={loading}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.display_name)}
      filterOptions={(x) => x}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      onChange={(_, v) => {
        if (!v) return;
        if (typeof v === 'string') {
          commitFreeText();
          return;
        }
        onPicked(v.display_name, Number(v.lat), Number(v.lon));
        setInput(v.display_name);
      }}
      onBlur={commitFreeText}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder || 'Start typing address, village, city…'}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

/* --------------------- Main Component --------------------- */
const AddField: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    area: '',
    unit: 'acre',
    location: '',
    soilType: '',
    irrigationType: '',
    description: '',
    coordinates: { latitude: '', longitude: '' }
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* --------------------- Handlers --------------------- */
  const handleChange = (key: keyof FormDataType) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value as string
    }));
  };

  const handleCoordChange = (coord: 'latitude' | 'longitude') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { ...prev.coordinates, [coord]: e.target.value }
    }));
  };

  const handleSelectChange = (key: keyof FormDataType) => (e: { target: { value: unknown } }) => {
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value as string
    }));
  };

  /* --------------------- Validation --------------------- */
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

  /* --------------------- Submit --------------------- */
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
            Number(formData.coordinates.latitude) || 0
          ]
        },
        soilType: formData.soilType.toLowerCase() as Fields['soilType'],
        locationName: formData.location,
        unit: formData.unit,
        crops: [],
        status: 'active',
        irrigationType: mapIrrigationSystem(formData.irrigationType),
        description: formData.description
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

  /* --------------------- Render --------------------- */
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
            {/* Field Name */}
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

            {/* Area */}
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

            {/* Unit */}
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="unit-label">Unit</InputLabel>
                <Select
                  labelId="unit-label"
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unit: e.target.value as 'acre' | 'hectare'
                    }))
                  }
                >
                  {areaUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Soil Type */}
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
                  {soilTypes.map((type) => (
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

            {/* Irrigation Type */}
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
                  {irrigationTypes.map((type) => (
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

            {/* Location */}
            <Grid item xs={12}>
              <AddressAutocomplete
                value={formData.location}
                onPicked={(address, lat, lon) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: address,
                    coordinates: {
                      latitude: lat.toString(),
                      longitude: lon.toString()
                    }
                  }))
                }
                label="Field Location"
              />
            </Grid>

            {/* Latitude */}
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

            {/* Longitude */}
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

            {/* Description */}
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

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/farmer/fields')}
                  disabled={isSubmitting}
                >
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
