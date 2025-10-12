// ResponsiveDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Skeleton,
  SwipeableDrawer,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Terrain as TerrainIcon,
  Grass as GrassIcon,
  Sensors as SensorsIcon,
  Warning as WarningIcon,
  WaterDrop as WaterDropIcon,
  BugReport as BugReportIcon,
  Spa as SpaIcon,
  Thermostat as ThermostatIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

import { getFields } from '../../features/fields/fieldSlice';
import { getCrops } from '../../features/crops/cropSlice';
import { getSensors } from '../../features/sensors/sensorSlice';
import { getRecommendations } from '../../features/analytics/analyticsSlice';
import { RootState } from '../../store';

import DashboardWidget from '../../components/layout/DashboardWidget';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { Field, Crop, Sensor, Recommendation } from '../../types/domains';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend, ArcElement);

const ResponsiveDashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { fields, loading: fieldsLoading } = useSelector((state: RootState) => state.fields);
  const { crops, loading: cropsLoading } = useSelector((state: RootState) => state.crop);
  const { sensors, loading: sensorsLoading } = useSelector((state: RootState) => state.sensor);
  const { recommendations, loading: recommendationsLoading } = useSelector((state: RootState) => state.analytics);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(getFields() as any);
    dispatch(getCrops() as any);
    dispatch(getSensors({}) as any);
    dispatch(getRecommendations() as any);
  }, [dispatch]);

  const handleWidgetRefresh = (widgetId: string) => {
    setRefreshing(prev => ({ ...prev, [widgetId]: true }));
    setTimeout(() => {
      setRefreshing(prev => ({ ...prev, [widgetId]: false }));
    }, 1500);
  };

  const handleFilterDrawerToggle = () => setFilterDrawerOpen(!filterDrawerOpen);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);

  // ✅ Fixed: Typed filters
  const cropCounts = [
    crops.filter(crop => crop.status === 'planned').length,
    crops.filter(crop => crop.status === 'planted').length,
    crops.filter(crop => crop.status === 'growing').length,
    crops.filter(crop => crop.status === 'harvested').length,
    crops.filter(crop => crop.status === 'failed').length,
  ];

  const sensorCounts = [
    sensors.filter(sensor => sensor.status === 'active').length,
    sensors.filter(sensor => sensor.status === 'inactive').length,
    sensors.filter(sensor => sensor.status === 'maintenance').length,
    sensors.filter(sensor => sensor.status === 'error').length,
  ];

  const cropStatusData = {
    labels: ['Planned', 'Planted', 'Growing', 'Harvested', 'Failed'],
    datasets: [
      {
        label: 'Crop Status',
        data: cropCounts,
        backgroundColor: [
          theme.palette.info.light,
          theme.palette.primary.light,
          theme.palette.success.light,
          theme.palette.secondary.light,
          theme.palette.error.light
        ],
        borderColor: [
          theme.palette.info.main,
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.secondary.main,
          theme.palette.error.main
        ],
        borderWidth: 1
      }
    ]
  };

  const sensorStatusData = {
    labels: ['Active', 'Inactive', 'Maintenance', 'Error'],
    datasets: [
      {
        label: 'Sensor Status',
        data: sensorCounts,
        backgroundColor: [
          theme.palette.success.light,
          theme.palette.grey[400],
          theme.palette.warning.light,
          theme.palette.error.light
        ],
        borderColor: [
          theme.palette.success.main,
          theme.palette.grey[600],
          theme.palette.warning.main,
          theme.palette.error.main
        ],
        borderWidth: 1
      }
    ]
  };

  // Mock data (can be replaced with real)
  const soilMoistureData = { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'], datasets: [{ label: 'Field 1', data: [65,59,80,81,56,55,40], borderColor: theme.palette.primary.main, backgroundColor: 'rgba(46, 125, 50, 0.1)', fill: true, tension: 0.4 }, { label: 'Field 2', data: [28,48,40,19,86,27,90], borderColor: theme.palette.secondary.main, backgroundColor: 'rgba(255, 143, 0, 0.1)', fill: true, tension: 0.4 }]};
  const cropYieldData = { labels: ['Wheat','Corn','Soybeans','Rice'], datasets: [{ label: 'Last Year', data: [4.2,9.5,3.1,5.8], backgroundColor: theme.palette.primary.light }, { label: 'This Year (Projected)', data: [4.5,10.2,3.4,6.0], backgroundColor: theme.palette.primary.dark }]};

  const cropYieldOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, display: !isMobile },
      title: { display: true, text: 'Crop Yield Comparison (tons/ha)', font: { size: isMobile ? 12 : 16 } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: isMobile ? 10 : 12 } } },
      x: { ticks: { font: { size: isMobile ? 10 : 12 } } }
    }
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>Dashboard</Typography>
        <Box>
          <Button component={RouterLink} to="/fields/new" variant="contained" startIcon={<AddIcon />} size={isMobile ? "small" : "medium"}>Add Field</Button>
          {isMobile && <IconButton color="primary" onClick={handleFilterDrawerToggle}><FilterListIcon /></IconButton>}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <DashboardWidget title="Total Fields" icon={<TerrainIcon color="primary" />} loading={fieldsLoading} onRefresh={() => handleWidgetRefresh('fields')} id="fields-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {fieldsLoading || refreshing['fields-widget'] ? <Skeleton width={40} /> : fields.length}
              </Typography>
              <Box sx={{ mt: 'auto' }}><Link component={RouterLink} to="/fields" color="primary" underline="hover">View all fields</Link></Box>
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <DashboardWidget title="Active Crops" icon={<GrassIcon color="success" />} loading={cropsLoading} onRefresh={() => handleWidgetRefresh('crops')} id="crops-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {cropsLoading || refreshing['crops-widget'] ? <Skeleton width={40} /> : crops.filter(crop => crop.status !== 'harvested' && crop.status !== 'failed').length}
              </Typography>
              <Box sx={{ mt: 'auto' }}><Link component={RouterLink} to="/crops" color="primary" underline="hover">View all crops</Link></Box>
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <DashboardWidget title="Active Sensors" icon={<SensorsIcon color="info" />} loading={sensorsLoading} onRefresh={() => handleWidgetRefresh('sensors')} id="sensors-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {sensorsLoading || refreshing['sensors-widget'] ? <Skeleton width={40} /> : sensors.filter(sensor => sensor.status === 'active').length}
              </Typography>
              <Box sx={{ mt: 'auto' }}><Link component={RouterLink} to="/sensors" color="primary" underline="hover">View all sensors</Link></Box>
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <DashboardWidget title="Alerts" icon={<WarningIcon color="error" />} loading={sensorsLoading} onRefresh={() => handleWidgetRefresh('alerts')} id="alerts-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant={isMobile ? "h5" : "h4"} component="div" color="error.main">
                {sensorsLoading || refreshing['alerts-widget'] ? <Skeleton width={40} /> : sensors.filter(sensor => sensor.status === 'error').length}
              </Typography>
              <Box sx={{ mt: 'auto' }}><Link component={RouterLink} to="/alerts" color="primary" underline="hover">View all alerts</Link></Box>
            </Box>
          </DashboardWidget>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={8}><DashboardWidget title="Soil Moisture Trend" loading={false} onRefresh={() => handleWidgetRefresh('soil-moisture')} id="soil-moisture-widget"><Box sx={{ height: isMobile ? 250 : 300 }}><Line data={soilMoistureData} options={{ responsive:true, maintainAspectRatio:false }} /></Box></DashboardWidget></Grid>
        <Grid item xs={12} sm={6} md={4}><DashboardWidget title="Crop Status" loading={cropsLoading} onRefresh={() => handleWidgetRefresh('crop-status')} id="crop-status-widget"><Box sx={{ height: isMobile ? 200 : 250 }}><Doughnut data={cropStatusData} options={{ responsive:true, maintainAspectRatio:false }} /></Box></DashboardWidget></Grid>
        <Grid item xs={12} sm={6} md={4}><DashboardWidget title="Sensor Status" loading={sensorsLoading} onRefresh={() => handleWidgetRefresh('sensor-status')} id="sensor-status-widget"><Box sx={{ height: isMobile ? 200 : 250 }}><Doughnut data={sensorStatusData} options={{ responsive:true, maintainAspectRatio:false }} /></Box></DashboardWidget></Grid>
        <Grid item xs={12}><DashboardWidget title="Crop Yield Comparison" loading={false} onRefresh={() => handleWidgetRefresh('crop-yield')} id="crop-yield-widget"><Box sx={{ height: isMobile ? 250 : 300 }}><Bar data={cropYieldData} options={cropYieldOptions} /></Box></DashboardWidget></Grid>
      </Grid>
    </Box>
  );
};

export default ResponsiveDashboardPage;
