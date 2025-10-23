// src/pages/EditSensor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../../store';
import {
  getSensorById,
  updateSensor,
  type Sensor,
} from '../../features/sensors/sensorSlice';


// If you have the Fields slice as shared earlier, uncomment these:
// import { getFields } from '../../features/fields/fieldSlice';
// type FieldOption = { id: string; label: string };
// (Assumes your fields selector lives at state.field.fields and items have _id/name)

const TYPE_OPTIONS: Sensor['type'][] = [
  'soil_moisture',
  'temperature',
  'humidity',
  'rainfall',
  'light',
  'wind',
  'soil_nutrient',
  'water_level',
  'other',
];

const STATUS_OPTIONS: Sensor['status'][] = ['active', 'inactive', 'maintenance', 'error'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`sensor-tabpanel-${index}`} aria-labelledby={`sensor-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EditSensor: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { sensor, loading, error } = useSelector((s: RootState) => s.sensor);

  // If you have fields in Redux, you can load & map them:
  // const { fields } = useSelector((s: RootState) => s.field);
  // const fieldOptions: FieldOption[] = useMemo(
  //   () => (fields || []).map((f: any) => ({ id: f._id, label: f.name || 'Unnamed Field' })),
  //   [fields]
  // );

  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');

  // Local editable copy (keeps form responsive even if slice changes)
  const [edited, setEdited] = useState<Partial<Sensor> | null>(null);

  useEffect(() => {
    // Load the sensor
    dispatch(getSensorById(id));
    // Optionally load fields:
    // dispatch(getFields());
  }, [dispatch, id]);

  useEffect(() => {
    if (sensor) {
      // Initialize local copy from fetched sensor
      setEdited({
        ...sensor,
        // ensure optional objects exist to avoid uncontrolled inputs
        location: sensor.location || { type: 'Point', coordinates: [0, 0] },
        measurementRange: sensor.measurementRange || { min: 0, max: 0 },
      });
    }
  }, [sensor]);

  const handleTabChange = (_: React.SyntheticEvent, v: number) => setTabValue(v);

  const getStatusColor = (s?: Sensor['status']) => {
    switch (s) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getBatteryColor = (level?: number) => {
    if (level == null) return 'default';
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  const handleField = <K extends keyof Sensor>(field: K, value: Sensor[K]) => {
    setEdited(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // location helpers (expects GeoJSON-like object)
  const handleLocationChange = (lngStr: string, latStr: string) => {
    const lng = Number(lngStr);
    const lat = Number(latStr);
    setEdited(prev => {
      if (!prev) return prev;
      const loc = prev.location || { type: 'Point', coordinates: [0, 0] };
      return { ...prev, location: { ...loc, coordinates: [lng || 0, lat || 0] } };
    });
  };

  const validate = (s: Partial<Sensor> | null) => {
    if (!s) return 'Invalid sensor';
    if (!s.name?.trim()) return 'Name is required';
    if (!s.type) return 'Type is required';
    if (!s.serialNumber?.trim()) return 'Serial number is required';
    if (!s.status) return 'Status is required';
    if (s.dataTransmissionInterval != null && s.dataTransmissionInterval < 0) return 'Transmission interval must be >= 0';
    if (s.measurementRange) {
      const { min, max } = s.measurementRange;
      if (min > max) return 'Measurement range: min cannot exceed max';
    }
    return null;
  };

  const onSave = async () => {
    const msg = validate(edited);
    if (msg) { setLocalError(msg); return; }

    try {
      setSaving(true);
      setLocalError(null);
      await dispatch(updateSensor({ id, formData: edited as Partial<Sensor> })).unwrap();
      setSuccess('✅ Sensor updated successfully');
      // Optional: navigate back to details page
      // navigate(`/sensors/${id}`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: any) {
      setLocalError(typeof e === 'string' ? e : 'Failed to update sensor');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => setEdited(sensor || null);

  if (loading && !edited) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!edited) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Sensor not found'}</Alert>
        <Button sx={{ mt: 2 }} component={Link} to="/sensors" startIcon={<ArrowBackIcon />}>
          Back to Sensors
        </Button>
      </Box>
    );
  }

  // derived numbers/strings
  const lng = edited.location?.coordinates?.[0] ?? 0;
  const lat = edited.location?.coordinates?.[1] ?? 0;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Button component={Link} to={`/sensors/${id}`} startIcon={<ArrowBackIcon />}>
          Back to Sensor
        </Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>

      {(error || localError || success) && (
        <Box mb={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {localError && <Alert severity="error">{localError}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Box>
      )}

      <Typography variant="h4" gutterBottom>
        <TextField
          variant="standard"
          value={edited.name || ''}
          onChange={(e) => handleField('name', e.target.value)}
          fullWidth
        />
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <DeviceThermostatIcon color="primary" />
        <TextField
          select
          size="small"
          label="Type"
          value={edited.type || ''}
          onChange={(e) => handleField('type', e.target.value as Sensor['type'])}
          sx={{ minWidth: 220 }}
        >
          {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>

        <Chip label={edited.status || 'unknown'} color={getStatusColor(edited.status) as any} size="small" sx={{ ml: 1 }} />

        <TextField
          select
          size="small"
          label="Status"
          value={edited.status || ''}
          onChange={(e) => handleField('status', e.target.value as Sensor['status'])}
          sx={{ ml: 2, width: 200 }}
        >
          {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Identification</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Manufacturer"
                  value={edited.manufacturer || ''}
                  onChange={(e) => handleField('manufacturer', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model"
                  value={edited.model || ''}
                  onChange={(e) => handleField('model', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Serial Number"
                  value={edited.serialNumber || ''}
                  onChange={(e) => handleField('serialNumber', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>

              {/* Field assignment */}
              <Grid item xs={12} sm={6}>
                {/* If you have fieldOptions, use a select; otherwise keep text input */}
                {/* <TextField
                  select
                  label="Field"
                  value={edited.Fields || ''}
                  onChange={(e) => handleField('Fields', e.target.value)}
                  fullWidth
                >
                  {fieldOptions.length === 0 && <MenuItem value="" disabled>No fields found</MenuItem>}
                  {fieldOptions.map(f => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
                </TextField> */}
                <TextField
                  label="Field (ID or name)"
                  value={edited.Fields || ''}
                  onChange={(e) => handleField('Fields', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Installation Date"
                  type="date"
                  value={edited.installationDate ? new Date(edited.installationDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => handleField('installationDate', new Date(e.target.value) as any)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Firmware Version"
                  value={edited.firmwareVersion || ''}
                  onChange={(e) => handleField('firmwareVersion', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Location & Status</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Longitude"
                  type="number"
                  value={lng}
                  onChange={(e) => handleLocationChange(e.target.value, String(lat))}
                  fullWidth
                  inputProps={{ step: '0.000001' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Latitude"
                  type="number"
                  value={lat}
                  onChange={(e) => handleLocationChange(String(lng), e.target.value)}
                  fullWidth
                  inputProps={{ step: '0.000001' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Battery Level (%)"
                  type="number"
                  value={edited.batteryLevel ?? ''}
                  onChange={(e) => handleField('batteryLevel', e.target.value === '' ? undefined : Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  helperText={
                    <Chip
                      size="small"
                      label={edited.batteryLevel != null ? `${edited.batteryLevel}%` : '—'}
                      color={getBatteryColor(edited.batteryLevel) as any}
                      sx={{ mt: 1 }}
                    />
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data Transmission Interval (min)"
                  type="number"
                  value={edited.dataTransmissionInterval ?? ''}
                  onChange={(e) => handleField('dataTransmissionInterval', e.target.value === '' ? undefined : Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Measurement Unit"
                  value={edited.measurementUnit || ''}
                  onChange={(e) => handleField('measurementUnit', e.target.value)}
                  fullWidth
                  placeholder="e.g. %, °C, mm, lux"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Range Min"
                  type="number"
                  value={edited.measurementRange?.min ?? ''}
                  onChange={(e) =>
                    setEdited(prev =>
                      prev
                        ? {
                            ...prev,
                            measurementRange: {
                              min: e.target.value === '' ? 0 : Number(e.target.value),
                              max: prev.measurementRange?.max ?? 0,
                            },
                          }
                        : prev
                    )
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Range Max"
                  type="number"
                  value={edited.measurementRange?.max ?? ''}
                  onChange={(e) =>
                    setEdited(prev =>
                      prev
                        ? {
                            ...prev,
                            measurementRange: {
                              min: prev.measurementRange?.min ?? 0,
                              max: e.target.value === '' ? 0 : Number(e.target.value),
                            },
                          }
                        : prev
                    )
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Accuracy"
                  type="number"
                  value={edited.accuracy ?? ''}
                  onChange={(e) => handleField('accuracy', e.target.value === '' ? undefined : Number(e.target.value))}
                  fullWidth
                  placeholder="± value (unit depends on type)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Calibration Date"
                  type="date"
                  value={edited.calibrationDate ? new Date(edited.calibrationDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => handleField('calibrationDate', new Date(e.target.value) as any)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={edited.notes || ''}
                  onChange={(e) => handleField('notes', e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for history & alerts (read-only displays from slice) */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="sensor details tabs">
            <Tab label="Reading History" icon={<HistoryIcon />} iconPosition="start" />
            <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="Maintenance" icon={<BatteryFullIcon />} iconPosition="start" />
            <Tab label="Alerts" icon={<NotificationsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Reading History */}
        <TabPanel value={tabValue} index={0}>
          {!sensor?.readings?.length ? (
            <Typography color="text.secondary">No readings yet.</Typography>
          ) : (
            <List>
              {sensor.readings.map((r, i) => (
                <React.Fragment key={r._id || i}>
                  <ListItem>
                    <ListItemText primary={String(r.value)} secondary={new Date(r.timestamp).toLocaleString()} />
                  </ListItem>
                  {i < sensor.readings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Settings summary (read-only chips) */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Status</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Battery Level"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {edited.batteryLevel != null ? `${edited.batteryLevel}%` : '—'}
                            <Chip
                              label={edited.batteryLevel != null ? `${edited.batteryLevel}%` : '—'}
                              color={getBatteryColor(edited.batteryLevel) as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Transmission Interval" secondary={
                        edited.dataTransmissionInterval != null ? `${edited.dataTransmissionInterval} min` : '—'
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Firmware Version" secondary={edited.firmwareVersion || '—'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Last Maintenance" secondary={
                        edited.lastMaintenance ? new Date(edited.lastMaintenance).toLocaleDateString() : '—'
                      } />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Maintenance History (if you store it elsewhere, adapt) */}
        <TabPanel value={tabValue} index={2}>
          <Typography color="text.secondary">Hook your maintenance records here.</Typography>
        </TabPanel>

        {/* Alerts list (array objects) */}
        <TabPanel value={tabValue} index={3}>
          {!sensor?.alerts?.length ? (
            <Typography color="text.secondary">No alerts.</Typography>
          ) : (
            <List>
              {sensor.alerts.map((a, i) => (
                <React.Fragment key={a._id || i}>
                  <ListItem>
                    <ListItemText
                      primary={`${a.type} — ${a.message}`}
                      secondary={`${new Date(a.timestamp).toLocaleString()} ${a.resolved ? '(resolved)' : ''}`}
                    />
                  </ListItem>
                  {i < sensor.alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default EditSensor;
