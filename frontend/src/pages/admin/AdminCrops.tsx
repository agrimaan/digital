import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Badge,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Grass as GrassIcon,
  LocalOffer as LocalOfferIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Define types
interface Crop {
  _id: string;
  name: string;
  variety: string;
  Fields: {
    _id: string;
    name: string;
    owner: {
      _id: string;
      name: string;
    }
  };
  plantingDate: string;
  harvestDate: string | null;
  status: 'growing' | 'harvested' | 'sold' | 'failed';
  quantity: {
    expected: number;
    actual: number | null;
    unit: string;
  };
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
  createdAt: string;
}

const AdminCrops: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHealth, setFilterHealth] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<string | null>(null);

  // Fields owners list for filter
  const [FieldsOwners, setFieldsOwners] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Real API implementation
    const fetchCrops = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/crops`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const cropsData = response.data.data || response.data || [];
        setCrops(cropsData);
        setFilteredCrops(cropsData);
        
        // Extract unique field owners for filter
        const uniqueOwners = Array.from(new Set(cropsData.map((crop: any) => crop.farmId?.owner?._id || crop.farmerId)))
          .filter((ownerId): ownerId is string => typeof ownerId === 'string' && ownerId !== '')
          .map((ownerId: string) => {
            const owner = cropsData.find((crop: any) => (crop.farmId?.owner?._id || crop.farmerId) === ownerId)?.farmId?.owner;
            return {
              id: ownerId,
              name: owner?.name || 'Unknown'
            };
          });
        setFieldsOwners(uniqueOwners);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching crops:', err);
        setError(err.message || 'Failed to load crops');
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...crops];
    
    // Apply search term
    if (searchTerm) {
      result = result.filter(
        crop => 
          crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crop.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crop.Fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crop.Fields.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(crop => crop.status === filterStatus);
    }
    
    // Apply health filter
    if (filterHealth !== 'all') {
      result = result.filter(crop => crop.healthStatus === filterHealth);
    }
    
    setFilteredCrops(result);
  }, [searchTerm, filterStatus, filterHealth, crops]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growing': return 'success';
      case 'harvested': return 'info';
      case 'sold': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Get health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  // Handle delete crop
  const handleDeleteCrop = (cropId: string) => {
    setCropToDelete(cropId);
    setDeleteDialogOpen(true);
  };

  // Confirm delete crop
  const confirmDeleteCrop = () => {
    if (cropToDelete) {
      // In a real implementation, this would be an API call
      setCrops(prevCrops => prevCrops.filter(crop => crop._id !== cropToDelete));
      setFilteredCrops(prevCrops => prevCrops.filter(crop => crop._id !== cropToDelete));
    }
    setDeleteDialogOpen(false);
    setCropToDelete(null);
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Crop Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/crops/create"
          >
            Add New Crop
          </Button>
        </Box>

        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="growing">Growing</MenuItem>
              <MenuItem value="harvested">Harvested</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Health</InputLabel>
            <Select
              value={filterHealth}
              label="Health"
              onChange={(e) => setFilterHealth(e.target.value)}
            >
              <MenuItem value="all">All Health</MenuItem>
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Results count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredCrops.length} of {crops.length} crops
        </Typography>

        {/* Crops Table */}
        {viewMode === 'table' && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Crop Name</TableCell>
                  <TableCell>Variety</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Planting Date</TableCell>
                  <TableCell>Expected Yield</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCrops.map((crop) => (
                  <TableRow key={crop._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GrassIcon color="primary" />
                        <Typography variant="subtitle2">{crop.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{crop.variety}</TableCell>
                    <TableCell>{crop.Fields.name}</TableCell>
                    <TableCell>{crop.Fields.owner.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={crop.status} 
                        color={getStatusColor(crop.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={crop.healthStatus} 
                        color={getHealthColor(crop.healthStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(crop.plantingDate)}</TableCell>
                    <TableCell>
                      {crop.quantity.expected} {crop.quantity.unit}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton 
                          component={RouterLink}
                          to={`/admin/crops/${crop._id}/edit`}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteCrop(crop._id)}
                          size="small"
                          color="error"
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

        {/* Grid View */}
        {viewMode === 'grid' && (
          <Grid container spacing={3}>
            {filteredCrops.map((crop) => (
              <Grid item xs={12} sm={6} md={4} key={crop._id}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <GrassIcon />
                      </Avatar>
                    }
                    title={crop.name}
                    subheader={crop.variety}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Field: {crop.Fields.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Owner: {crop.Fields.owner.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        label={crop.status} 
                        color={getStatusColor(crop.status) as any}
                        size="small"
                      />
                      <Chip 
                        label={crop.healthStatus} 
                        color={getHealthColor(crop.healthStatus) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2">
                      Planting: {formatDate(crop.plantingDate)}
                    </Typography>
                    <Typography variant="body2">
                      Expected: {crop.quantity.expected} {crop.quantity.unit}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={RouterLink}
                      to={`/admin/crops/${crop._id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCrop(crop._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {filteredCrops.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <GrassIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No crops found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filter criteria
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this crop? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteCrop} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCrops;