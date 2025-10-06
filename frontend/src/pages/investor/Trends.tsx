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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  PieChart,
  Timeline,
  FilterList,
  Download,
  Refresh,
  LocationOn,
  CalendarToday,
  AttachMoney,
  Agriculture,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import axios from 'axios';

interface TrendData {
  date: string;
  crop: string;
  price: number;
  volume: number;
  roi: number;
  marketCap: number;
}

interface CropTrend {
  name: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
}

interface MarketTrend {
  category: string;
  value: number;
  growth: number;
  color: string;
}

interface InvestmentTrend {
  month: string;
  investment: number;
  returns: number;
  roi: number;
}

interface RegionalTrend {
  region: string;
  crop: string;
  yield: number;
  price: number;
  demand: number;
}

const Trends: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [cropFilter, setCropFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [cropTrends, setCropTrends] = useState<CropTrend[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [investmentTrends, setInvestmentTrends] = useState<InvestmentTrend[]>([]);
  const [regionalTrends, setRegionalTrends] = useState<RegionalTrend[]>([]);

  useEffect(() => {
    fetchTrendData();
  }, [timeRange, cropFilter, regionFilter]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      const [trends, crops, markets, investments, regional] = await Promise.all([
        axios.get(`/api/trends?timeRange=${timeRange}&crop=${cropFilter}&region=${regionFilter}`),
        axios.get('/api/trends/crop-prices'),
        axios.get('/api/trends/market-overview'),
        axios.get('/api/trends/investment-performance'),
        axios.get('/api/trends/regional-analysis'),
      ]);

      setTrendData(trends.data);
      setCropTrends(crops.data);
      setMarketTrends(markets.data);
      setInvestmentTrends(investments.data);
      setRegionalTrends(regional.data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchTrendData();
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      case 'stable': return '#ff9800';
      default: return '#2196f3';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" />;
    if (change < 0) return <TrendingDown color="error" />;
    return <ShowChart color="warning" />;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Investment Trends & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track market trends, crop performance, and investment opportunities
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="7d">7 Days</MenuItem>
                  <MenuItem value="30d">30 Days</MenuItem>
                  <MenuItem value="90d">90 Days</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Crop</InputLabel>
                <Select
                  value={cropFilter}
                  onChange={(e) => setCropFilter(e.target.value)}
                  label="Crop"
                >
                  <MenuItem value="all">All Crops</MenuItem>
                  <MenuItem value="rice">Rice</MenuItem>
                  <MenuItem value="wheat">Wheat</MenuItem>
                  <MenuItem value="corn">Corn</MenuItem>
                  <MenuItem value="soybeans">Soybeans</MenuItem>
                  <MenuItem value="cotton">Cotton</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  label="Region"
                >
                  <MenuItem value="all">All Regions</MenuItem>
                  <MenuItem value="north">North</MenuItem>
                  <MenuItem value="south">South</MenuItem>
                  <MenuItem value="east">East</MenuItem>
                  <MenuItem value="west">West</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Market Overview" />
            <Tab label="Crop Trends" />
            <Tab label="Investment Performance" />
            <Tab label="Regional Analysis" />
            <Tab label="Price Predictions" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Market Overview
            </Typography>
            <Grid container spacing={3}>
              {/* Market Summary Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Total Market Cap
                    </Typography>
                    <Typography variant="h4">
                      $2.4B
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +12.5% this month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Trading Volume
                    </Typography>
                    <Typography variant="h4">
                      450K
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +8.3% this week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Average ROI
                    </Typography>
                    <Typography variant="h4">
                      18.5%
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +2.1% this month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Active Investors
                    </Typography>
                    <Typography variant="h4">
                      2,847
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      +15.2% this quarter
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Market Trends Chart */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Market Trends Over Time
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area type="monotone" dataKey="price" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="volume" stroke="#82ca9d" fill="#82ca9d" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Market Distribution */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Market Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={marketTrends}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }:any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {marketTrends.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Crop Price Trends
            </Typography>
            <Grid container spacing={3}>
              {/* Crop Trend Cards */}
              {cropTrends.map((crop, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{crop.name}</Typography>
                        {getChangeIcon(crop.changePercent)}
                      </Box>
                      <Typography variant="h4">
                        ${crop.currentPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color={crop.change > 0 ? 'success.main' : 'error.main'}>
                        {crop.changePercent > 0 ? '+' : ''}{crop.changePercent.toFixed(2)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Volume: {crop.volume.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {/* Price Chart */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Crop Price History
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={cropTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="currentPrice" stroke="#8884d8" />
                        <Line type="monotone" dataKey="previousPrice" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Investment Performance Trends
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Investment vs Returns Over Time
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={investmentTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="investment" fill="#8884d8" />
                        <Bar dataKey="returns" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ROI Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={investmentTrends} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="month" type="category" />
                        <RechartsTooltip />
                        <Bar dataKey="roi" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Regional Investment Analysis
            </Typography>
            <Grid container spacing={3}>
              {regionalTrends.map((trend, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{trend.region}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Crop: {trend.crop}
                      </Typography>
                      <Typography variant="body2">
                        Yield: {trend.yield} tons/acre
                      </Typography>
                      <Typography variant="body2">
                        Price: ${trend.price}/ton
                      </Typography>
                      <Typography variant="body2">
                        Demand: {trend.demand}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={trend.demand * 10} 
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Price Predictions & Forecasting
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      30-Day Price Forecast
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="predictedPrice" stroke="#8884d8" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="actualPrice" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Market Sentiment
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Bullish</Typography>
                        <Chip label="65%" color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Bearish</Typography>
                        <Chip label="25%" color="error" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Neutral</Typography>
                        <Chip label="10%" color="warning" size="small" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Trends;