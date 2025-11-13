
// src/pages/admin/AdminDashboard.tsx - Updated to use BFF
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Terrain as TerrainIcon,
  Grass as GrassIcon,
  Sensors as SensorsIcon,
  ShoppingCart as ShoppingCartIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  Store as StoreIcon,
  Construction as ResourcesIcon
} from '@mui/icons-material';
import SettingsIcon from "@mui/icons-material/Settings";

import { RootState } from '../../store';
import adminService from '../../services/adminService';

// Define types
interface DashboardStats {
  users: number;
  fields: number;
  crops: number;
  sensors: number;
  orders: number;
  resources: number;
  landTokens: number;
  bulkUploads: number;
  usersByRole: {
    farmers: number;
    buyers: number;
    agronomists: number;
    investors: number;
    admins: number;
  };
  verificationStats: {
    pendingUsers: number;
    pendingLandTokens: number;
    pendingBulkUploads: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  createdAt: string;
}

interface Order {
  _id: string;
  buyer: { _id: string; name: string };
  seller: { _id: string; name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Resource {
  _id: string;
  name: string;
  type: string;
  hourlyRate: number;
  location: string;
  owner: { name: string; email: string };
  createdAt: string;
}

interface LandToken {
  _id: string;
  landId: string;
  owner: { name: string; email: string };
  landDetails: {
    location: { city: string; state: string };
    area: { value: number; unit: string };
  };
  verification: { status: string };
  status: string;
  createdAt: string;
}

interface BulkUpload {
  _id: string;
  filename: string;
  type: string;
  status: string;
  records: number;
  success: number;
  failed: number;
  uploadedBy: string;
  uploadedAt: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [landTokens, setLandTokens] = useState<LandToken[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUpload[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data from BFF in parallel
      const [
        stats,
        users,
        orders,
        health,
        resourcesData,
        landTokensData,
        bulkUploadsData
      ] = await Promise.all([
        adminService.dashboard.getDashboardStats(),
        adminService.dashboard.getRecentUsers(5),
        adminService.dashboard.getRecentOrders(5),
        adminService.dashboard.getSystemHealth(),
        adminService.dashboard.getResources(),
        adminService.dashboard.getLandTokens(),
        adminService.dashboard.getBulkUploads()
      ]);

      setDashboardStats(stats);
      setRecentUsers(users || []);
      setRecentOrders(orders || []);
      setSystemHealth(health);
      setResources(resourcesData || []);
      setLandTokens(landTokensData || []);
      setBulkUploads(bulkUploadsData || []);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'farmer': return 'success';
      case 'buyer': return 'primary';
      case 'agronomist': return 'info';
      case 'investor': return 'warning';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'farmer': return <TerrainIcon />;
      case 'buyer': return <ShoppingCartIcon />;
      case 'agronomist': return <GrassIcon />;
      case 'investor': return <StoreIcon />;
      default: return <PersonIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Box>
          <Button
            component={RouterLink}
            to="/admin/users/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mr: 1 }}
          >
            Add User
          </Button>
          <Button
            component={RouterLink}
            to="/admin/settings"
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Welcome Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Welcome, {user?.name || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is your comprehensive admin control panel powered by the BFF service.
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.users || 0}
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/users"
                  size="small"
                  color="primary"
                >
                  Manage Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fields
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.fields || 0}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/fields"
                  size="small"
                  color="primary"
                >
                  Manage Fields
                </Button>
              </Box>
                <TerrainIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Crops
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.crops || 0}
                  </Typography>
                </Box>
                <GrassIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/crops"
                  size="small"
                  color="primary"
                >
                  Manage Crops
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sensors
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.sensors || 0}
                  </Typography>
                </Box>
                <SensorsIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/sensors"
                  size="small"
                  color="primary"
                >
                  Manage Sensors
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Orders
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.orders || 0}
                  </Typography>
                </Box>
                <ShoppingCartIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/orders"
                  size="small"
                  color="primary"
                >
                  Manage Orders
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resources
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardStats?.resources || 0}
                  </Typography>
                </Box>
                <ResourcesIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/resources"
                  size="small"
                  color="primary"
                >
                  Manage Resources
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Detailed Management */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Recent Users (${recentUsers.length})`} />
          <Tab label={`Recent Orders (${recentOrders.length})`} />
          <Tab label={`Resources (${resources.length})`} />
          <Tab label={`Land Tokens (${landTokens.length})`} />
          <Tab label={`Bulk Uploads (${bulkUploads.length})`} />
        </Tabs>
      </Box>

      {/* Recent Users Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Recent Users
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {recentUsers.length > 0 ? (
            <List>
              {recentUsers.map((user) => (
                <ListItem key={user._id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                      {getRoleIcon(user.role)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={`${user.email} \u2014 Joined ${formatDate(user.createdAt)}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">No users found.</Typography>
          )}
        </Paper>
      )}

      {/* Recent Orders Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Recent Orders
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {recentOrders.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order._id.substring(0, 8)}...</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.buyer.name}</TableCell>
                      <TableCell>{order.seller.name}</TableCell>
                      <TableCell align="right">\u20b9{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No recent orders found.</Typography>
          )}
        </Paper>
      )}

      {/* Resources Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            All Resources
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {resources.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource._id}>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>\u20b9{resource.hourlyRate}</TableCell>
                      <TableCell>{resource.location}</TableCell>
                      <TableCell>{resource.owner.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No resources found.</Typography>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default AdminDashboard;
