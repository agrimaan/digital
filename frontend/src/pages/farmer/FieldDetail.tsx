import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import GrassIcon from '@mui/icons-material/Grass';
import BugReportIcon from '@mui/icons-material/BugReport';
import AgricultureIcon from '@mui/icons-material/Agriculture';

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

// Mock field data used for demonstration. Replace this with an API call.
const mockField = {
  id: 1,
  name: 'North Field',
  area: '12.5 acres',
  location: '34.0522° N, 118.2437° W',
  soilType: 'Loamy',
  cropHistory: [
    { year: '2024', crop: 'Wheat', yield: '45 bushels/acre' },
    { year: '2023', crop: 'Soybeans', yield: '50 bushels/acre' },
    { year: '2022', crop: 'Corn', yield: '160 bushels/acre' },
  ],
  currentCrop: 'Wheat',
  plantingDate: '2024-03-15',
  expectedHarvestDate: '2024-08-10',
  soilHealth: {
    ph: 6.8,
    nitrogen: 'Medium',
    phosphorus: 'High',
    potassium: 'Medium',
    organicMatter: '3.2%'
  },
  irrigation: {
    system: 'Drip irrigation',
    schedule: 'Every 3 days',
    waterUsage: '1.2 inches/week'
  },
  sensors: [
    { id: 101, type: 'Soil Moisture', status: 'Active', lastReading: '28%' },
    { id: 102, type: 'Temperature', status: 'Active', lastReading: '72°F' },
    { id: 103, type: 'Humidity', status: 'Inactive', lastReading: '65%' }
  ],
  issues: [
    { id: 1, type: 'Pest', description: 'Aphid infestation detected', severity: 'Medium', reportedDate: '2024-05-10', status: 'In Progress' },
    { id: 2, type: 'Disease', description: 'Early signs of rust', severity: 'Low', reportedDate: '2024-05-15', status: 'Monitoring' }
  ]
};

const FieldDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [field] = useState(mockField);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // In a real app, you would fetch the field data based on the ID
    console.log(`Fetching field with ID: ${id}`);
  }, [id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header with back and edit actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          // use '..' to navigate back to the fields list relative to `/farmer/fields/:id`
          to=".."
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to fields
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          component={Link}
          // Navigate to the edit page for this field using a relative path
          to="edit"
        >
          Edit Field
        </Button>
      </Box>

      {/* Basic field information */}
      <Typography variant="h4" gutterBottom>
        {field.name}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Field Information</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Area" secondary={field.area} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Location" secondary={field.location} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Soil Type" secondary={field.soilType} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Current Crop" secondary={field.currentCrop} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Planting Date" secondary={field.plantingDate} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Expected Harvest" secondary={field.expectedHarvestDate} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Field Map</Typography>
            <Box sx={{ height: 300, bgcolor: 'grey.200', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>Map Visualization Would Go Here</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for detailed sections */}
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
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {Object.entries(field.soilHealth).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Typography>
                    <Typography variant="h4">{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">System Type</Typography>
                  <Typography variant="body1">{field.irrigation.system}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Schedule</Typography>
                  <Typography variant="body1">{field.irrigation.schedule}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Water Usage</Typography>
                  <Typography variant="body1">{field.irrigation.waterUsage}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {field.sensors.map((sensor) => (
              <Grid item xs={12} sm={6} md={4} key={sensor.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{sensor.type}</Typography>
                    <Typography variant="body1" color={sensor.status === 'Active' ? 'success.main' : 'error.main'}>
                      {sensor.status}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>Last Reading: {sensor.lastReading}</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      // use a relative path to navigate up two levels then to sensors
                      to={`../../sensors/${sensor.id}`}
                      sx={{ mt: 2 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <List>
            {field.issues.map((issue) => (
              <Paper key={issue.id} sx={{ mb: 2, p: 2 }}>
                <Typography
                  variant="h6"
                  color={issue.severity === 'High' ? 'error.main' : issue.severity === 'Medium' ? 'warning.main' : 'info.main'}
                >
                  {issue.type}: {issue.description}
                </Typography>
                <Typography variant="body2">Severity: {issue.severity}</Typography>
                <Typography variant="body2">Reported: {issue.reportedDate}</Typography>
                <Typography variant="body2">Status: {issue.status}</Typography>
              </Paper>
            ))}
          </List>
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <List>
            {field.cropHistory.map((history, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <AgricultureIcon />
                  </ListItemIcon>
                  <ListItemText primary={`${history.year}: ${history.crop}`} secondary={`Yield: ${history.yield}`} />
                </ListItem>
                {index < field.cropHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default FieldDetail;