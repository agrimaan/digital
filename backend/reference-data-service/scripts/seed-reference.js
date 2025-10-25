// src/pages/admin/AdminFields.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Container, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress, Alert, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Card, CardContent, CardActions, CardHeader, Avatar,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon, Terrain as TerrainIcon
} from '@mui/icons-material';
import axios from 'axios';
import { RootState } from '../../store';

// ==== UI-safe type (post-normalization) ====
type UIField = {
  _id: string;
  name: string;
  address: string;               // always a string (may be empty '')
  owner: { id: string; name: string };
  size: { value: number; unit: string };
  soilType: string;
  cropsCount: number;
  sensorsCount: number;
  createdAt: string;             // ISO
};

// If your env var name differs, update here:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Fallback helpers
const safeString = (v: any, fallback = ''): string =>
  typeof v === 'string' ? v : (v == null ? fallback : String(v));

const safeNumber = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Build a human-friendly address if only coordinates are present
const coordsToText = (coords?: any): string => {
  // GeoJSON: [lng, lat]
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lng, lat] = coords;
    const f = (x: number) => (Number.isFinite(x) ? x.toFixed(5) : '');
    if (Number.isFinite(lat) && Number.isFinite(lng)) return `${f(lat)}, ${f(lng)}`;
  }
  // Non-GeoJSON object: { latitude, longitude }
  if (coords && typeof coords === 'object' && 'latitude' in coords && 'longitude' in coords) {
    const { latitude, longitude } = coords as { latitude?: number; longitude?: number };
    const f = (x?: number) => (Number.isFinite(x as number) ? (x as number).toFixed(5) : '');
    if (latitude != null && longitude != null) return `${f(latitude)}, ${f(longitude)}`;
  }
  return '';
};

// Normalize any backend field shape into UIField
function normalizeField(raw: any): UIField {
  const _id = safeString(raw?._id);
  const name = safeString(raw?.name, 'Unnamed Field');

  // Try common address places: locationName -> location.address -> description -> coordinates
  const address =
    safeString(raw?.locationName) ||
    safeString(raw?.location?.address) ||
    safeString(raw?.description) ||
    coordsToText(raw?.location?.coordinates) ||
    coordsToText(raw?.location?.coords) ||
    coordsToText(raw?.location?.geo) ||
    '';

  // Owner
  const ownerId = safeString(raw?.owner?._id);
  const ownerName =
    safeString(raw?.owner?.name) ||
    safeString(raw?.ownerName) ||
    'Unknown';

  // Size
  const sizeVal = safeNumber(raw?.size?.value ?? raw?.area ?? raw?.size, 0);
  const sizeUnit = safeString(raw?.size?.unit ?? raw?.unit ?? 'ha');

  // Soil type
  const soilType = safeString(raw?.soilType || raw?.soil || '');

  // Crops
  const cropsCount = Array.isArray(raw?.crops) ? raw.crops.length : safeNumber(raw?.cropsCount, 0);

  // Sensors
  const sensorsCount = Array.isArray(raw?.sensors) ? raw.sensors.length : safeNumber(raw?.sensors, 0);

  // Dates
  const createdAt = safeString(raw?.createdAt) || new Date().toISOString();

  return {
    _id,
    name,
    address,
    owner: { id: ownerId, name: ownerName },
    size: { value: sizeVal, unit: sizeUnit },
    soilType,
    cropsCount,
    sensorsCount,
    createdAt
  };
}

const AdminFields: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth || {});

  const [fields, setFields] = useState<UIField[]>([]);
  const [filteredFields, setFilteredFields] = useState<UIField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterSoilType, setFilterSoilType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  // Filter options
  const owners = useMemo(() => {
    const map = new Map<string, string>();
    fields.forEach(f => {
      if (f.owner.id) map.set(f.owner.id, f.owner.name || 'Unknown');
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [fields]);

  const soilTypes = useMemo(() => {
    const set = new Set<string>();
    fields.forEach(f => { if (f.soilType) set.add(f.soilType); });
    return Array.from(set);
  }, [fields]);

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/fields`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });

        const payload = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const normalized: UIField[] = payload.map(normalizeField);
        setFields(normalized);
        setFilteredFields(normalized);
      } catch (err: any) {
        console.error('Error fetching fields:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load fields');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  // Apply filters/search safely
  useEffect(() => {
    let result = [...fields];

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(term) ||
        f.address.toLowerCase().includes(term) ||
        (f.owner.name || '').toLowerCase().includes(term)
      );
    }

    if (filterOwner !== 'all') {
      result = result.filter(f => f.owner.id === filterOwner);
    }

    if (filterSoilType !== 'all') {
      result = result.filter(f => f.soilType === filterSoilType);
    }

    setFilteredFields(result);
  }, [searchTerm, filterOwner, filterSoilType, fields]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const handleDeleteField = (id: string) => {
    setFieldToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/fields/${fieldToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });

      setFields(prev => prev.filter(f => f._id !== fieldToDelete));
      setFilteredFields(prev => prev.filter(f => f._id !== fieldToDelete));
    } catch (err: any) {
      console.error('Error deleting field:', err);
      setError(err?.response?.data?.message || 'Failed to delete field');
    } finally {
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Field Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/fields/create"
          >
            Add New Field
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
              ),
            }}
            size="small"
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Owner</InputLabel>
            <Select value={filterOwner} label="Owner" onChange={(e) => setFilterOwner(e.target.value)}>
              <MenuItem value="all">All Owners</MenuItem>
              {owners.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Soil Type</InputLabel>
            <Select value={filterSoilType} label="Soil Type" onChange={(e) => setFilterSoilType(e.target.value)}>
              <MenuItem value="all">All Soil Types</MenuItem>
              {soilTypes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table"><ViewListIcon /></ToggleButton>
            <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredFields.length} of {fields.length} fields
        </Typography>

        {/* Table view */}
        {viewMode === 'table' && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Soil Type</TableCell>
                  <TableCell>Crops</TableCell>
                  <TableCell>Sensors</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFields.map((f) => (
                  <TableRow key={f._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TerrainIcon color="primary" />
                        <Typography variant="subtitle2">{f.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{f.address || '—'}</TableCell>
                    <TableCell>{f.owner.name || '—'}</TableCell>
                    <TableCell>{f.size.value} {f.size.unit}</TableCell>
                    <TableCell>{f.soilType || '—'}</TableCell>
                    <TableCell>{f.cropsCount}</TableCell>
                    <TableCell>{f.sensorsCount}</TableCell>
                    <TableCell>{formatDate(f.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton component={RouterLink} to={`/admin/fields/${f._id}`} size="small">
                          <TerrainIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton component={RouterLink} to={`/admin/fields/${f._id}/edit`} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteField(f._id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <TerrainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No fields found</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting your search or filters
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && (
          <Grid container spacing={3}>
            {filteredFields.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f._id}>
                <Card>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><TerrainIcon /></Avatar>}
                    title={f.name}
                    subheader={f.address || '—'}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Owner: {f.owner.name || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Size: {f.size.value} {f.size.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Soil: {f.soilType || '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={`${f.cropsCount} crops`} size="small" />
                      <Chip label={`${f.sensorsCount} sensors`} size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={RouterLink} to={`/admin/fields/${f._id}`}>View</Button>
                    <Button size="small" component={RouterLink} to={`/admin/fields/${f._id}/edit`}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteField(f._id)}>Delete</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this field? This action cannot be undone and will remove associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteField} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminFields;
