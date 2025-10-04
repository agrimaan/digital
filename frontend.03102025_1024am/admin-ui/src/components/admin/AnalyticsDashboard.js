import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../../store/actions/analyticsActions';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector(state => state.analytics);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    dispatch(fetchAnalytics({ timeRange }));
  }, [dispatch, timeRange]);

  const summaryCards = [
    {
      title: 'Total Users',
      value: analytics?.summary?.totalUsers || 0,
      change: analytics?.summary?.userGrowth || 0,
      icon: <PeopleIcon fontSize="large" />,
      color: '#4caf50',
    },
    {
      title: 'Revenue',
      value: `$${analytics?.summary?.totalRevenue || 0}`,
      change: analytics?.summary?.revenueGrowth || 0,
      icon: <MoneyIcon fontSize="large" />,
      color: '#2196f3',
    },
    {
      title: 'Orders',
      value: analytics?.summary?.totalOrders || 0,
      change: analytics?.summary?.orderGrowth || 0,
      icon: <ShoppingCartIcon fontSize="large" />,
      color: '#ff9800',
    },
    {
      title: 'Conversion Rate',
      value: `${analytics?.summary?.conversionRate || 0}%`,
      change: analytics?.summary?.conversionGrowth || 0,
      icon: <TrendingUpIcon fontSize="large" />,
      color: '#9c27b0',
    },
  ];

  const userActivityData = analytics?.userActivity || [
    { name: 'Mon', users: 400, sessions: 240 },
    { name: 'Tue', users: 300, sessions: 139 },
    { name: 'Wed', users: 500, sessions: 380 },
    { name: 'Thu', users: 278, sessions: 190 },
    { name: 'Fri', users: 489, sessions: 320 },
    { name: 'Sat', users: 239, sessions: 180 },
    { name: 'Sun', users: 349, sessions: 230 },
  ];

  const revenueData = analytics?.revenueData || [
    { name: 'Jan', revenue: 4000, profit: 2400 },
    { name: 'Feb', revenue: 3000, profit: 1398 },
    { name: 'Mar', revenue: 2000, profit: 9800 },
    { name: 'Apr', revenue: 2780, profit: 3908 },
    { name: 'May', revenue: 1890, profit: 4800 },
    { name: 'Jun', revenue: 2390, profit: 3800 },
  ];

  const categoryData = analytics?.categoryData || [
    { name: 'Electronics', value: 400, color: '#8884d8' },
    { name: 'Clothing', value: 300, color: '#82ca9d' },
    { name: 'Books', value: 300, color: '#ffc658' },
    { name: 'Home', value: 200, color: '#ff7300' },
    { name: 'Sports', value: 150, color: '#8dd1e1' },
  ];

  const deviceData = analytics?.deviceData || [
    { name: 'Desktop', value: 45, color: '#0088FE' },
    { name: 'Mobile', value: 35, color: '#00C49F' },
    { name: 'Tablet', value: 20, color: '#FFBB28' },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#4caf50" />
            <Bar dataKey="sessions" fill="#2196f3" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="users" stackId="1" stroke="#4caf50" fill="#4caf50" />
            <Area type="monotone" dataKey="sessions" stackId="1" stroke="#2196f3" fill="#2196f3" />
          </AreaChart>
        );
      default:
        return (
          <LineChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#4caf50" strokeWidth={2} />
            <Line type="monotone" dataKey="sessions" stroke="#2196f3" strokeWidth={2} />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              label="Chart Type"
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="area">Area Chart</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {card.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={card.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {card.change >= 0 ? '+' : ''}{card.change}%
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* User Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart()}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Usage Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue & Profit
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4caf50" />
                  <Bar dataKey="profit" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;