// src/pages/admin/AdminFields.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Terrain as TerrainIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


// -------------------- Types --------------------
interface Farmer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  name?: string;
}

interface Field {
  _id: string;
  name: string;
  location?: {
    address?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  size?: { value?: number; unit?: string };
  owner?: { _id?: string; name?: string; email?: string };
  soilType?: string;
  crops?: Array<{ _id: string; name: string; status: string }>;
  sensors?: number;
  createdAt?: string;
}

interface FieldFormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sizeValue: number;
  sizeUnit: string;
  soilType: string;
  ownerId: string;
}

// -------------------- Helpers --------------------
const safeStr = (v: any, fb = '') => (typeof v === 'string' ? v : v == null ? fb : String(v));
const safeNum = (v: any, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb);

// Coerce many API shapes to an array
const toArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.fields)) return payload.fields;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.fields)) return payload.data.fields;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

const normalizeField = (raw: any): Field => ({
  _id: safeStr(raw?._id),
  name: safeStr(raw?.name, 'Unnamed Field'),
  location: {
    address: safeStr(raw?.location?.address),
    coordinates: {
      latitude: safeNum(raw?.location?.coordinates?.latitude, 0),
      longitude: safeNum(raw?.location?.coordinates?.longitude, 0),
    },
  },
  size: {
    value: safeNum(raw?.size?.value, 0),
    unit: safeStr(raw?.size?.unit, 'acres'),
  },
  owner: {
    _id: safeStr(raw?.owner?._id),
    name: safeStr(raw?.owner?.name, 'Unknown'),
    email: safeStr(raw?.owner?.email),
  },
  soilType: safeStr(raw?.soilType),
  crops: Array.isArray(raw?.crops) ? raw.crops : [],
  sensors: safeNum(raw?.sensors, 0),
  createdAt: safeStr(raw?.createdAt) || new Date().toISOString(),
});

const normalizeFarmer = (u: any): Farmer => ({
  _id: u?._id || u?.id,
  firstName: u?.firstName || u?.givenName || '',
  lastName: u?.lastName || u?.familyName || '',
  email: u?.email || '',
  name: u?.name || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim(),
});

// -------------------- Component --------------------
const AdminFields: React.FC = () => {
  // Core data
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);

  // Farmers (searchable)
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerSearchTerm, setFarmerSearchTerm] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSoilType, setFilterSoilType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // Form
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    sizeValue: 0,
    sizeUnit: 'acres',
    soilType: '',
    ownerId: '',
  });

  // Select options
  const sizeUnits = ['acres', 'hectares', 'sq meters', 'sq feet'];

  // Derived soil types (from current field list)
  const allSoilTypes = useMemo(() => {
    const s = new Set<string>();
    for (const f of fields) if (f.soilType) s.add(f.soilType);
    return Array.from(s);
  }, [fields]);

  // -------------------- Data Fetchers --------------------
  // --- put these near the other refs at top of component ---
const fieldsCancelRef = useRef<ReturnType<typeof axios.CancelToken.source> | null>(null);
//let fieldsReqSeq = 0;
const fieldsReqSeqRef = React.useRef(0);

// --- replace your fetchFields with this robust version ---
const fetchFields = async (ownerId?: string) => {
  setLoading(true);
  setError(null);

  if (fieldsCancelRef.current) fieldsCancelRef.current.cancel('New fields request');
  const source = axios.CancelToken.source();
  fieldsCancelRef.current = source;

  const seq = ++fieldsReqSeqRef.current; // use .current

  try {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };

    const paramKeyCandidates = ownerId
      ? ['owner', 'ownerId', 'farmer', 'farmerId', 'user', 'userId']
      : [''];

    let serverList: any[] | null = null;

    for (const key of paramKeyCandidates) {
      try {
        const params: any = {};
        if (ownerId && key) params[key] = ownerId;

        const res = await axios.get(`${API_BASE_URL}/api/admin/fields`, {
          headers,
          params,
          cancelToken: source.token,
        });

        const list = toArray(res.data).map(normalizeField);
        serverList = list;
        break;
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        // try next key
      }
    }

    if (!serverList) {
      const res = await axios.get(`${API_BASE_URL}/api/admin/fields`, {
        headers,
        cancelToken: source.token,
      });
      const all = toArray(res.data).map(normalizeField);
      serverList = ownerId ? all.filter(f => safeStr(f.owner?._id) === ownerId) : all;
    }

    // only apply if this is the latest request
    if (seq === fieldsReqSeqRef.current) {
      setFields(serverList);
      setFilteredFields(serverList);
    }
  } catch (e: any) {
    if (axios.isCancel(e)) return;
    if (seq === fieldsReqSeqRef.current) {
      console.error('Error fetching fields:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to load fields');
      setFields([]);
      setFilteredFields([]);
    }
  } finally {
    if (seq === fieldsReqSeqRef.current) setLoading(false);
  }
};


// --- replace your farmer onChange with this ---
const handleFarmerChange = (_: any, newVal: Farmer | null) => {
  setSelectedFarmer(newVal);
  const id = newVal?._id;
  fetchFields(id); // this will try owner/ownerId/farmerId/etc. and fallback
};


  // Debounced/cancellable farmer search
  const cancelSourceRef = useRef<ReturnType<typeof axios.CancelToken.source> | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchFarmers = async (query?: string) => {
    setFarmersLoading(true);

    // cancel any in-flight request
    if (cancelSourceRef.current) cancelSourceRef.current.cancel('New search started');
    const source = axios.CancelToken.source();
    cancelSourceRef.current = source;

    const headers = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };

    // Try typical query param names used by backends
    const queryParamKeys = query ? ['search', 'q', 'query'] : [''];
    for (const key of queryParamKeys) {
      try {
        const params: any = { role: 'farmer' };
        if (query && key) params[key] = query;

        const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers,
          params,
          cancelToken: source.token,
        });

        const list = toArray(res.data).map(normalizeFarmer).filter(f => f._id);
        setFarmers(list);
        setFarmersLoading(false);
        return;
      } catch (err: any) {
        if (axios.isCancel(err)) return; // cancelled; bail out
        // else try next param key
      }
    }

    // Fallback: no search param supported — load all farmers (role filter), then client-filter
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers,
        params: { role: 'farmer' },
        cancelToken: cancelSourceRef.current?.token,
      });
      const list = toArray(res.data).map(normalizeFarmer).filter(f => f._id);
      const filtered = query
        ? list.filter(f =>
            `${f.firstName} ${f.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
            f.email.toLowerCase().includes(query.toLowerCase())
          )
        : list;
      setFarmers(filtered);
    } catch {
      setFarmers([]);
    } finally {
      setFarmersLoading(false);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchFields();
    fetchFarmers(); // initial list
    console.log('fields:', fields.length, fields);
    console.log('filteredFields:', filteredFields.length, filteredFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce farmer search on input change
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const q = farmerSearchTerm.trim();
      if (q.length === 0) fetchFarmers();
      else fetchFarmers(q);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerSearchTerm]);

  // -------------------- Filtering & Search --------------------
  useEffect(() => {
    const src = Array.isArray(fields) ? fields : [];
    let result = src.slice();

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(f =>
        safeStr(f.name).toLowerCase().includes(term) ||
        safeStr(f.location?.address).toLowerCase().includes(term) ||
        safeStr(f.owner?.name).toLowerCase().includes(term)
      );
    }

    if (selectedFarmer?._id) {
      result = result.filter(f => safeStr(f.owner?._id) === selectedFarmer._id);
    }

    if (filterSoilType !== 'all') {
      result = result.filter(f => safeStr(f.soilType) === filterSoilType);
    }

    setFilteredFields(result);
  }, [searchTerm, selectedFarmer, filterSoilType, fields]);

  // -------------------- UI Handlers --------------------
  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };


  const handleSelectAllFarmers = () => {
    setSelectedFarmer(null);
    setFarmerSearchTerm('');
    fetchFarmers(); // refresh default list
    fetchFields();  // clear owner filter on fields
  };

  const handleAddField = () => {
    setEditingField(null);
    setFormData({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      sizeValue: 0,
      sizeUnit: 'acres',
      soilType: '',
      ownerId: selectedFarmer?._id || '',
    });
    setAddEditDialogOpen(true);
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setFormData({
      name: field.name || '',
      address: field.location?.address || '',
      latitude: field.location?.coordinates?.latitude ?? 0,
      longitude: field.location?.coordinates?.longitude ?? 0,
      sizeValue: field.size?.value ?? 0,
      sizeUnit: field.size?.unit || 'acres',
      soilType: field.soilType || '',
      ownerId: field.owner?._id || '',
    });
    setAddEditDialogOpen(true);
  };

  const handleSaveField = async () => {
    try {
      const payload = {
        name: formData.name,
        location: {
          address: formData.address,
          coordinates: { latitude: formData.latitude, longitude: formData.longitude },
        },
        size: { value: formData.sizeValue, unit: formData.sizeUnit },
        soilType: formData.soilType,
        owner: formData.ownerId,
      };

      if (editingField?._id) {
        await axios.put(`${API_BASE_URL}/api/admin/fields/${editingField._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        setSuccessMessage('Field updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/fields`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        setSuccessMessage('Field created successfully');
      }
      setAddEditDialogOpen(false);
      fetchFields(selectedFarmer?._id);
    } catch (e: any) {
      console.error('Error saving field:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to save field');
    }
  };

  const handleDeleteField = (id: string) => {
    setFieldToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/fields/${fieldToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      setSuccessMessage('Field deleted successfully');
      setFields(prev => prev.filter(f => f._id !== fieldToDelete));
      setFilteredFields(prev => prev.filter(f => f._id !== fieldToDelete));
    } catch (e: any) {
      console.error('Error deleting field:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to delete field');
    } finally {
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  // -------------------- Render --------------------
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Field Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddField}>
            Add New Field
          </Button>
        </Box>

        {/* Farmer Search */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Autocomplete
                options={farmers}
                loading={farmersLoading}
                filterOptions={(x) => x} // server-driven; don't client-filter beyond what's provided
                isOptionEqualToValue={(option, value) => option._id === value._id}
                getOptionLabel={(o) => {
                  const name =
                    (o.firstName || o.lastName)
                      ? `${o.firstName ?? ''} ${o.lastName ?? ''}`.trim()
                      : (o.name ?? '');
                  return name && o.email ? `${name} (${o.email})` : (name || o.email || '');
                }}
                value={selectedFarmer}
                onChange={(_, newValue) => {
                  setSelectedFarmer(newValue);
                  fetchFields(newValue?._id);
                }}
                inputValue={farmerSearchTerm}
                onInputChange={(_, newInput) => setFarmerSearchTerm(newInput)}
                noOptionsText={farmersLoading ? 'Searching…' : 'No farmers found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Farmer by Name or Email"
                    placeholder="Type to search farmers…"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleSelectAllFarmers}
                startIcon={<PersonIcon />}
              >
                Select All Farmers
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Soil Type</InputLabel>
            <Select
              value={filterSoilType}
              label="Soil Type"
              onChange={(e) => setFilterSoilType(e.target.value)}
            >
              <MenuItem value="all">All Soil Types</MenuItem>
              {allSoilTypes.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {Array.isArray(filteredFields) ? filteredFields.length : 0} of{' '}
          {Array.isArray(fields) ? fields.length : 0} fields
          {selectedFarmer && ` for ${selectedFarmer.firstName} ${selectedFarmer.lastName}`}
        </Typography>

        {/* Table View */}
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
                {(Array.isArray(filteredFields) ? filteredFields : []).map((field) => (
                  <TableRow key={field._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TerrainIcon color="primary" />
                        <Typography variant="subtitle2">{field.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{field.location?.address || '—'}</TableCell>
                    <TableCell>{field.owner?.name || '—'}</TableCell>
                    <TableCell>
                      {field.size?.value ?? 0} {field.size?.unit || 'acres'}
                    </TableCell>
                    <TableCell>{field.soilType || '—'}</TableCell>
                    <TableCell>{Array.isArray(field.crops) ? field.crops.length : 0}</TableCell>
                    <TableCell>{field.sensors ?? 0}</TableCell>
                    <TableCell>{formatDate(field.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          component={RouterLink}
                          to={`/admin/fields/${field._id}`}
                          size="small"
                        >
                          <TerrainIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditField(field)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteField(field._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <Grid container spacing={3}>
            {(Array.isArray(filteredFields) ? filteredFields : []).map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field._id}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <TerrainIcon />
                      </Avatar>
                    }
                    title={field.name}
                    subheader={field.location?.address || '—'}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Owner: {field.owner?.name || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Size: {field.size?.value ?? 0} {field.size?.unit || 'acres'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Soil: {field.soilType || '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${Array.isArray(field.crops) ? field.crops.length : 0} crops`}
                        size="small"
                      />
                      <Chip label={`${field.sensors ?? 0} sensors`} size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={RouterLink} to={`/admin/fields/${field._id}`}>
                      View
                    </Button>
                    <Button size="small" onClick={() => handleEditField(field)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteField(field._id)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {Array.isArray(filteredFields) && filteredFields.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TerrainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No fields found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFarmer
                ? `No fields found for ${selectedFarmer.firstName} ${selectedFarmer.lastName}`
                : 'Try adjusting your search or filter criteria'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={addEditDialogOpen} onClose={() => setAddEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Owner</InputLabel>
                <Select
                  value={formData.ownerId}
                  label="Owner"
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value as string })}
                >
                  {(Array.isArray(farmers) ? farmers : []).map((f) => (
                    <MenuItem key={f._id} value={f._id}>
                      {f.firstName} {f.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Size"
                type="number"
                value={formData.sizeValue}
                onChange={(e) =>
                  setFormData({ ...formData, sizeValue: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.sizeUnit}
                  label="Unit"
                  onChange={(e) => setFormData({ ...formData, sizeUnit: e.target.value as string })}
                >
                  {sizeUnits.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Soil Type"
                value={formData.soilType}
                onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveField} variant="contained">
            {editingField ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this field? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteField} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminFields;
