import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// ---- Type Definitions ----
interface Owner {
  _id: string;
  name: string;
}

interface Farm {
  _id: string;
  name: string;
  owner?: Owner;
}

interface Crop {
  _id: string;
  name: string;
  type?: string;
  status?: string;
  health?: string;
  farmerId?: string;
  farmerName?: string;
  farmId?: Farm;
}

interface FieldOwner {
  id: string;
  name: string;
}

const AdminCrops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fieldOwners, setFieldOwners] = useState<FieldOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/admin/crops`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const cropsData = response.data;

        const cropsArray: Crop[] = Array.isArray(cropsData)
          ? cropsData
          : cropsData?.data?.crops || cropsData?.data || [];

        setCrops(cropsArray);

        // ---- Extract unique owners ----
        const uniqueOwners = Array.from(
          new Set(
            cropsArray.map((crop: Crop) => crop.farmId?.owner?._id || crop.farmerId)
          )
        )
          .filter((ownerId): ownerId is string => typeof ownerId === 'string' && ownerId !== '')
          .map((ownerId: string) => {
            const owner = cropsArray.find(
              (crop: Crop) =>
                (crop.farmId?.owner?._id || crop.farmerId) === ownerId
            )?.farmId?.owner;
            return {
              id: ownerId,
              name: owner?.name || 'Unknown Owner',
            };
          });

        setFieldOwners(uniqueOwners);
      } catch (err: unknown) {
        console.error('Error fetching crops:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOwner(e.target.value);
  };

  const filteredCrops =
    selectedOwner === ''
      ? crops
      : crops.filter(
          (crop) =>
            crop.farmId?.owner?._id === selectedOwner ||
            crop.farmerId === selectedOwner
        );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">{error}</Typography>
        <Button onClick={() => window.location.reload()} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Crop Management (Admin)
      </Typography>

      <Box mb={3}>
        <TextField
          select
          label="Filter by Owner"
          value={selectedOwner}
          onChange={handleOwnerChange}
          fullWidth
        >
          <MenuItem value="">All Owners</MenuItem>
          {fieldOwners.map((owner) => (
            <MenuItem key={owner.id} value={owner.id}>
              {owner.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Grid container spacing={2}>
        {filteredCrops.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
            No crops found.
          </Typography>
        ) : (
          filteredCrops.map((crop) => (
            <Grid item xs={12} sm={6} md={4} key={crop._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">
                    {crop.name || 'Unnamed Crop'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {crop.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Owner: {crop.farmId?.owner?.name || crop.farmerName || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {crop.status || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Health: {crop.health || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default AdminCrops;
