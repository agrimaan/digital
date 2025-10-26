import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getFieldsById, updateFields, Fields } from '../../features/fields/fieldSlice';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

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

// Normalize backend <-> frontend
const normalizeSoilType = (soil: string) => {
  if (!soil) return '';
  const mapping: Record<string, string> = {
    silty: 'Silty',
    clay: 'Clay',
    sandy: 'Sandy',
    loamy: 'Loam',
    peaty: 'Peaty',
    chalky: 'Chalky',
  };
  return mapping[soil.toLowerCase()] || soil;
};

const denormalizeSoilType = (soil: string): Fields['soilType'] => {
  if (!soil) return 'other';
  const mapping: Record<string, Fields['soilType']> = {
    Silt: 'silty',
    Clay: 'clay',
    Sandy: 'sandy',
    Loam: 'loamy',
    Peaty: 'peaty',
    Chalky: 'chalky',
  };
  return mapping[soil] || 'other';
};

const normalizeIrrigationType = (type: string) => {
  if (!type) return '';
  const mapping: Record<string, string> = {
    drip: 'Drip Irrigation',
    sprinkler: 'Sprinkler',
    flood: 'Surface Irrigation',
    other: 'Subsurface Irrigation',
    none: 'None',
  };
  return mapping[type.toLowerCase()] || type;
};

const soilTypes = ['Clay', 'Sandy', 'Loam', 'Silty', 'Peaty', 'Chalky'];
const irrigationTypes = ['Drip Irrigation', 'Sprinkler', 'Surface Irrigation', 'Subsurface Irrigation', 'None'];

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

const EditField: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
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

  // useRef to prevent multiple calls
  const hasFetched = useRef(false);

  useEffect(() => {
    if (id && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(getFieldsById(id))
        .unwrap()
        .then((res) => {
          const data = res.data || res;
          setFormData({
            name: data.name || '',
            area: data.area?.toString() || '',
            unit: data.unit,
            location: data.locationName || '',
            soilType: normalizeSoilType(data.soilType),
            irrigationType: normalizeIrrigationType(data.irrigationType),
            description: data.description || '',
            coordinates: {
              latitude: data.location?.coordinates?.[1]?.toString() || '',
              longitude: data.location?.coordinates?.[0]?.toString() || '',
            },
          });
        })
        .catch((err) => console.error('Error fetching field:', err));
    }
  }, [id, dispatch]);

  const handleChange = (key: keyof FormDataType) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    setFormData((prev: FormDataType) => ({
      ...prev,
      [key]: e.target.value as string,
    }));
  };

  const handleCoordChange = (coord: 'latitude' | 'longitude') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: FormDataType) => ({
      ...prev,
      coordinates: { ...prev.coordinates, [coord]: e.target.value },
    }));
  };

  const handleSelectChange = (key: keyof FormDataType) => (
    e: { target: { value: unknown } }
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value as string,
    }));
  };

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
    if (!validateForm() || !id) return;

    setIsSubmitting(true);
    try {
      const updatedField: Partial<Fields> = {
        name: formData.name || '',
        unit: formData.unit,
        area: parseFloat(formData.area) || 0,
        location: {
          type: 'Point',
          coordinates: [
            Number(formData.coordinates.longitude) || 0,
            Number(formData.coordinates.latitude) || 0,
          ],
        },
        soilType: denormalizeSoilType(formData.soilType || ''),
        crops: [],
        status: 'active',
        irrigationType: mapIrrigationSystem(formData.irrigationType || 'none'),
        locationName: formData.location,
        description: formData.description,
      };

      await dispatch(updateFields({ id, data: updatedField })).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/farmer/fields'), 1500);
    } catch (err: any) {
      console.error('Error updating field:', err);
      alert(err.message || 'Failed to update field');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !formData.name)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Edit Field: {formData.name}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Field updated successfully! Redirecting...
          </Alert>
        )}

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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unit: e.target.value as 'acre' | 'hectare',
                    }))
                  }
                >
                  {['acre', 'hectare'].map((unit) => (
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
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={20} /> : 'Update Field'}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/farmer/fields')} disabled={isSubmitting}>
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditField;
