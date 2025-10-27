import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  ShoppingCart,
  AttachMoney,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SUPPLIER_SERVICE_URL = process.env.REACT_APP_SUPPLIER_URL || 'http://localhost:3006';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalOrders: number;
  rating: number;
  totalRatings: number;
  status: string;
  isOperational: boolean;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  stockQuantity: number;
  status: string;
  orderCount: number;
  viewCount: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  farmerId: {
    name: string;
    email: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch supplier stats
      const statsResponse = await axios.get(
        `${SUPPLIER_SERVICE_URL}/api/suppliers/${user?.supplierId}/stats`,
        { headers }
      );

      // Fetch products
      const productsResponse = await axios.get(
        `${SUPPLIER_SERVICE_URL}/api/products?supplierId=${user?.supplierId}&limit=5`,
        { headers }
      );

      // Mock sales data (replace with actual API call)
      const mockSalesData = [
        { month: 'Jan', sales: 45000, orders: 23 },
        { month: 'Feb', sales: 52000, orders: 28 },
        { month: 'Mar', sales: 48000, orders: 25 },
        { month: 'Apr', sales: 61000, orders: 32 },
        { month: 'May', sales: 55000, orders: 29 },
        { month: 'Jun', sales: 67000, orders: 35 }
      ];

      // Mock category data (replace with actual API call)
      const mockCategoryData = [
        { name: 'Seeds', value: 35 },
        { name: 'Fertilizers', value: 28 },
        { name: 'Pesticides', value: 20 },
        { name: 'Equipment', value: 12 },
        { name: 'Others', value: 5 }
      ];

      setStats(statsResponse.data.data);
      setProducts(productsResponse.data.data || []);
      setSalesData(mockSalesData);
      setCategoryData(mockCategoryData);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Supplier Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening with your business today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats?.activeProducts || 0} active
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    This month
                  </Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Sales
                  </Typography>
                  <Typography variant="h4">
                    ₹{(stats?.totalSales || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last month
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Rating
                  </Typography>
                  <Typography variant="h4">
                    {stats?.rating?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.totalRatings || 0} reviews
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/supplier/products/add')}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<OfferIcon />}
            onClick={() => navigate('/supplier/promotions/add')}
          >
            Create Promotion
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/supplier/orders')}
          >
            View Orders
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/supplier/analytics')}
          >
            View Analytics
          </Button>
        </Box>
      </Paper>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales (₹)" />
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Products by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Products */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Top Products
          </Typography>
          <Button onClick={() => navigate('/supplier/products')}>
            View All
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell align="right">₹{product.basePrice}</TableCell>
                    <TableCell align="right">{product.stockQuantity}</TableCell>
                    <TableCell align="right">{product.orderCount || 0}</TableCell>
                    <TableCell align="right">{product.viewCount || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        color={product.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/supplier/products/${product._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/supplier/products/${product._id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No products found. Add your first product to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Status Alert */}
      {stats?.status !== 'approved' && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Your supplier account is currently <strong>{stats?.status}</strong>. 
          {stats?.status === 'pending' && ' Please wait for admin approval to start selling.'}
          {stats?.status === 'rejected' && ' Please contact support for more information.'}
        </Alert>
      )}
    </Container>
  );
};

export default SupplierDashboard;