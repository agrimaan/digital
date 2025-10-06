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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  LocationOn,
  CalendarToday,
  Visibility,
  Add,
  CheckCircle,
  Pending,
  Cancel,
  AccountBalance,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';

interface Investment {
  _id: string;
  landTokenId: string;
  landDetails: {
    location: string;
    size: number;
    soilType: string;
    irrigation: string;
  };
  investmentAmount: number;
  expectedReturns: number;
  investmentDate: string;
  maturityDate: string;
  status: 'active' | 'completed' | 'cancelled';
  returns: {
    current: number;
    projected: number;
  };
  farmer: {
    name: string;
    avatar: string;
  };
  crop: {
    name: string;
    season: string;
    expectedYield: number;
  };
}

interface InvestmentStats {
  totalInvestments: number;
  activeInvestments: number;
  totalReturns: number;
  averageROI: number;
  monthlyGrowth: number;
}

const MyInvestments: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<InvestmentStats>({
    totalInvestments: 0,
    activeInvestments: 0,
    totalReturns: 0,
    averageROI: 0,
    monthlyGrowth: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investDialog, setInvestDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get('/api/investments/my-investments');
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/investments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Pending />;
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
            My Investments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage all your agricultural investments in one place
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

      {/* Stats Overview */}
      <MuiGrid container spacing={3} sx={{ mb: 3 }}>
        <MuiGrid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalInvestments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Investments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </MuiGrid>

        <MuiGrid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.activeInvestments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </MuiGrid>

        <MuiGrid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AttachMoney />
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
        </MuiGrid>

        <MuiGrid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
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
        </MuiGrid>
      </MuiGrid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Investments" />
          <Tab label="Active" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {/* Investments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Investment Details</TableCell>
              <TableCell>Land & Crop</TableCell>
              <TableCell>Amount & Returns</TableCell>
              <TableCell>Farmer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvestments.map((investment) => (
              <TableRow key={investment._id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Investment #{investment._id.slice(-6)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(investment.investmentDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {investment.landDetails.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {investment.landDetails.size} acres • {investment.crop.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {investment.crop.season} season
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      ${investment.investmentAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expected: ${investment.returns.projected.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current: ${investment.returns.current.toLocaleString()}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                      {investment.farmer.avatar || investment.farmer.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{investment.farmer.name}</Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={getStatusIcon(investment.status)}
                    label={investment.status}
                    color={getStatusColor(investment.status)}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedInvestment(investment)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Investment Dialog */}
      <Dialog 
        open={investDialog} 
        onClose={() => setInvestDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>New Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onSubmit={handleInvest} />
        </DialogContent>
      </Dialog>

      {/* Investment Details Dialog */}
      <Dialog 
        open={selectedInvestment !== null} 
        onClose={() => setSelectedInvestment(null)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Investment Details</DialogTitle>
        <DialogContent>
          {selectedInvestment && (
            <Box sx={{ mt: 2 }}>
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12}>
                  <Typography variant="h6">Land Details</Typography>
                  <Typography variant="body2">
                    Location: {selectedInvestment.landDetails.location}
                  </Typography>
                  <Typography variant="body2">
                    Size: {selectedInvestment.landDetails.size} acres
                  </Typography>
                  <Typography variant="body2">
                    Soil Type: {selectedInvestment.landDetails.soilType}
                  </Typography>
                  <Typography variant="body2">
                    Irrigation: {selectedInvestment.landDetails.irrigation}
                  </Typography>
                </MuiGrid>
                
                <MuiGrid item xs={12}>
                  <Typography variant="h6">Investment Details</Typography>
                  <Typography variant="body2">
                    Amount: ${selectedInvestment.investmentAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Expected Returns: ${selectedInvestment.expectedReturns.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Investment Date: {new Date(selectedInvestment.investmentDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Maturity Date: {new Date(selectedInvestment.maturityDate).toLocaleDateString()}
                  </Typography>
                </MuiGrid>
                
                <MuiGrid item xs={12}>
                  <Typography variant="h6">Crop Details</Typography>
                  <Typography variant="body2">
                    Crop: {selectedInvestment.crop.name}
                  </Typography>
                  <Typography variant="body2">
                    Season: {selectedInvestment.crop.season}
                  </Typography>
                  <Typography variant="body2">
                    Expected Yield: {selectedInvestment.crop.expectedYield} tons
                  </Typography>
                </MuiGrid>
              </MuiGrid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvestment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Investment Form Component
const InvestmentForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    landTokenId: '',
    investmentAmount: 0,
    expectedReturns: 0,
    maturityDate: '',
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
            label="Land Token ID"
            value={formData.landTokenId}
            onChange={(e) => setFormData({ ...formData, landTokenId: e.target.value })}
            required
            helperText="Enter the token ID of the land you want to invest in"
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
            helperText="Amount you want to invest in USD"
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
            helperText="Expected return amount based on crop yield and market prices"
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
            helperText="Expected date when investment will mature"
          />
        </MuiGrid>
      </MuiGrid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" variant="contained">Create Investment</Button>
      </Box>
    </Box>
  );
};

export default MyInvestments;