import React, { useEffect, useRef, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

interface Owner { _id: string; name: string }
interface Farm { _id: string; name: string; owner?: Owner }

interface Crop {
  _id: string;
  name: string;
  type?: string;
  status?: string;
  health?: string;
  farmerId?: string | { _id: string; name?: string };
  farmerName?: string;
  fieldId?: Farm;
}

interface FieldOwner { id: string; name: string }

// ---------- helpers ----------
const normalizeId = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && (val as any)._id) return String((val as any)._id);
  try { return String(val as any); } catch { return ''; }
};

const normalizeName = (crop: Crop): string => {
  const embedded = typeof crop.farmerId === 'object' ? crop.farmerId?.name : undefined;
  return embedded || crop.farmerName || crop.fieldId?.owner?.name || 'Unknown';
};

const extractOwners = (cropsArray: Crop[]): FieldOwner[] => {
  const map = new Map<string, FieldOwner>();
  for (const c of cropsArray) {
    const id = normalizeId(c.farmerId) || normalizeId(c.fieldId?.owner?._id);
    if (!id) continue;
    const name = normalizeName(c);
    if (!map.has(id)) map.set(id, { id, name });
  }
  return Array.from(map.values());
};

// ---------- component ----------
const AdminCrops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [allOwners, setAllOwners] = useState<FieldOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>(''); // '' = All
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const tokenRef = useRef<string | null>(null);
  useEffect(() => { tokenRef.current = localStorage.getItem('token'); }, []);

  const fetchCrops = async (farmerId: string = '') => {
    setLoading(true);
    setError('');
    try {
      const url = farmerId
        ? `${API_BASE_URL}/api/admin/crops?farmerId=${encodeURIComponent(farmerId)}`
        : `${API_BASE_URL}/api/admin/crops`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${tokenRef.current || ''}` },
      });

      const data = response.data;
      const cropsArray: Crop[] = Array.isArray(data)
        ? data
        : data?.data?.crops || data?.data || [];

      setCrops(cropsArray);

      // Build owners only from the unfiltered dataset
      if (!farmerId) {
        setAllOwners(extractOwners(cropsArray));
      }
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

  useEffect(() => { fetchCrops(''); }, []);

  const handleOwnerChange = async (e: SelectChangeEvent<string>) => {
    const farmerId = e.target.value ?? '';
    setSelectedOwner(farmerId);
    await fetchCrops(farmerId); // refetch with or without filter
  };

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
        <Button onClick={() => fetchCrops(selectedOwner)} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🌾 Crop Management (Admin)
      </Typography>

      <Box mb={3}>
        <FormControl fullWidth>
          <InputLabel id="owner-label">Filter by Farmer / Owner</InputLabel>
          <Select
            labelId="owner-label"
            label="Filter by Farmer / Owner"
            value={selectedOwner}
            onChange={handleOwnerChange}
            displayEmpty
          >
            <MenuItem value="">
              <em>All Farmers</em>
            </MenuItem>
            {allOwners.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {crops.length === 0 ? (
          <Box px={2} py={1}>
            <Typography variant="body1" color="text.secondary">
              No crops found.
            </Typography>
          </Box>
        ) : (
          crops.map((crop) => (
            <Grid item xs={12} sm={6} md={4} key={crop._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{crop.name || 'Unnamed Crop'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {crop.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Owner: {normalizeName(crop)}
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
