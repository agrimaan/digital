import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';

interface Owner { _id: string; name: string }
interface Farm  { _id: string; name: string; owner?: Owner }

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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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

const extractOwnersFromCrops = (cropsArray: Crop[]): FieldOwner[] => {
  const map = new Map<string, FieldOwner>();
  for (const c of cropsArray) {
    const id = normalizeId(c.farmerId) || normalizeId(c.fieldId?.owner?._id);
    if (!id) continue;
    const name = normalizeName(c);
    if (!map.has(id)) map.set(id, { id, name });
  }
  return Array.from(map.values());
};

const uniqOwners = (list: FieldOwner[]) => {
  const map = new Map<string, FieldOwner>();
  for (const o of list) {
    if (!o?.id) continue;
    if (!map.has(o.id)) map.set(o.id, o);
    // prefer non-empty names if duplicates appear
    else if (o.name && o.name !== 'Unknown') map.set(o.id, o);
  }
  return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
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

  // Try to fetch farmers from a dedicated admin endpoint.
  // We try two common endpoints; the first that succeeds is used.
  const fetchFarmers = async (): Promise<FieldOwner[]> => {
    const headers = { Authorization: `Bearer ${tokenRef.current || ''}` };

    // Each candidate should return an array of users with {_id, name} or {id, name}
    const candidates = [
      `${API_BASE_URL}/api/admin/users?role=farmer`
    ];

    for (const url of candidates) {
      try {
        const res = await axios.get(url, { headers });
        const payload = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

        if (Array.isArray(payload) && payload.length >= 0) {
          const owners: FieldOwner[] = payload.map((u: any) => ({
            id: normalizeId(u._id ?? u.id),
            name: u.name || u.fullName || u.displayName || u.email || 'Unknown',
          })).filter(o => o.id);
          if (owners.length) return owners;
          // If endpoint exists but empty, still return [] so we don't try others.
          return [];
        }
      } catch (_) {
        // try next candidate
      }
    }

    // none worked
    return [];
  };

  // Fetch crops (optionally filtered by farmer)
  const fetchCrops = async (farmerId: string = '') => {
    const headers = { Authorization: `Bearer ${tokenRef.current || ''}` };
    const url = farmerId
      ? `${API_BASE_URL}/api/admin/crops?farmerId=${encodeURIComponent(farmerId)}`
      : `${API_BASE_URL}/api/admin/crops`;

    const response = await axios.get(url, { headers });
    const data = response.data;
    const cropsArray: Crop[] = Array.isArray(data)
      ? data
      : data?.data?.crops || data?.data || [];
    console.log("cropsArray:", cropsArray);
    return cropsArray;
  };

  const loadPage = async (farmerId: string = '') => {
    setLoading(true);
    setError('');
    try {
      // parallelize farmer list (unfiltered) + crops (possibly filtered)
      const [farmerList, cropList] = await Promise.all([
        fetchFarmers().catch(() => [] as FieldOwner[]),
        fetchCrops(farmerId),
      ]);

      setCrops(cropList);

      // If farmer list is empty (endpoint missing/unavailable), fall back to extracting from crops
      const ownersFromCrops = extractOwnersFromCrops(farmerId ? await fetchCrops('') : cropList);
      const merged = uniqOwners([...(farmerList || []), ...ownersFromCrops]);
      setAllOwners(merged);
    } catch (err: any) {
      console.error('Error loading admin crops:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load crops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPage(''); }, []);

  const handleOwnerChange = async (e: SelectChangeEvent<string>) => {
    const farmerId = e.target.value ?? '';
    setSelectedOwner(farmerId);
    await loadPage(farmerId);
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
        <Button onClick={() => loadPage(selectedOwner)} variant="contained" sx={{ mt: 2 }}>
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
                    Owner:{' '}
                    {typeof crop.farmerId === 'object'
                      ? crop.farmerId?.name
                      : crop.farmerName || crop.fieldId?.owner?.name || 'Unknown'}
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
