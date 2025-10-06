import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import FieldsForm from '../../components/FieldsForm';
import { getFieldsById, updateFields, Fields, IrrigationSystem } from '../../features/fields/fieldSlice';
import { Container, Paper, Grid, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';

// Helpers to normalize backend <-> frontend
// Soil
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

export const denormalizeSoilType = (soil: string): Fields['soilType'] => {
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

// Irrigation
const normalizeIrrigationType = (type: string) => {
  if (!type) return '';
  const mapping: Record<string, string> = {
    drip: 'Drip Irrigation',
    sprinkler: 'Sprinkler',
    'surface irrigation': 'Surface Irrigation',
    'subsurface irrigation': 'Subsurface Irrigation',
    none: 'None',
  };
  return mapping[type.toLowerCase()] || type;
};

export const denormalizeIrrigationType = (type: string): IrrigationSystem['type'] => {
  if (!type) return 'none';
  const mapping: Record<string, IrrigationSystem['type']> = {
    'Drip Irrigation': 'drip',
    Sprinkler: 'sprinkler',
    'Surface Irrigation': 'surface irrigation',
    'Subsurface Irrigation': 'subsurface irrigation',
    'None': 'none',
  };
  return mapping[type] || 'none';
};


const EditField: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const { loading, error } = useSelector((state: RootState) => state.fields);

  const [fieldData, setFieldData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch field by ID
  useEffect(() => {
    if (id) {
      dispatch(getFieldsById(id))
        .unwrap()
        .then((data) => {
          setFieldData({
            name: data.name,
            area: data.area?.value?.toString() || '',
            location: data.location?.name || '',
            soilType: normalizeSoilType(data.soilType),
            irrigationType: normalizeIrrigationType(data.irrigationSystem?.type),
            coordinates: {
              latitude: data.location?.coordinates?.[1]?.toString() || '',
              longitude: data.location?.coordinates?.[0]?.toString() || '',
            },
            description: data.notes || '',
          });
        })
        .catch((err) => console.error('Error fetching field:', err));
    }
  }, [id, dispatch]);

  const handleSubmit = async (formData: any) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const updatedField = {
        name: formData.name,
        area: {
          value: parseFloat(formData.area),
          unit: 'acre' as const, // 👈 explicit literal type
        },
        location: {
          type: 'Point',
          coordinates: [
            Number(formData.coordinates.longitude) || 0,
            Number(formData.coordinates.latitude) || 0,
          ],
          name: formData.location,
        },
        soilType: denormalizeSoilType(formData.soilType),
        irrigationSystem: {
          type: denormalizeIrrigationType(formData.irrigationType),
          isAutomated: false,
        },
        notes: formData.description,
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

  if (loading || !fieldData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Edit Field: {fieldData.name}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Field updated successfully! Redirecting...
          </Alert>
        )}

        <FieldsForm
          initialData={fieldData}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isEdit={true}
        />
      </Paper>
    </Container>
  );

};

export default EditField;
