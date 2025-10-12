// FarmerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Grid, Typography, Skeleton, Link } from '@mui/material';
import { Add as AddIcon, Terrain as TerrainIcon, Grass as GrassIcon, Sensors as SensorsIcon, Warning as WarningIcon } from '@mui/icons-material';

import { getFields } from '../../features/fields/fieldSlice';
import { getCrops } from '../../features/crops/cropSlice';
import { getSensors } from '../../features/sensors/sensorSlice';
import { RootState } from '../../store';
import DashboardWidget from '../../components/layout/DashboardWidget';

const FarmerDashboard: React.FC = () => {
  const dispatch = useDispatch();

  const { fields, loading: fieldsLoading } = useSelector((state: RootState) => state.fields);
  const { crops, loading: cropsLoading } = useSelector((state: RootState) => state.crop);
  const { sensors, loading: sensorsLoading } = useSelector((state: RootState) => state.sensor);

  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(getFields() as any);
    dispatch(getCrops() as any);
    dispatch(getSensors({}) as any);
  }, [dispatch]);

  const handleWidgetRefresh = (widgetId: string) => {
    setRefreshing(prev => ({ ...prev, [widgetId]: true }));
    setTimeout(() => {
      setRefreshing(prev => ({ ...prev, [widgetId]: false }));
    }, 1500);
  };

  const activeCropsCount = crops.filter(crop => crop.status !== 'harvested' && crop.status !== 'failed').length;
  const alertCount = sensors.filter(sensor => sensor.status === 'error').length;
  const activeSensorsCount = sensors.filter(sensor => sensor.status === 'active').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Farmer Dashboard</Typography>
        <Button component={RouterLink} to="/fields/new" variant="contained" startIcon={<AddIcon />}>Add Field</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Fields */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardWidget title="Total Fields" icon={<TerrainIcon color="primary" />} loading={fieldsLoading} onRefresh={() => handleWidgetRefresh('fields')} id="fields-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h4">{fieldsLoading || refreshing['fields-widget'] ? <Skeleton width={40} /> : fields.length}</Typography>
              <Box sx={{ mt: 'auto' }}>
                <Link component={RouterLink} to="/fields" color="primary" underline="hover">View all fields</Link>
              </Box>
            </Box>
          </DashboardWidget>
        </Grid>

        {/* Active Crops */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardWidget title="Active Crops" icon={<GrassIcon color="success" />} loading={cropsLoading} onRefresh={() => handleWidgetRefresh('crops')} id="crops-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h4">{cropsLoading || refreshing['crops-widget'] ? <Skeleton width={40} /> : activeCropsCount}</Typography>
              <Box sx={{ mt: 'auto' }}>
                <Link component={RouterLink} to="/crops" color="primary" underline="hover">View all crops</Link>
              </Box>
            </Box>
          </DashboardWidget>
        </Grid>

        {/* Active Sensors */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardWidget title="Active Sensors" icon={<SensorsIcon color="info" />} loading={sensorsLoading} onRefresh={() => handleWidgetRefresh('sensors')} id="sensors-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h4">{sensorsLoading || refreshing['sensors-widget'] ? <Skeleton width={40} /> : activeSensorsCount}</Typography>
              <Box sx={{ mt: 'auto' }}>
                <Link component={RouterLink} to="/sensors" color="primary" underline="hover">View all sensors</Link>
              </Box>
            </Box>
          </DashboardWidget>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardWidget title="Alerts" icon={<WarningIcon color="error" />} loading={sensorsLoading} onRefresh={() => handleWidgetRefresh('alerts')} id="alerts-widget">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h4" color="error.main">{sensorsLoading || refreshing['alerts-widget'] ? <Skeleton width={40} /> : alertCount}</Typography>
              <Box sx={{ mt: 'auto' }}>
                <Link component={RouterLink} to="/alerts" color="primary" underline="hover">View all alerts</Link>
              </Box>
            </Box>
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FarmerDashboard;
