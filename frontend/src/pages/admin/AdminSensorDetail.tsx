import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  Sensors as SensorsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Terrain as TerrainIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  WaterDrop as WaterDropIcon,
  Thermostat as ThermostatIcon,
  Air as AirIcon,
  WbSunny as WbSunnyIcon,
  Battery90 as BatteryIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Define types
interface Sensor {
  _id: string;
  name: string;
  type: 'soil_moisture' | 'temperature' | 'humidity' | 'light' | 'ph' | 'npk';
  Fields: {
    _id: string;
    name: string;
    owner: {
      _id: string;
      name: string;
    }
  };
  location: {
    latitude: number;
    longitude: number;
    description: string;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  batteryLevel: number;
  lastReading: {
    value: number;
    unit: string;
    timestamp: string;
  };
  readings: Array<{
    value: number;
    unit: string;
    timestamp: string;
  }>;
  maintenanceHistory: Array<{
    _id: string;
    date: string;
    type: string;
    description: string;
    performedBy: string;
  }>;
  installationDate: string;
  lastMaintenance: string | null;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sensor-tabpanel-${index}`}
      aria-labelledby={`sensor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `sensor-tab-${index}`,
    'aria-controls': `sensor-tabpanel-${index}`,
  };
}

const AdminSensorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchSensorData = async () => {
      setLoading(true);
      try {
        // Real API call to fetch details
        const response = await axios.get(`${API_BASE_URL}/api/iot/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = response.data.data || response.data;
        setSensor(data);
        
                setSensor(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching sensor data:', err);
        setError(err.message || 'Failed to load sensor data');
        setLoading(false);
      }
    };

    fetchSensorData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'maintenance':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get battery color
  const getBatteryColor = (level: number) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  // Get sensor type icon
  const getSensorTypeIcon = (type: string) => {
    switch (type) {
      case 'soil_moisture':
        return <WaterDropIcon />;
      case 'temperature':
        return <ThermostatIcon />;
      case 'humidity':
        return <AirIcon />;
      case 'light':
        return <WbSunnyIcon />;
      default:
        return <SensorsIcon />;
    }
  };

  // Format sensor type label
  const formatSensorType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  if (error || !sensor) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          {error || 'Sensor not found'}
        </Alert>
        <Button
          component={RouterLink}
          to="/admin/sensors"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Sensors
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            component={RouterLink}
            to="/admin/sensors"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Sensor Details
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Edit Sensor">
            <IconButton 
              component={RouterLink} 
              to={`/admin/sensors/${sensor._id}/edit`}
              color="primary"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Sensor">
            <IconButton color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Sensor Overview Card */}
      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ 
          p: 3, 
          bgcolor: 'info.main', 
          color: 'info.contrastText',
          display: 'flex',
          alignItems: 'center'
        }}>
          {getSensorTypeIcon(sensor.type)}
          <Box sx={{ ml: 2 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              {sensor.name}
            </Typography>
            <Typography variant="subtitle1">
              {formatSensorType(sensor.type)} • 
              <Chip 
                label={sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)} 
                color={getStatusColor(sensor.status)}
                size="small"
                sx={{ ml: 1, color: 'white', borderColor: 'white' }}
                variant="outlined"
              />
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TerrainIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fields" 
                    secondary={
                      <RouterLink to={`/admin/fields/${sensor.Fields._id}`}>
                        {sensor.Fields.name}
                      </RouterLink>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Location" 
                    secondary={sensor.location.description} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BatteryIcon color={getBatteryColor(sensor.batteryLevel)} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Battery Level" 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={sensor.batteryLevel} 
                          color={getBatteryColor(sensor.batteryLevel)}
                          sx={{ flexGrow: 1, mr: 2 }}
                        />
                        {sensor.batteryLevel}%
                      </Box>
                    } 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Owner" 
                    secondary={
                      <RouterLink to={`/admin/users/${sensor.Fields.owner._id}`}>
                        {sensor.Fields.owner.name}
                      </RouterLink>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Installation Date" 
                    secondary={formatDate(sensor.installationDate)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Last Maintenance" 
                    secondary={formatDate(sensor.lastMaintenance)} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Last Reading Card */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Last Reading
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getSensorTypeIcon(sensor.type)}
              <Typography variant="h3" sx={{ ml: 2 }}>
                {sensor.lastReading.value} {sensor.lastReading.unit}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body1">
              <strong>Timestamp:</strong> {formatTimestamp(sensor.lastReading.timestamp)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button 
              startIcon={<SyncIcon />}
              variant="contained"
            >
              Refresh Reading
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Readings" icon={<BarChartIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Maintenance" icon={<SettingsIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Technical Info" icon={<SensorsIcon />} iconPosition="start" {...a11yProps(2)} />
        </Tabs>
      </Paper>

      {/* Readings Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Recent Readings
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Value</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sensor.readings.map((reading, index) => (
                <TableRow key={index}>
                  <TableCell>{reading.value}</TableCell>
                  <TableCell>{reading.unit}</TableCell>
                  <TableCell>{formatTimestamp(reading.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button 
            variant="outlined"
            startIcon={<HistoryIcon />}
          >
            View All Readings
          </Button>
        </Box>
      </TabPanel>

      {/* Maintenance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Maintenance History
          </Typography>
          <Button 
            component={RouterLink} 
            to={`/admin/sensors/${sensor._id}/maintenance/new`} 
            variant="contained" 
            startIcon={<SettingsIcon />}
          >
            Add Maintenance Record
          </Button>
        </Box>
        
        {sensor.maintenanceHistory.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No maintenance records found
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Performed By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensor.maintenanceHistory.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.performedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Technical Info Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Technical Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Manufacturer" 
                    secondary={sensor.manufacturer} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Model" 
                    secondary={sensor.model} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Serial Number" 
                    secondary={sensor.serialNumber} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Firmware Version" 
                    secondary={sensor.firmwareVersion} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Created At" 
                    secondary={formatDate(sensor.createdAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={formatDate(sensor.updatedAt)} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button 
              variant="contained"
              color="primary"
              startIcon={<SyncIcon />}
            >
              Update Firmware
            </Button>
          </Box>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default AdminSensorDetail;