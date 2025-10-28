// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Alert,
  Tabs,
  Tab,
  Snackbar
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
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  Report as ReportIcon,
  Download as DownloadIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Construction as ResourcesIcon // New Icon for Resources
} from '@mui/icons-material';
import SettingsIcon from "@mui/icons-material/Settings";


import { RootState } from '../../store';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import adminDashboardAPI from '../../services/adminService';

// Define types
interface DashboardData {
  counts: {
    users: number;
    fields: number;
    crops: number;
    sensors: number;
    orders: number;
    landTokens: number;
    bulkUploads: number;
    resources: number; // Add resources to counts
  };
  usersByRole: {
    farmers: number;
    buyers: number;
    agronomists: number;
    investors: number;
    admins: number;
  };
  recentOrders: Array<{
    _id: string;
    buyer: { _id: string; name: string };
    seller: { _id: string; name: string };
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  verificationStats: {
    pendingUsers: number;
    pendingLandTokens: number;
    pendingBulkUploads: number;
  };
  systemHealth: {
    otpEnabled: boolean;
    emailConfigured: boolean;
    smsConfigured: boolean;
    oauthConfigured: boolean;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  createdAt: string;
  phone?: { number: string; verified: boolean };
  emailVerification?: { verified: boolean };
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

interface Resource {
  _id: string;
  name: string;
  type: string;
  hourlyRate: number;
  location: string;
  owner: { name: string; email: string };
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [landTokens, setLandTokens] = useState<LandToken[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUpload[]>([]);
  const [resources, setResources] = useState<Resource[]>([]); // New: Resources state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLandToken, setSelectedLandToken] = useState<LandToken | null>(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('');
  
  // New: Resource Dialog State
  const [resourceDialog, setResourceDialog] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({
      name: '',
      type: '',
      hourlyRate: 0,
      location: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        dashboardStats,
        recentUsers,
        recentOrders,
        systemHealth
      ] = await Promise.all([
        adminDashboardAPI.dashboard.getDashboardStats(),
        adminDashboardAPI.dashboard.getRecentUsers(5),
        adminDashboardAPI.dashboard.getRecentOrders(5),
        adminDashboardAPI.dashboard.getSystemHealth()
      ]);

      // Get real users data from API response
      const realUsers = recentUsers || [];
     
      
         // Get real land tokens from blockchain service
         let realLandTokens = [];
         try {
           const landTokensResponse = await axios.get(`${API_BASE_URL}/api/blockchain/tokens?tokenType=Fields`, {
             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
           });
           realLandTokens = landTokensResponse.data.data || [];
           console.log('Land tokens fetched:', realLandTokens.length, 'tokens');
         } catch (err) {
           console.warn('Land tokens service unavailable:', err);
           realLandTokens = [];
         }
      // Get real bulk uploads data
      let realBulkUploads = [];
      try {
        const bulkUploadsResponse = await axios.get(`${API_BASE_URL}/api/admin/bulk-uploads`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        realBulkUploads = bulkUploadsResponse.data.data || [];
      } catch (err) {
        console.warn('Bulk uploads service unavailable:', err);
        realBulkUploads = [];
      }
      
      // Get real resources data
      let realResources = [];
      try {
        const resourcesResponse = await axios.get(`${API_BASE_URL}/api/admin/resources`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        realResources = resourcesResponse.data.data || [];
      } catch (err) {
        console.warn('Resources service unavailable:', err);
        realResources = [];
      }

      console.log('dashboardStats:', dashboardStats);

      setDashboardData({ 
        counts: {
          users: dashboardStats.users.length,
          fields: dashboardStats.fields,
          crops: dashboardStats.crops,
          sensors: dashboardStats.sensors,
          orders: dashboardStats.orders,
          landTokens: dashboardStats.landTokens,
          bulkUploads: dashboardStats.bulkUploads,
          resources: dashboardStats.resources
        },
        usersByRole: dashboardStats.usersByRole,
        recentOrders: recentOrders,
        recentUsers: recentUsers,
        verificationStats: dashboardStats.verificationStats,
        systemHealth: systemHealth
      });
      setUsers(realUsers);
      setLandTokens(realLandTokens);
      setBulkUploads(realBulkUploads);
      setResources(realResources);
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
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'farmer':
        return 'success';
      case 'buyer':
        return 'primary';
      case 'agronomist':
        return 'info';
      case 'investor':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'farmer':
        return <TerrainIcon />;
      case 'buyer':
        return <ShoppingCartIcon />;
      case 'agronomist':
        return <GrassIcon />;
      case 'investor':
        return <StoreIcon />;
      default:
        return <PersonIcon />;
    }
  };
  
  const handleOpenResourceDialog = (resource?: Resource) => {
      if (resource) {
          setCurrentResource(resource);
          setResourceForm({
              name: resource.name,
              type: resource.type,
              hourlyRate: resource.hourlyRate,
              location: resource.location
          });
      } else {
          setCurrentResource(null);
          setResourceForm({
              name: '',
              type: '',
              hourlyRate: 0,
              location: ''
          });
      }
      setResourceDialog(true);
  };

  const handleResourceSubmit = async () => {
      try {
          if (currentResource) {
              // Update existing resource
              await axios.put(`${API_BASE_URL}/api/admin/resources/${currentResource._id}`, resourceForm);
              setSuccess('Resource updated successfully');
          } else {
              // Create new resource
              await axios.post(`${API_BASE_URL}/api/admin/resources`, resourceForm);
              setSuccess('Resource created successfully');
          }
          setResourceDialog(false);
          fetchDashboardData(); // Refresh data
      } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to save resource');
      }
  };
  
  const handleDeleteResource = async (resourceId: string) => {
      if (window.confirm('Are you sure you want to delete this resource?')) {
          try {
              await axios.delete(`${API_BASE_URL}/api/admin/resources/${resourceId}`);
              setSuccess('Resource deleted successfully');
              fetchDashboardData(); // Refresh data
          } catch (err: any) {
              setError(err.response?.data?.message || 'Failed to delete resource');
          }
      }
  };


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading dashboard data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">{error}</Typography>
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
          This is your comprehensive admin control panel. From here, you can manage all aspects of the platform including users, fields, crops, sensors, land tokens, bulk uploads, and system configuration.
        </Typography>
      </Paper>

      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.users || 0}
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
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    fields
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.fields || 0}
                  </Typography>
                </Box>
                <TerrainIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/admin/fields"
                  size="small"
                  color="primary"
                >
                  Manage fields
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Crops
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.crops || 0}
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
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sensors
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.sensors || 0}
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
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Orders
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.orders || 0}
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

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resources
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData?.counts.resources || 0}
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

      {/* Action Buttons Row */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/admin/users/new"
        >
          Add User
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenResourceDialog()}
        >
          Add Resource
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setBulkUploadDialog(true)}
          color="secondary"
        >
          Bulk Upload
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => window.open('/api/admin/reports/users?format=csv', '_blank')}
        >
          Export Users
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => window.open('/api/admin/reports/land-tokens?format=csv', '_blank')}
        >
          Export Land Tokens
        </Button>
      </Box>

      {/* Tabs for Detailed Management */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Recent Users (${users.length})`} />
          <Tab label={`Recent Orders (${dashboardData?.recentOrders?.length || 0})`} />
          <Tab label={`Pending Land Tokens (${landTokens.length})`} />
          <Tab label={`Bulk Uploads (${bulkUploads.length})`} />
          <Tab label={`Resources (${resources.length})`} />
        </Tabs>
      </Box>

      {/* Resources Tab */}
      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              All Resources
            </Typography>
            <Button 
              component={RouterLink} 
              to="/admin/resources" 
              size="small" 
              endIcon={<ResourcesIcon />}
            >
              View All
            </Button>
          </Box>
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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource._id}>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>₹{resource.hourlyRate}</TableCell>
                      <TableCell>{resource.location}</TableCell>
                      <TableCell>{resource.owner.name}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenResourceDialog(resource)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteResource(resource._id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No resources found.
            </Typography>
          )}
        </Paper>
      )}

      {/* Existing Tabs follow... */}
      {/* Recent Users Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Recent Users
            </Typography>
            <Button 
              component={RouterLink} 
              to="/admin/users" 
              size="small" 
              endIcon={<PeopleIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {users.length > 0 ? (
            <List>
              {users.map((user) => (
                <ListItem
                  key={user._id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="View">
                        <IconButton 
                          component={RouterLink}
                          to={`/admin/users/${user._id}`}
                          edge="end" 
                          aria-label="view"
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          component={RouterLink}
                          to={`/admin/users/${user._id}/edit`}
                          edge="end" 
                          aria-label="edit"
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                      {getRoleIcon(user.role)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {user.email}
                        </Typography>
                        {` \u2014 Joined ${formatDate(user.createdAt)}`}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No users found.
            </Typography>
          )}
        </Paper>
      )}

      {/* Recent Orders Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Recent Orders
            </Typography>
            <Button 
              component={RouterLink} 
              to="/admin/orders" 
              size="small" 
              endIcon={<ShoppingCartIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.recentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order._id.substring(0, 8)}...</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.buyer.name}</TableCell>
                      <TableCell>{order.seller.name}</TableCell>
                      <TableCell align="right">${order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} 
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton 
                            component={RouterLink}
                            to={`/admin/orders/${order._id}`}
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No recent orders found.
            </Typography>
          )}
        </Paper>
      )}

      {/* Pending Land Tokens Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Pending Land Tokens
            </Typography>
            <Button 
              component={RouterLink} 
              to="/admin/tokens" 
              size="small" 
              endIcon={<StoreIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {landTokens.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Land ID</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {landTokens.map((token) => (
                    <TableRow key={token._id}>
                      <TableCell>{token.landId}</TableCell>
                      <TableCell>{token.owner.name}</TableCell>
                      <TableCell>
                        {token.landDetails.location.city}, {token.landDetails.location.state}
                      </TableCell>
                      <TableCell>
                        {token.landDetails.area.value} {token.landDetails.area.unit}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={token.verification.status} 
                          size="small"
                          color={token.verification.status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(token.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton 
                            component={RouterLink}
                            to={`/admin/tokens/${token._id}`}
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No pending land tokens found.
            </Typography>
          )}
        </Paper>
      )}

      {/* Bulk Uploads Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Bulk Uploads
            </Typography>
            <Button 
              component={RouterLink} 
              to="/admin/bulk-uploads" 
              size="small" 
              endIcon={<UploadIcon />}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {bulkUploads.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Records</TableCell>
                    <TableCell align="right">Success</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkUploads.map((upload) => (
                    <TableRow key={upload._id}>
                      <TableCell>{upload.filename}</TableCell>
                      <TableCell>
                        <Chip label={upload.type} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={upload.status} 
                          color={getStatusColor(upload.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{upload.records}</TableCell>
                      <TableCell align="right">{upload.success}</TableCell>
                      <TableCell align="right">{upload.failed}</TableCell>
                      <TableCell>{upload.uploadedAt}</TableCell>
                      <TableCell>
                        <Tooltip title="Download Report">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No bulk uploads found.
            </Typography>
          )}
        </Paper>
      )}

      {/* Verification Dialog */}
      <Dialog open={verificationDialog} onClose={() => setVerificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'User Verification' : 'Land Token Verification'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Verification Notes / Rejection Reason"
            value={verificationNotes || rejectionReason}
            onChange={(e) => {
              setVerificationNotes(e.target.value);
              setRejectionReason(e.target.value);
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              setError('Rejection functionality coming soon');
              setVerificationDialog(false);
            }}
          >
            Reject
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={() => {
              setSuccess('Approval functionality coming soon');
              setVerificationDialog(false);
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialog} onClose={() => setBulkUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Upload Type</InputLabel>
            <Select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              label="Upload Type"
            >
              <MenuItem value="users">Users</MenuItem>
              <MenuItem value="fields">Fields</MenuItem>
              <MenuItem value="crops">Crops</MenuItem>
              <MenuItem value="sensors">Sensors</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={!uploadType}
            sx={{ mb: 2 }}
          >
            Download Template
          </Button>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!uploadFile || !uploadType}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Resource Dialog */}
      <Dialog open={resourceDialog} onClose={() => setResourceDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{currentResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          <DialogContent>
              <TextField
                  autoFocus
                  margin="dense"
                  label="Resource Name"
                  type="text"
                  fullWidth
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                  <InputLabel>Type</InputLabel>
                  <Select
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                      label="Type"
                  >
                      <MenuItem value="Machinery">Machinery</MenuItem>
                      <MenuItem value="Equipment">Equipment</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                  </Select>
              </FormControl>
              <TextField
                  margin="dense"
                  label="Hourly Rate"
                  type="number"
                  fullWidth
                  value={resourceForm.hourlyRate}
                  onChange={(e) => setResourceForm({ ...resourceForm, hourlyRate: parseFloat(e.target.value) || 0 })}
              />
              <TextField
                  margin="dense"
                  label="Location"
                  type="text"
                  fullWidth
                  value={resourceForm.location}
                  onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setResourceDialog(false)}>Cancel</Button>
              <Button onClick={handleResourceSubmit} color="primary" variant="contained">
                  {currentResource ? 'Update' : 'Add'}
              </Button>
          </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;