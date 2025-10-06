import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid as MuiGrid,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  AccountBalance,
  PieChart,
  BarChart,
  ShowChart,
  Add,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  LocationOn,
  CalendarToday,
  Person,
  Phone,
  Email,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';

interface Investment {
  _id: string;
  landTokenId: string;
  title: string;
  description: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  size: number;
  soilType: string;
  irrigation: string;
  investmentAmount: number;
  expectedReturns: number;
  currentReturns: number;
  roi: number;
  investmentDate: string;
  maturityDate: string;
  status: 'active' | 'completed' | 'cancelled';
  farmer: {
    name: string;
    avatar: string;
    phone: string;
    email: string;
  };
  crop: {
    name: string;
    season: string;
    expectedYield: number;
    currentYield: number;
  };
  documents: string[];
  images: string[];
}

interface PortfolioStats {
  totalInvestment: number;
  currentValue: number;
  totalReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  averageROI: number;
  monthlyGrowth: number;
  portfolioDistribution: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

const InvestorPortfolio: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalInvestment: 0,
    currentValue: 0,
    totalReturns: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    averageROI: 0,
    monthlyGrowth: 0,
    portfolioDistribution: [],
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investDialog, setInvestDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get('/api/investor/portfolio');
      setInvestments(response.data.investments || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/investor/portfolio-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching portfolio stats:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInvest = async (investmentData: any) => {
    try {
      await axios.post('/api/investments/create', investmentData);
      setInvestDialog(false);
      fetchInvestments();
      fetchStats();
    } catch (error) {
      console.error('Error creating investment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle fontSize="small" />;
      case 'completed': return <CheckCircle fontSize="small" />;
      case 'cancelled': return <Cancel fontSize="small" />;
      default: return null;
    }
  };

  const filteredInvestments = investments.filter(investment => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return investment.status === 'active';
    if (tabValue === 2) return investment.status === 'completed';
    if (tabValue === 3) return investment.status === 'cancelled';
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Investment Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive view of all your agricultural investments and performance
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setInvestDialog(true)}
          size="large"
        >
          New Investment
        </Button>
      </Box>

      {/* Portfolio Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant="h4">${stats.totalInvestment.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Investment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <ShowChart />
                </Avatar>
                <Box>
                  <Typography variant="h4">${stats.currentValue.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">${stats.totalReturns.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Returns
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <PieChart />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.averageROI}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average ROI
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Investment Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Investment Performance
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{stats.activeInvestments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Investments
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6">{stats.completedInvestments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Investments
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6">{stats.monthlyGrowth}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Growth
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Distribution
              </Typography>
              {stats.portfolioDistribution.map((item, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{item.category}</Typography>
                    <Typography variant="body2">${item.amount.toLocaleString()}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={item.percentage} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Investments" />
          <Tab label="Active" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {/* Investment Cards/Table */}
      <Box>
        {filteredInvestments.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No investments found
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary">
                Start by creating your first investment
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredInvestments.map((investment) => (
              <Grid item xs={12} md={6} lg={4} key={investment._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" noWrap>
                        {investment.title}
                      </Typography>
                      <Chip
                        label={investment.status}
                        color={getStatusColor(investment.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {investment.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                        {investment.location.address}
                      </Typography>
                      <Typography variant="body2">
                        Size: {investment.size} acres
                      </Typography>
                      <Typography variant="body2">
                        Soil: {investment.soilType}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Crop: {investment.crop.name}
                      </Typography>
                      <Typography variant="body2">
                        Expected Yield: {investment.crop.expectedYield} tons
                      </Typography>
                      <Typography variant="body2">
                        Season: {investment.crop.season}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        ${investment.investmentAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Investment Amount
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="success.main">
                        ${investment.expectedReturns.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expected Returns
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        ROI: {investment.roi}%
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <Person sx={{ fontSize: 16, mr: 1 }} />
                        {investment.farmer.name}
                      </Typography>
                      <Typography variant="body2">
                        <Phone sx={{ fontSize: 16, mr: 1 }} />
                        {investment.farmer.phone}
                      </Typography>
                      <Typography variant="body2">
                        <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                        {new Date(investment.investmentDate).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => setSelectedInvestment(investment)}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        variant="outlined"
                      >
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Investment Dialog */}
      <Dialog 
        open={selectedInvestment !== null} 
        onClose={() => setSelectedInvestment(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Investment Details - {selectedInvestment?.title}
        </DialogTitle>
        <DialogContent>
          {selectedInvestment && (
            <Box sx={{ mt: 2 }}>
              <MuiGrid container spacing={3}>
                <MuiGrid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Land Details
                  </Typography>
                  <Typography variant="body2">
                    Location: {selectedInvestment.location.address}
                  </Typography>
                  <Typography variant="body2">
                    Coordinates: {selectedInvestment.location.coordinates.join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    Size: {selectedInvestment.size} acres
                  </Typography>
                  <Typography variant="body2">
                    Soil Type: {selectedInvestment.soilType}
                  </Typography>
                  <Typography variant="body2">
                    Irrigation: {selectedInvestment.irrigation}
                  </Typography>
                </MuiGrid>

                <MuiGrid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Investment Details
                  </Typography>
                  <Typography variant="body2">
                    Investment Amount: ${selectedInvestment.investmentAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Expected Returns: ${selectedInvestment.expectedReturns.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Current Returns: ${selectedInvestment.currentReturns.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    ROI: {selectedInvestment.roi}%
                  </Typography>
                  <Typography variant="body2">
                    Investment Date: {new Date(selectedInvestment.investmentDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Maturity Date: {new Date(selectedInvestment.maturityDate).toLocaleDateString()}
                  </Typography>
                </MuiGrid>

                <MuiGrid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Farmer Details
                  </Typography>
                  <Typography variant="body2">
                    Name: {selectedInvestment.farmer.name}
                  </Typography>
                  <Typography variant="body2">
                    Phone: {selectedInvestment.farmer.phone}
                  </Typography>
                  <Typography variant="body2">
                    Email: {selectedInvestment.farmer.email}
                  </Typography>
                </MuiGrid>

                <MuiGrid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Crop Details
                  </Typography>
                  <Typography variant="body2">
                    Crop: {selectedInvestment.crop.name}
                  </Typography>
                  <Typography variant="body2">
                    Season: {selectedInvestment.crop.season}
                  </Typography>
                  <Typography variant="body2">
                    Expected Yield: {selectedInvestment.crop.expectedYield} tons
                  </Typography>
                  <Typography variant="body2">
                    Current Yield: {selectedInvestment.crop.currentYield} tons
                  </Typography>
                </MuiGrid>
              </MuiGrid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedInvestment.documents.map((doc, index) => (
                    <Button key={index} variant="outlined" size="small">
                      Document {index + 1}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvestment(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New Investment Dialog */}
      <Dialog 
        open={selectedInvestment === null && false} // This will be controlled by state
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Create New Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onSubmit={handleInvest} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Investment Form Component
const InvestmentForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      address: '',
      coordinates: [0, 0],
    },
    size: 0,
    soilType: '',
    irrigation: '',
    investmentAmount: 0,
    expectedReturns: 0,
    maturityDate: '',
    farmer: {
      name: '',
      phone: '',
      email: '',
    },
    crop: {
      name: '',
      season: '',
      expectedYield: 0,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <MuiGrid container spacing={3}>
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Investment Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </MuiGrid>
        
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Location Address"
            value={formData.location.address}
            onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
            required
          />
        </MuiGrid>
        
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Size (acres)"
            type="number"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) })}
            required
          />
        </MuiGrid>
        
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Investment Amount"
            type="number"
            value={formData.investmentAmount}
            onChange={(e) => setFormData({ ...formData, investmentAmount: parseFloat(e.target.value) })}
            required
          />
        </MuiGrid>
        
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Expected Returns"
            type="number"
            value={formData.expectedReturns}
            onChange={(e) => setFormData({ ...formData, expectedReturns: parseFloat(e.target.value) })}
            required
          />
        </MuiGrid>
        
        <MuiGrid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Maturity Date"
            type="date"
            value={formData.maturityDate}
            onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
            required
            InputLabelProps={{ shrink: true }}
          />
        </MuiGrid>
        
        <MuiGrid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </MuiGrid>
      </MuiGrid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button>Cancel</Button>
        <Button type="submit" variant="contained">Create Investment</Button>
      </Box>
    </Box>
  );
};

export default InvestorPortfolio;