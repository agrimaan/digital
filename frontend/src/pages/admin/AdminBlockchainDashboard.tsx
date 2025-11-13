import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
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
  MenuItem
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransactionIcon,
  Description as ContractIcon,
  Token as TokenIcon,
  BarChart as StatsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

interface Wallet {
  address: string;
  balance: number;
  status: string;
  createdAt: string;
}

interface Transaction {
  _id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType: string;
  status: string;
  createdAt: string;
}

interface Contract {
  _id: string;
  contractAddress: string;
  contractName: string;
  contractType: string;
  network: string;
  deploymentTransaction: string;
  createdAt: string;
}

interface LandToken {
  _id: string;
  tokenId: string;
  name: string;
  location: string;
  area: number;
  owner: string;
  status: string;
  createdAt: string;
}

interface MarketplaceData {
  totalTokens: number;
  totalTransactions: number;
  activeContracts: number;
  tokenTypes: Record<string, number>;
}

const AdminBlockchainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [landTokens, setLandTokens] = useState<LandToken[]>([]);
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    toAddress: '',
    amount: '',
    tokenType: 'AGM'
  });
  
  // Token creation dialog state
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenType, setTokenType] = useState('Fields');
  const [tokenData, setTokenData] = useState({
    name: '',
    location: '',
    area: '',
    coordinates: [] as number[],
    valuation: ''
  });

  // Fetch all blockchain data
  const fetchBlockchainData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch wallet
      const walletResponse = await axios.get(`${API_BASE_URL}/api/blockchain/wallet`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWallet(walletResponse.data.data);
      
      // Fetch transactions
      const transactionsResponse = await axios.get(`${API_BASE_URL}/api/blockchain/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(transactionsResponse.data.transactions || []);
      
      // Fetch contracts
      const contractsResponse = await axios.get(`${API_BASE_URL}/api/blockchain/contracts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContracts(contractsResponse.data.contracts || []);
      
      // Fetch land tokens
      const tokensResponse = await axios.get(`${API_BASE_URL}/api/blockchain/land-tokens`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLandTokens(tokensResponse.data.tokens || []);
      
      // Fetch marketplace data
      const marketResponse = await axios.get(`${API_BASE_URL}/api/blockchain/market`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMarketplaceData(marketResponse.data.data?.marketData || marketResponse.data.data || {});
      
    } catch (err: any) {
      console.error('Error fetching blockchain data:', err);
      setError(err.response?.data?.message || 'Failed to load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    fetchBlockchainData();
  };

  const handleTransferSubmit = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/blockchain/transfer`, {
        toAddress: transferData.toAddress,
        amount: parseFloat(transferData.amount)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTransferDialogOpen(false);
      fetchBlockchainData();
    } catch (err: any) {
      console.error('Error transferring tokens:', err);
      setError(err.response?.data?.message || 'Failed to transfer tokens');
    }
  };

  const handleTokenSubmit = async () => {
    try {
      const endpoint = tokenType === 'Fields' 
        ? `${API_BASE_URL}/api/blockchain/tokens/Fields`
        : `${API_BASE_URL}/api/blockchain/tokens/farmhouse`;
      
      const data = tokenType === 'Fields' 
        ? {
            name: tokenData.name,
            location: tokenData.location,
            area: parseFloat(tokenData.area),
            coordinates: tokenData.coordinates
          }
        : {
            name: tokenData.name,
            location: tokenData.location,
            area: parseFloat(tokenData.area),
            valuation: parseFloat(tokenData.valuation)
          };
      
      await axios.post(endpoint, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTokenDialogOpen(false);
      fetchBlockchainData();
    } catch (err: any) {
      console.error('Error creating token:', err);
      setError(err.response?.data?.message || 'Failed to create token');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Blockchain Management</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <WalletIcon />
                </Avatar>
              }
              title="Wallet Balance"
              subheader={wallet?.address ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}` : 'No wallet'}
            />
            <CardContent>
              <Typography variant="h5">
                {wallet?.balance ? `${wallet.balance} AGM` : '0 AGM'}
              </Typography>
              <Chip 
                label={wallet?.status || 'Not Created'} 
                color={wallet?.status === 'active' ? 'success' : 'default'} 
                size="small" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <TransactionIcon />
                </Avatar>
              }
              title="Transactions"
              subheader="Recent activity"
            />
            <CardContent>
              <Typography variant="h5">
                {transactions.length}
              </Typography>
              <Button 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => setTransferDialogOpen(true)}
              >
                Transfer Tokens
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TokenIcon />
                </Avatar>
              }
              title="Land Tokens"
              subheader="Tokenized assets"
            />
            <CardContent>
              <Typography variant="h5">
                {landTokens.length}
              </Typography>
              <Button 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => setTokenDialogOpen(true)}
              >
                Create Token
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
          <Tab label="Marketplace Overview" icon={<StatsIcon />} />
          <Tab label="Transactions" icon={<TransactionIcon />} />
          <Tab label="Smart Contracts" icon={<ContractIcon />} />
          <Tab label="Land Tokens" icon={<TokenIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>Marketplace Statistics</Typography>
          {marketplaceData ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Tokens</Typography>
                    <Typography variant="h4">{marketplaceData.totalTokens || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Transactions</Typography>
                    <Typography variant="h4">{marketplaceData.totalTransactions || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Active Contracts</Typography>
                    <Typography variant="h4">{marketplaceData.activeContracts || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Token Types</Typography>
                    <Typography variant="h4">{Object.keys(marketplaceData.tokenTypes || {}).length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">No marketplace data available</Alert>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>Transaction History</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction Hash</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Token Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>
                      {tx.transactionHash.substring(0, 10)}...{tx.transactionHash.substring(tx.transactionHash.length - 8)}
                    </TableCell>
                    <TableCell>
                      {tx.fromAddress.substring(0, 6)}...{tx.fromAddress.substring(tx.fromAddress.length - 4)}
                    </TableCell>
                    <TableCell>
                      {tx.toAddress.substring(0, 6)}...{tx.toAddress.substring(tx.toAddress.length - 4)}
                    </TableCell>
                    <TableCell>{tx.amount}</TableCell>
                    <TableCell>{tx.tokenType}</TableCell>
                    <TableCell>
                      <Chip 
                        label={tx.status} 
                        size="small" 
                        color={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 2 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>Smart Contracts</Typography>
          <Grid container spacing={2}>
            {contracts.map((contract) => (
              <Grid item xs={12} md={6} key={contract._id}>
                <Card>
                  <CardHeader
                    title={contract.contractName}
                    subheader={contract.contractType}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Address: {contract.contractAddress.substring(0, 10)}...{contract.contractAddress.substring(contract.contractAddress.length - 8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Network: {contract.network}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Deployed: {new Date(contract.createdAt).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label="Verified" 
                      icon={<VerifiedIcon />} 
                      color="success" 
                      size="small" 
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>Land Tokens</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {landTokens.map((token) => (
                  <TableRow key={token._id}>
                    <TableCell>
                      {token.tokenId ? `${token.tokenId.substring(0, 6)}...${token.tokenId.substring(token.tokenId.length - 4)}` : 'N/A'}
                    </TableCell>
                    <TableCell>{token.name}</TableCell>
                    <TableCell>{token.location}</TableCell>
                    <TableCell>{token.area} acres</TableCell>
                    <TableCell>
                      {token.owner.substring(0, 6)}...{token.owner.substring(token.owner.length - 4)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={token.status} 
                        size="small" 
                        color={token.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(token.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Transfer Tokens Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Tokens</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipient Address"
                value={transferData.toAddress}
                onChange={(e) => setTransferData({ ...transferData, toAddress: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Token Type</InputLabel>
                <Select
                  value={transferData.tokenType}
                  label="Token Type"
                  onChange={(e) => setTransferData({ ...transferData, tokenType: e.target.value as string })}
                >
                  <MenuItem value="AGM">AGM</MenuItem>
                  <MenuItem value="Fields">Fields</MenuItem>
                  <MenuItem value="FARMHOUSE">FARMHOUSE</MenuItem>
                  <MenuItem value="OTHER">OTHER</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransferSubmit} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* Create Token Dialog */}
      <Dialog open={tokenDialogOpen} onClose={() => setTokenDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Land Token</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Token Type</InputLabel>
                <Select
                  value={tokenType}
                  label="Token Type"
                  onChange={(e) => setTokenType(e.target.value as string)}
                >
                  <MenuItem value="Fields">Fields Token</MenuItem>
                  <MenuItem value="farmhouse">Farmhouse Token</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={tokenData.name}
                onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={tokenData.location}
                onChange={(e) => setTokenData({ ...tokenData, location: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area (acres)"
                type="number"
                value={tokenData.area}
                onChange={(e) => setTokenData({ ...tokenData, area: e.target.value })}
                required
              />
            </Grid>
            
            {tokenType === 'farmhouse' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valuation"
                  type="number"
                  value={tokenData.valuation}
                  onChange={(e) => setTokenData({ ...tokenData, valuation: e.target.value })}
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTokenDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTokenSubmit} variant="contained">Create Token</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBlockchainDashboard;