import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, TextField, Typography, Grid, MenuItem, CircularProgress, Alert,
  FormControl, InputLabel, Select, Drawer, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody, Tooltip, Stack, Divider
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Add, Edit, Delete, Visibility, Clear } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getFields } from '../../features/fields/fieldSlice';
import { getCrops, addCrop, updateCrop, deleteCrop, Crop } from '../../features/crops/cropSlice';
import { fetchRefCrops, fetchRefVarieties } from '../../services/cropManagement';

/* ============== Reference-service types ============== */
type RefCrop = { _id: string; slug: string; commonName: string; scientificName: string; synonyms?: string[] };
type RefVariety = { _id: string; cropSlug: string; name: string; season?: string; zone?: string; type?: string };

/* ============== Helpers ============== */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const lowercaseFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

/* ============== UI constants from Crop ============== */
const SOIL_TYPES: Crop['soilType'][] = ['loam', 'clay', 'sandy', 'silty', 'peaty', 'chalky', 'alluvial'];
const IRRIGATION: Crop['irrigationMethod'][] = ['drip', 'sprinkler', 'flood', 'rainfed', 'center-pivot'];
const SEED_SOURCES: Crop['seedSource'][] = ['own', 'market', 'government', 'supplier'];
const HEALTH: NonNullable<Crop['healthStatus']>[] = ['excellent', 'good', 'fair', 'poor', 'diseased'];
const STAGES: NonNullable<Crop['growthStage']>[] = ['seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested', 'failed'];

type FieldDoc = { _id: string; name?: string; description?: string };
const numericKeys = new Set<keyof Crop>(['plantedArea', 'expectedYield', 'actualYield', 'pricePerUnit', 'totalValue']);

