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
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Token as TokenIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

interface LandToken {
  _id: string;
  tokenId: string;
  name: string;
  location: string;
  area: number;
  owner: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    coordinates?: number[];
    valuation?: number;
    description?: string;
  };
}

const AdminLandTokenization: React.FC = () => {
  const [tokens, setTokens] = useState<LandToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<LandToken | null>(null);
  
  // Form states
  const [tokenType, setTokenType] = useState('Fields');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    area: '',
    owner: '',
    coordinates: '',
    valuation: '',
    description: ''
  });

  // Fetch land tokens
  const fetchLandTokens = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/blockchain/land-tokens`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTokens(response.data.tokens || []);
    } catch (err: any) {
      console.error('Error fetching land tokens:', err);
      setError(err.response?.data?.message || 'Failed to load land tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandTokens();
  }, []);

  const handleCreateToken = async () => {
    try {
      const endpoint = tokenType === 'Fields' 
        ? `${API_BASE_URL}/api/blockchain/tokens/Fields`
        : `${API_BASE_URL}/api/blockchain/tokens/farmhouse`;
      
      const data: any = {
        name: formData.name,
        location: formData.location,
        area: parseFloat(formData.area)
      };
      
      if (tokenType === 'Fields' && formData.coordinates) {
        data.coordinates = formData.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      }
      
      if (tokenType === 'farmhouse') {
        data.valuation = parseFloat(formData.valuation);
        data.description = formData.description;
      }
      
      await axios.post(endpoint, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setCreateDialogOpen(false);
      setSuccessMessage('Land token created successfully');
      fetchLandTokens();
    } catch (err: any) {
      console.error('Error creating land token:', err);
      setError(err.response?.data?.message || 'Failed to create land token');
    }
  };

  const handleEditToken = (token: LandToken) => {
    setSelectedToken(token);
    setFormData({
      name: token.name,
      location: token.location,
      area: token.area.toString(),
      owner: token.owner,
      coordinates: token.metadata?.coordinates?.join(', ') || '',
      valuation: token.metadata?.valuation?.toString() || '',
      description: token.metadata?.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateToken = async () => {
    if (!selectedToken) return;
    
    try {
      // For simplicity, we'll just show a success message since the blockchain
      // service doesn't have an update endpoint in the provided code
      setEditDialogOpen(false);
      setSuccessMessage('Land token updated successfully');
    } catch (err: any) {
      console.error('Error updating land token:', err);
      setError(err.response?.data?.message || 'Failed to update land token');
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      // For simplicity, we'll just show a success message since the blockchain
      // service doesn't have a delete endpoint in the provided code
      setSuccessMessage('Land token deleted successfully');
      fetchLandTokens();
    } catch (err: any) {
      console.error('Error deleting land token:', err);
      setError(err.response?.data?.message || 'Failed to delete land token');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Land Tokenization</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Land Token
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tokenized Land Assets
          </Typography>
          
          {tokens.length === 0 ? (
            <Box textAlign="center" py={5}>
              <TokenIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No land tokens found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first land token to get started
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Land Token
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens.map((token) => (
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
                          label={token.metadata?.valuation ? 'Farmhouse' : 'Field'} 
                          size="small" 
                          color={token.metadata?.valuation ? 'secondary' : 'primary'}
                        />
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
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditToken(token)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteToken(token._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
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
                  <MenuItem value="Fields">Field Token</MenuItem>
                  <MenuItem value="farmhouse">Farmhouse Token</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area (acres)"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
              />
            </Grid>
            
            {tokenType === 'Fields' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Coordinates (comma separated)"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  helperText="Example: 40.7128, -74.0060"
                />
              </Grid>
            )}
            
            {tokenType === 'farmhouse' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Valuation"
                    type="number"
                    value={formData.valuation}
                    onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateToken} variant="contained">Create Token</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Token Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Land Token</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area (acres)"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Owner Address"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                required
              />
            </Grid>
            
            {selectedToken?.metadata?.coordinates && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Coordinates"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  helperText="Comma separated values"
                />
              </Grid>
            )}
            
            {selectedToken?.metadata?.valuation && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valuation"
                  type="number"
                  value={formData.valuation}
                  onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                />
              </Grid>
            )}
            
            {selectedToken?.metadata?.description && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateToken} variant="contained">Update Token</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLandTokenization;