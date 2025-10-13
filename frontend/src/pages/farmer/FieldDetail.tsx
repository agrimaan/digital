// src/pages/farmer/FieldDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import BugReportIcon from '@mui/icons-material/BugReport';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { AppDispatch, RootState } from '../../store';
import { getFieldsById } from '../../features/fields/fieldSlice';

// --- Mapping Helpers ---
const mapSoilType = (type?: string): string => {
  if (!type) return 'N/A';
  const normalized = type.toLowerCase();
  const mapping: Record<string, string> = {
    clay: 'Clay',
    sandy: 'Sandy',
    loam: 'Loam',
    silty: 'Silty',
    peaty: 'Peaty',
    chalky: 'Chalky'
  };
  return mapping[normalized] || type.charAt(0).toUpperCase() + type.slice(1);
};

const mapIrrigationType = (type?: string): string => {
  if (!type) return 'N/A';
  const normalized = type.toLowerCase();
  const mapping: Record<string, string> = {
    drip: 'Drip Irrigation',
    sprinkler: 'Sprinkler',
    flood: 'Surface Irrigation',
    other: 'Subsurface Irrigation',
    none: 'None'
  };
  return mapping[normalized] || type.charAt(0).toUpperCase() + type.slice(1);
};

const mapStatus = (status?: string): string => {
  if (!status) return 'N/A';
  const normalized = status.toLowerCase();
  const mapping: Record<string, string> = {
    active: 'Active',
    fallow: 'Fallow',
    preparation: 'In Preparation',
    harvested: 'Harvested'
  };
  return mapping[normalized] || status.charAt(0).toUpperCase() + status.slice(1);
};

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
      id={`field-tabpanel-${index}`}
      aria-labelledby={`field-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FieldDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { Fields: field, loading, error } = useSelector((state: RootState) => state.fields);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(getFieldsById(id));
    }
  }, [dispatch, id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!field) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No field data found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button component={Link} to=".." startIcon={<ArrowBackIcon />}>
          Back to fields
        </Button>
        <Button variant="contained" startIcon={<EditIcon />} component={Link} to="edit">
          Edit Field
        </Button>
      </Box>

      {/* Title */}
      <Typography variant="h4" gutterBottom>
        {field.name || 'Unnamed Field'}
      </Typography>

      {/* Field Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Field Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Area" secondary={`${field.area} ${field.unit}`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Location" secondary={field.locationName || 'N/A'} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Coordinates"
                  secondary={
                    field.location?.coordinates
                      ? `${field.location.coordinates[1]?.toFixed(4)}° N, ${field.location.coordinates[0]?.toFixed(4)}° E`
                      : field.locationName || 'N/A'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Soil Type" secondary={mapSoilType(field.soilType)} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Irrigation Type" secondary={mapIrrigationType(field.irrigationType)} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Status" secondary={mapStatus(field.status)} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Field Map
            </Typography>
            <Box
              sx={{
                height: 300,
                bgcolor: 'grey.200',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography>Map Visualization Would Go Here</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Field details tabs">
            <Tab label="Soil Health" icon={<GrassIcon />} iconPosition="start" />
            <Tab label="Irrigation" icon={<WaterDropIcon />} iconPosition="start" />
            <Tab label="Sensors" icon={<WbSunnyIcon />} iconPosition="start" />
            <Tab label="Issues" icon={<BugReportIcon />} iconPosition="start" />
            <Tab label="Crop History" icon={<AgricultureIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Soil Health */}
        <TabPanel value={tabValue} index={0}>
          {field.soilHealth ? (
            <Grid container spacing={2}>
              {Object.entries(field.soilHealth).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </Typography>
                      <Typography variant="h4">{String(value)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No soil data available.</Typography>
          )}
        </TabPanel>

        {/* Irrigation */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1">
            Irrigation System: {mapIrrigationType(field.irrigationType)}
          </Typography>
        </TabPanel>

        {/* Sensors */}
        <TabPanel value={tabValue} index={2}>
          <Typography>No sensor data linked yet.</Typography>
        </TabPanel>

        {/* Issues */}
        <TabPanel value={tabValue} index={3}>
          <Typography>No issues reported.</Typography>
        </TabPanel>

        {/* Crop History */}
        <TabPanel value={tabValue} index={4}>
          <Typography>No crop history recorded.</Typography>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default FieldDetail;
