import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalShipping as LocalShippingIcon,
  Route as RouteIcon,
  DirectionsCar as DirectionsCarIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { getLogisticsStats, getDeliveries } from '../../features/logistics/logisticsSlice';

interface LogisticsStats {
  totalDeliveries: number;
  activeDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalRevenue: number;
}

interface Delivery {
  id: string;
  orderId: string;
  farmer: string;
  buyer: string;
  pickupLocation: string;
  deliveryLocation: string;
  status: string;
  estimatedTime: string;
  driver: string;
  vehicle: string;
}

const LogisticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { deliveries, stats, loading, error } = useSelector((state: any) => state.logistics);
  
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  
  useEffect(() => {
    // Fetch logistics statistics
    dispatch(getLogisticsStats());
    
    // Fetch recent deliveries
    dispatch(getDeliveries());
  }, [dispatch]);
  
  useEffect(() => {
    // Update recent deliveries when deliveries data changes
    if (deliveries && deliveries.length > 0) {
      const formattedDeliveries = deliveries.slice(0, 5).map((delivery: any) => ({
        id: delivery._id,
        orderId: delivery.orderId,
        farmer: delivery.farmer?.name || 'Unknown Farmer',
        buyer: delivery.buyer?.name || 'Unknown Buyer',
        pickupLocation: delivery.pickupAddress?.city || 'Unknown Location',
        deliveryLocation: delivery.deliveryAddress?.city || 'Unknown Location',
        status: delivery.status,
        estimatedTime: new Date(delivery.estimatedDeliveryTime).toLocaleString(),
        driver: delivery.vehicle?.driver || 'Unassigned',
        vehicle: delivery.vehicle?.registrationNumber || 'Unassigned',
      }));
      
      setRecentDeliveries(formattedDeliveries);
    }
  }, [deliveries]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('logisticsDashboard.title')}
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('logisticsDashboard.totalDeliveries')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats?.totalDeliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <LocalShippingIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('logisticsDashboard.activeDeliveries')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats?.activeDeliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('logisticsDashboard.completedDeliveries')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats?.completedDeliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                  <NotificationsIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('logisticsDashboard.pendingDeliveries')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats?.pendingDeliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Deliveries */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('logisticsDashboard.recentDeliveries')}
            </Typography>
            <List>
              {recentDeliveries.map((delivery) => (
                <ListItem key={delivery.id} divider>
                  <ListItemIcon>
                    <Avatar>
                      <RouteIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={`${delivery.orderId} - ${delivery.farmer} to ${delivery.buyer}`}
                    secondary={`${delivery.pickupLocation} → ${delivery.deliveryLocation}`}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Chip
                      label={delivery.status}
                      color={
                        delivery.status === 'delivered' ? 'success' :
                        delivery.status === 'in-transit' ? 'primary' :
                        delivery.status === 'pending' ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {delivery.estimatedTime}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('logisticsDashboard.quickActions')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/logistics/deliveries')}
                >
                  {t('logisticsDashboard.viewAll')}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<MapIcon />}
                  onClick={() => navigate('/logistics/tracking')}
                >
                  {t('logisticsDashboard.track')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('logisticsDashboard.vehicleStatus')}
            </Typography>
            <List>
              {recentDeliveries.slice(0, 3).map((delivery) => (
                <ListItem key={delivery.id}>
                  <ListItemText
                    primary={delivery.vehicle}
                    secondary={delivery.driver}
                  />
                  <Chip
                    label={delivery.status === 'in-transit' ? t('logisticsDashboard.onDelivery') : t('logisticsDashboard.available')}
                    color={delivery.status === 'in-transit' ? 'primary' : 'success'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogisticsDashboard;