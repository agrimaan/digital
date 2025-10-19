
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
  CardHeader,
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
  Avatar,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarMonth as CalendarIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon,
  Grass as GrassIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';


// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'farmer' | 'buyer' | 'seller';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  profileImage?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface Fields {
  _id: string;
  name: string;
  size: {
    value: number;
    unit: string;
  };
  location: string;
  crops: number;
  sensors: number;
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

// Tab panel component
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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
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
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [fields, setFields] = useState<Fields[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user details
        const userResponse = await axios.get(`${API_BASE_URL}/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
           const userData = userResponse.data.data?.user || userResponse.data.user || userResponse.data;
        setUser(userData);
        // Fetch user's fields
        const fieldsResponse = await axios.get(`${API_BASE_URL}/api/fields?owner=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        
        const fieldsData = fieldsResponse.data.data?.field || fieldsResponse.data.field || [];
        console.log("Fields data received:", fieldsData);
        setFields(fieldsData);

        // Fetch user's orders
        const ordersResponse = await axios.get(`${API_BASE_URL}/api/marketplace/orders?user=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const ordersData = ordersResponse.data.data?.orders || ordersResponse.data.orders || [];
        setOrders(ordersData);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get verification color
  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'farmer': return 'success';
      case 'buyer': return 'info';
      case 'seller': return 'primary';
      default: return 'default';
    }
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

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'User not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            component={RouterLink}
            to="/admin/users"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Back to Users
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/admin/users/${user._id}/edit`}
              startIcon={<EditIcon />}
            >
              Edit User
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete User
            </Button>
          </Box>
        </Box>

        {/* User Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                    src={user.profileImage}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6">{user.name}</Typography>
                  <Chip 
                    label={user.role} 
                    color={getRoleColor(user.role) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon color="action" fontSize="small" />
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                    {user.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon color="action" fontSize="small" />
                        <Typography variant="body2">{user.phone}</Typography>
                      </Box>
                    )}
                    {user.address && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {user.address.street}, {user.address.city}, {user.address.state}, {user.address.country} - {user.address.zipCode}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon color="action" fontSize="small" />
                      <Typography variant="body2">Joined: {formatDate(user.createdAt)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedIcon color="action" fontSize="small" />
                      <Chip 
                        label={user.verificationStatus} 
                        color={getVerificationColor(user.verificationStatus) as any}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Fields" {...a11yProps(1)} />
          <Tab label="Orders" {...a11yProps(2)} />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GrassIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">{fields.length}</Typography>
                      <Typography variant="body2" color="text.secondary">Fields</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ShoppingCartIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">{orders.length}</Typography>
                      <Typography variant="body2" color="text.secondary">Orders</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">
                        {orders.filter(o => o.status === 'delivered').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Completed Orders</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">{formatDate(user.updatedAt)}</Typography>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Fields Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>User's Fields</Typography>
          {fields.length === 0 ? (
            <Alert severity="info">No fields found for this user.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field Name</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Crops</TableCell>
                    <TableCell>Sensors</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field._id}>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.size.value} {field.size.unit}</TableCell>
                      <TableCell>{field.location}</TableCell>
                      <TableCell>{field.crops}</TableCell>
                      <TableCell>{field.sensors}</TableCell>
                      <TableCell>{formatDate(field.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>User's Orders</Typography>
          {orders.length === 0 ? (
            <Alert severity="info">No orders found for this user.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>\u20b9{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          color={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'error' :
                            order.status === 'pending' ? 'warning' : 'info'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminUserDetail;
