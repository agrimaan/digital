import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addCrop, getCrops, Crop } from '../../features/crops/cropSlice';
import { verify } from 'crypto';

const Varieties = [
  'normal',
  'premium',
  'variety1',
  'variety2',
  'variety3'
]
const soilTypes = [
  'loam',
  'clay',
  'sandy',
  'silty',
  'peaty',
  'chalky',
  'alluvial',
];
const irrigationMethods = [
  'drip',
  'sprinkler',
  'flood',
  'rainfed',
  'center-pivot',
];
const seedSources = ['own', 'market', 'government', 'supplier'];
const healthStatuses = [
  'excellent',
  'good',
  'fair',
  'poor',
  'diseased',
];

const CropManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { crops, loading, error } = useSelector(
    (state: RootState) => state.crop
  );

  const [formData, setFormData] = useState<Crop>({
    name: '',
    scientificName: '',
    variety: 'normal',
    farmId: '',
    plantedArea: 0,
    plantingDate: '',
    expectedHarvestDate: '',
    expectedYield: 0,
    location: { latitude: 0, longitude: 0, address: '' },
    soilType: 'loam',
    irrigationMethod: 'drip',
    seedSource: 'own',
    healthStatus: 'good',
    growthStage: 'seedling',
  });

  const [success, setSuccess] = useState('');

  useEffect(() => {
    dispatch(getCrops());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: parseFloat(value),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    try {
      await dispatch(addCrop(formData)).unwrap();
      setSuccess('Crop added successfully!');
      setFormData({
        ...formData,
        name: '',
        variety: 'normal',
        plantedArea: 0,
        plantingDate: '',
        expectedHarvestDate: '',
        expectedYield: 0,
        location: { latitude: 0, longitude: 0, address: '' },
      });
    } catch (err) {
      console.error('Error adding crop:', err);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        🌾 Crop Management
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <CircularProgress />}

      <Box component="form" onSubmit={handleSubmit} mt={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Crop Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Variety"
              name="Variety"
              value={formData.variety}
              onChange={handleChange}
              fullWidth
              required
            >
              {Varieties.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>



          <Grid item xs={12} sm={6}>
            <TextField
              label="Farm ID"
              name="farmId"
              value={formData.farmId}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Planted Area (ha)"
              name="plantedArea"
              type="number"
              value={formData.plantedArea}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Planting Date"
              name="plantingDate"
              type="date"
              value={formData.plantingDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Expected Harvest Date"
              name="expectedHarvestDate"
              type="date"
              value={formData.expectedHarvestDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Expected Yield"
              name="expectedYield"
              type="number"
              value={formData.expectedYield}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Soil Type"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              fullWidth
              required
            >
              {soilTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Irrigation Method"
              name="irrigationMethod"
              value={formData.irrigationMethod}
              onChange={handleChange}
              fullWidth
              required
            >
              {irrigationMethods.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Seed Source"
              name="seedSource"
              value={formData.seedSource}
              onChange={handleChange}
              fullWidth
              required
            >
              {seedSources.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Latitude"
              name="latitude"
              type="number"
              value={formData.location.latitude}
              onChange={handleLocationChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Longitude"
              name="longitude"
              type="number"
              value={formData.location.longitude}
              onChange={handleLocationChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary">
              Add Crop
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box mt={5}>
        <Typography variant="h6">Your Crops</Typography>
        <Grid container spacing={2} mt={1}>
          {crops.map((crop) => (
            <Grid item xs={12} sm={6} md={4} key={crop._id}>
              <Box p={2} border="1px solid #ccc" borderRadius={2}>
                <Typography variant="subtitle1">
                  {crop.name} ({crop.variety})
                </Typography>
                <Typography variant="body2">
                  🌿 Soil: {crop.soilType} | 💧 {crop.irrigationMethod}
                </Typography>
                <Typography variant="body2">
                  📍 Lat: {crop.location.latitude}, Lng: {crop.location.longitude}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default CropManagement;