/* ============== Component ============== */
const CropManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { crops, loading, error } = useSelector((s: RootState) => s.crop);

  const [filterName, setFilterName] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [filterStage, setFilterStage] = useState('');

  const [success, setSuccess] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  const [fields, setFields] = useState<FieldDoc[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  /* reference-service state */
  const [cropInput, setCropInput] = useState('');
  const debouncedCropInput = useDebouncedValue(cropInput, 250);
  const [cropOptions, setCropOptions] = useState<RefCrop[]>([]);
  const [cropOptionsLoading, setCropOptionsLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<RefCrop | null>(null);
  const [cropDropdownOpen, setCropDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [varietyOptions, setVarietyOptions] = useState<string[]>([]);
  const [varietiesLoading, setVarietiesLoading] = useState(false);

  /* caches */
  const cropsCache = useRef<Map<string, RefCrop[]>>(new Map());
  const varietiesCache = useRef<Map<string, string[]>>(new Map());

  /* drawer/dialog state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingCrop, setViewingCrop] = useState<Crop | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* form state */
  const [formData, setFormData] = useState<Omit<Crop, 'location'>>({
    name: '',
    scientificName: '',
    variety: '',
    fieldId: '',
    plantedArea: 0,
    plantingDate: '',
    expectedHarvestDate: '',
    expectedYield: 0,
    soilType: 'loam',
    irrigationMethod: 'drip',
    seedSource: 'own',
    healthStatus: 'good',
    growthStage: 'seedling',
  });

  /* load list + fields */
  useEffect(() => {
    dispatch(getCrops());
    loadFields();
  }, [dispatch]);

  const loadFields = async () => {
    try {
      setFieldsLoading(true);
      const resultAction = await dispatch(getFields()).unwrap();
      setFields(resultAction as FieldDoc[]);
    } catch (err: any) {
      setListingError(err?.response?.data?.message || err?.message || 'Failed to load fields');
    } finally {
      setFieldsLoading(false);
    }
  };

  /* reference-service crop options */
  useEffect(() => {
    const q = debouncedCropInput.trim();
    if (!q) {
      setCropOptions([]);
      return;
    }
    const cacheHit = cropsCache.current.get(q);
    if (cacheHit) {
      setCropOptions(cacheHit);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setCropOptionsLoading(true);
        const list: RefCrop[] = await fetchRefCrops(q);
        if (!cancelled) {
          cropsCache.current.set(q, list);
          setCropOptions(list);
        }
      } catch {
        if (!cancelled) setCropOptions([]);
      } finally {
        if (!cancelled) setCropOptionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedCropInput]);

  /* commit crop choice and load varieties */
  const commitCrop = async (crop: RefCrop | null, fallbackText?: string) => {
    if (crop) {
      setSelectedCrop(crop);
      setFormData(prev => ({
        ...prev,
        name: crop.commonName,
        scientificName: crop.scientificName || prev.scientificName || '',
      }));
      const slug = crop.slug;
      if (slug) {
        const cached = varietiesCache.current.get(slug);
        if (cached) {
          setVarietyOptions(cached);
          setFormData(prev => ({
            ...prev,
            variety:
              prev.variety && cached.includes(prev.variety)
                ? prev.variety
                : cached[0] || '',
          }));
          return;
        }
        try {
          setVarietiesLoading(true);
          const arr: string[] = await fetchRefVarieties(slug);
          varietiesCache.current.set(slug, arr);
          setVarietyOptions(arr);
          setFormData(prev => ({
            ...prev,
            variety:
              prev.variety && arr.includes(prev.variety)
                ? prev.variety
                : arr[0] || '',
          }));
        } catch {
          setVarietyOptions([]);
        } finally {
          setVarietiesLoading(false);
        }
      } else {
        setVarietyOptions([]);
      }
    } else if (fallbackText) {
      setSelectedCrop(null);
      setFormData(prev => ({
        ...prev,
        name: fallbackText,
        scientificName: prev.scientificName || '',
      }));
      setVarietyOptions([]);
    }
  };

  const handleCropBlur = () => {
    const text = cropInput.trim();
    if (!text) return;
    const exact = cropOptions.find(c => c.commonName.toLowerCase() === text.toLowerCase());
    if (exact) commitCrop(exact);
    else commitCrop(null, text);
  };

  /* field dropdown options */
  const fieldOptions = useMemo(
    () => fields.map(f => ({ id: f._id, label: f.name || 'Unnamed Field', description: f.description || '' })),
    [fields]
  );

  /* form handlers */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev =>
      numericKeys.has(name as keyof Crop)
        ? { ...prev, [name]: value === '' ? ('' as any) : Number(value) }
        : { ...prev, [name]: value }
    );
  };

  const handleFieldSelect = (e: any) => {
    const selectedId = e.target.value as string;
    setFormData(prev => ({ ...prev, fieldId: selectedId }));
  };

  /* CRUD */
  const openAdd = () => {
    setEditingId(null);
    setSelectedCrop(null);
    setCropInput('');
    setVarietyOptions([]);
    setFormData({
      name: '',
      scientificName: '',
      variety: '',
      fieldId: '',
      plantedArea: 0,
      plantingDate: '',
      expectedHarvestDate: '',
      expectedYield: 0,
      soilType: 'loam',
      irrigationMethod: 'drip',
      seedSource: 'own',
      healthStatus: 'good',
      growthStage: 'seedling',
    });
    setDrawerOpen(true);
  };

  const openEdit = (row: Crop) => {
    setEditingId(row._id!);
    setFormData({
      ...row,
      plantingDate: row.plantingDate.split('T')[0],
      expectedHarvestDate: row.expectedHarvestDate.split('T')[0],
      variety: row.variety || '',
      scientificName: row.scientificName || '',
      fieldId: row.fieldId || '',
    });
    setCropInput(row.name || '');
    setSelectedCrop(row.name ? { _id: '', slug: (row.name || '').toLowerCase(), commonName: row.name, scientificName: row.scientificName || '' } : null);
    setDrawerOpen(true);

    const slug = (row.name || '').toLowerCase();
    if (slug) {
      const cached = varietiesCache.current.get(slug);
      if (cached) setVarietyOptions(cached);
      else (async () => {
        try {
          setVarietiesLoading(true);
          const arr: string[] = await fetchRefVarieties(slug);
          varietiesCache.current.set(slug, arr);
          setVarietyOptions(arr);
        } catch {
          setVarietyOptions([]);
        } finally {
          setVarietiesLoading(false);
        }
      })();
    }
  };

  const openView = (row: Crop) => {
    setViewingCrop(row);
    setDialogOpen(true);
  };

  const handleDeleteClick = (crop: Crop) => {
    setCropToDelete(crop);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCropToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (cropToDelete) {
      try {
        await dispatch(deleteCrop(cropToDelete._id!)).unwrap();
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
        dispatch(getCrops());
      } catch (err: any) {
        setListingError(err?.response?.data?.message || err?.message || 'Failed to delete crop');
      }
    }
    setDeleteDialogOpen(false);
    setCropToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      if (!formData.fieldId) throw new Error('Please select a Field.');
      const payload: Crop = {
        ...formData,
        soilType: lowercaseFirst(formData.soilType || '') as Crop['soilType'],
        irrigationMethod: lowercaseFirst(formData.irrigationMethod || '') as Crop['irrigationMethod'],
        seedSource: lowercaseFirst(formData.seedSource || '') as Crop['seedSource'],
        healthStatus: (formData.healthStatus ? (lowercaseFirst(formData.healthStatus) as Crop['healthStatus']) : undefined),
        growthStage: (formData.growthStage ? (lowercaseFirst(formData.growthStage) as Crop['growthStage']) : undefined),
        plantedArea: Number(formData.plantedArea) || 0,
        expectedYield: Number(formData.expectedYield) || 0,
        actualYield: formData.actualYield != null ? Number(formData.actualYield) : undefined,
        pricePerUnit: formData.pricePerUnit != null ? Number(formData.pricePerUnit) : undefined,
        totalValue: formData.totalValue != null ? Number(formData.totalValue) : undefined
      };

      if (editingId) await dispatch(updateCrop({ id: editingId, data: payload })).unwrap();
      else await dispatch(addCrop(payload)).unwrap();

      setDrawerOpen(false);
      dispatch(getCrops());
    } catch (err: any) {
      setListingError(err.response?.data?.error?.message || 'Operation failed');
      setTimeout(() => setListingError(''), 5000);
    }
  };

  const anyLoading = loading || fieldsLoading;

  const filteredCrops = useMemo(() => {
    return crops.filter((c) => {
      const cropName = c.name?.toLowerCase() || '';
      const searchName = filterName?.toLowerCase() || '';
      const matchesName = cropName.includes(searchName);

      const matchesField = !filterField || c.fieldId === filterField;
      const matchesHealth = !filterHealth || c.healthStatus === filterHealth;
      const matchesStage = !filterStage || c.growthStage === filterStage;
      return matchesName && matchesField && matchesHealth && matchesStage;
    });
  }, [crops, filterName, filterField, filterHealth, filterStage]);

  const clearFilters = () => {
    setFilterName('');
    setFilterField('');
    setFilterHealth('');
    setFilterStage('');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Crop Management</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={openAdd}>Add Crop</Button>
      </Box>

      <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 2, backgroundColor: '#fafafa' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField label="Crop Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} size="small" sx={{ minWidth: 180 }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Field</InputLabel>
            <Select value={filterField} label="Field" onChange={(e) => setFilterField(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {fieldOptions.map(f => (<MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Health</InputLabel>
            <Select value={filterHealth} label="Health" onChange={(e) => setFilterHealth(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {HEALTH.map(h => (<MenuItem key={h} value={h}>{capitalize(h)}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Stage</InputLabel>
            <Select value={filterStage} label="Stage" onChange={(e) => setFilterStage(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {STAGES.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Clear />} onClick={clearFilters}>Clear</Button>
        </Stack>
      </Box>

      {(error || listingError) && <Alert severity="error" sx={{ mb: 2 }}>{String(error || listingError)}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {anyLoading && <CircularProgress />}

      <Box sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Variety</TableCell>
              <TableCell>Scientific</TableCell>
              <TableCell>Field</TableCell>
              <TableCell>Planting</TableCell>
              <TableCell>Harvest (exp.)</TableCell>
              <TableCell>Growth Stage</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCrops.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.variety || '-'}</TableCell>
                <TableCell>{c.scientificName || '-'}</TableCell>
                <TableCell>{fields.find(f => f._id === c.fieldId)?.name || '-'}</TableCell>
                <TableCell>{c.plantingDate ? new Date(c.plantingDate).toLocaleDateString('en-GB') : '-'}</TableCell>
                <TableCell>{c.expectedHarvestDate ? new Date(c.expectedHarvestDate).toLocaleDateString('en-GB') : '-'}</TableCell>
                <TableCell>{capitalize(c.growthStage || '')}</TableCell>
                <TableCell align="center">
                  <Tooltip title="View"><IconButton onClick={() => openView(c)}><Visibility /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton onClick={() => openEdit(c)}><Edit /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteClick(c)}><Delete /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!filteredCrops.length && !anyLoading && (
              <TableRow><TableCell colSpan={7} align="center">No crops found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>{editingId ? 'Edit Crop' : 'Add Crop'}</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={cropOptions}
                loading={cropOptionsLoading}
                autoHighlight
                value={selectedCrop}
                inputValue={cropInput}
                onInputChange={(_, v) => { setCropInput(v); setCropDropdownOpen(!!v.trim()); }}
                onChange={(_, v) => { commitCrop((v as RefCrop) ?? null); setCropDropdownOpen(false); }}
                onBlur={handleCropBlur}
                getOptionLabel={(opt) => (opt ? (opt as RefCrop).commonName : '')}
                isOptionEqualToValue={(a, b) => a.slug === b.slug}
                open={cropDropdownOpen}
                onOpen={() => { if (cropInput.trim()) setCropDropdownOpen(true); }}
                onClose={() => setCropDropdownOpen(false)}
                renderInput={(params) => (
                  <TextField {...params} label="Crop Name" fullWidth required
                    InputProps={{ ...params.InputProps, endAdornment: (<>{cropOptionsLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Scientific Name"
                name="scientificName"
                value={formData.scientificName || ''}
                onChange={handleChange}
                fullWidth
                placeholder="Auto-filled from reference"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                disabled={!formData.name}
                freeSolo
                options={varietyOptions}
                loading={varietiesLoading}
                value={formData.variety || ''}
                onInputChange={(_, v) => setFormData(p => ({ ...p, variety: v || '' }))}
                onChange={(_, v) => setFormData(p => ({ ...p, variety: (v as string) || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Variety" fullWidth placeholder="Select or type variety"
                    InputProps={{ ...params.InputProps, endAdornment: (<>{varietiesLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="field-select-label">Field</InputLabel>
                <Select labelId="field-select-label" label="Field" value={formData.fieldId || ''} onChange={handleFieldSelect}>
                  {fieldOptions.length === 0 && <MenuItem value="" disabled>No fields found — add a field first</MenuItem>}
                  {fieldOptions.map(f => (<MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Planted Area (ha)" name="plantedArea" type="number" value={formData.plantedArea} onChange={handleChange} fullWidth required inputProps={{ step: '0.01', min: '0' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Planted Date" name="plantingDate" type="date" value={formData.plantingDate || ''} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split('T')[0] }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Harvest Date" name="expectedHarvestDate" type="date" value={formData.expectedHarvestDate || ''} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Expected Yield" name="expectedYield" type="number" value={formData.expectedYield} onChange={handleChange} fullWidth required inputProps={{ step: '0.01', min: '0' }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Soil Type" name="soilType" value={formData.soilType} onChange={handleChange} fullWidth required>
                {SOIL_TYPES.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Irrigation Method" name="irrigationMethod" value={formData.irrigationMethod} onChange={handleChange} fullWidth required>
                {IRRIGATION.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Seed Source" name="seedSource" value={formData.seedSource} onChange={handleChange} fullWidth required>
                {SEED_SOURCES.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Health Status" name="healthStatus" value={formData.healthStatus || 'good'} onChange={handleChange} fullWidth>
                {HEALTH.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Growth Stage" name="growthStage" value={formData.growthStage || 'seedling'} onChange={handleChange} fullWidth>
                {STAGES.map(s => (<MenuItem key={s} value={s}>{capitalize(s)}</MenuItem>))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
                <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
                <Button type="submit" variant="contained">{editingId ? 'Save Changes' : 'Add Crop'}</Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Drawer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crop Details</DialogTitle>
        <DialogContent dividers>
          {viewingCrop ? (
            <Stack spacing={1.2}>
              <Typography><b>Name:</b> {viewingCrop.name}</Typography>
              {viewingCrop.variety && <Typography><b>Variety:</b> {viewingCrop.variety}</Typography>}
              {viewingCrop.scientificName && <Typography><b>Scientific:</b> <i>{viewingCrop.scientificName}</i></Typography>}
              <Typography><b>Field:</b> {fields.find(f => f._id === viewingCrop.fieldId)?.name || '—'}</Typography>
              <Typography><b>Planting:</b> {viewingCrop.plantingDate ? new Date(viewingCrop.plantingDate).toLocaleDateString('en-GB') : '—'}</Typography>
              <Typography><b>Expected Harvest:</b> {viewingCrop.expectedHarvestDate ? new Date(viewingCrop.expectedHarvestDate).toLocaleDateString('en-GB') : '—'}</Typography>
              <Typography><b>Soil:</b> {capitalize(viewingCrop.soilType)} | <b>Irrigation:</b> {capitalize(viewingCrop.irrigationMethod)}</Typography>
            </Stack>
          ) : <Typography>—</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete crop "{cropToDelete?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      {deleteSuccess}
    </Box>
  );
};

export default CropManagement;
