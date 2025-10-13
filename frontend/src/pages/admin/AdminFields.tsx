
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
  Terrain as TerrainIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Straighten as StraightenIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Define types
interface Fields {
  _id: string;
  name: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  size: {
    value: number;
    unit: string;
  };
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  soilType: string;
  crops: Array<{
    _id: string;
    name: string;
    status: string;
  }>;
  sensors: number;
  createdAt: string;
}

const AdminFields: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [fields, setFields] = useState<Fields[]>([]);
  const [filteredFields, setFilteredFields] = useState<Fields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterSoilType, setFilterSoilType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  // Owners and soil types lists for filters
  const [owners, setOwners] = useState<Array<{id: string, name: string}>>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);

  useEffect(() => {
    // Real API implementation
    const fetchFields = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/fields`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const fieldsData = response.data.data || response.data || [];
        setFields(fieldsData);
        setFilteredFields(fieldsData);
        
        // Extract unique owners for filter
        const uniqueOwners = Array.from(new Set(fieldsData.map((field: any) => field.owner?._id)))
          .filter((ownerId): ownerId is string => typeof ownerId === 'string' && ownerId !== '')
          .map((ownerId: string) => {
            const owner = fieldsData.find((field: any) => field.owner?._id === ownerId)?.owner;
            return {
              id: ownerId,
              name: owner?.name || 'Unknown'
            };
          });
        setOwners(uniqueOwners);
        
        // Extract unique soil types for filter
        const uniqueSoilTypes = Array.from(new Set(fieldsData.map((field: any) => field.soilType)))
          .filter((soilType): soilType is string => typeof soilType === 'string' && soilType !== '');
        setSoilTypes(uniqueSoilTypes);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching fields:', err);
        setError(err.message || 'Failed to load fields');
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...fields];
    
    // Apply search term
    if (searchTerm) {
      result = result.filter(
        field => 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply owner filter
    if (filterOwner !== 'all') {
      result = result.filter(field => field.owner._id === filterOwner);
    }
    
    // Apply soil type filter
    if (filterSoilType !== 'all') {
      result = result.filter(field => field.soilType === filterSoilType);
    }
    
    setFilteredFields(result);
  }, [searchTerm, filterOwner, filterSoilType, fields]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle delete field
  const handleDeleteField = (fieldId: string) => {
    setFieldToDelete(fieldId);
    setDeleteDialogOpen(true);
  };

  // Confirm delete field
  const confirmDeleteField = async () => {
    if (fieldToDelete) {
      try {
        // Real API call to delete field
        await axios.delete(`${API_BASE_URL}/api/fields/${fieldToDelete}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Update local state after successful deletion
        setFields(prevFields => prevFields.filter(field => field._id !== fieldToDelete));
        setFilteredFields(prevFields => prevFields.filter(field => field._id !== fieldToDelete));
      } catch (err: any) {
        console.error('Error deleting field:', err);
        setError(err.response?.data?.message || 'Failed to delete field');
      }
    }
    setDeleteDialogOpen(false);
    setFieldToDelete(null);
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
            Field Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/fields/create"
          >
            Add New Field
          </Button>
        </Box>

        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search fields..."
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
            <InputLabel>Owner</InputLabel>
            <Select
              value={filterOwner}
              label="Owner"
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <MenuItem value="all">All Owners</MenuItem>
              {owners.map((owner) => (
                <MenuItem key={owner.id} value={owner.id}>
                  {owner.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Soil Type</InputLabel>
            <Select
              value={filterSoilType}
              label="Soil Type"
              onChange={(e) => setFilterSoilType(e.target.value)}
            >
              <MenuItem value="all">All Soil Types</MenuItem>
              {soilTypes.map((soilType) => (
                <MenuItem key={soilType} value={soilType}>
                  {soilType}
                </MenuItem>
              ))}
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
          Showing {filteredFields.length} of {fields.length} fields
        </Typography>

        {/* Fields Table */}
        {viewMode === 'table' && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Soil Type</TableCell>
                  <TableCell>Crops</TableCell>
                  <TableCell>Sensors</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFields.map((field) => (
                  <TableRow key={field._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TerrainIcon color="primary" />
                        <Typography variant="subtitle2">{field.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{field.location.address}</TableCell>
                    <TableCell>{field.owner.name}</TableCell>
                    <TableCell>{field.size.value} {field.size.unit}</TableCell>
                    <TableCell>{field.soilType}</TableCell>
                    <TableCell>{field.crops.length}</TableCell>
                    <TableCell>{field.sensors}</TableCell>
                    <TableCell>{formatDate(field.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          component={RouterLink}
                          to={`/admin/fields/${field._id}`}
                          size="small"
                        >
                          <TerrainIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          component={RouterLink}
                          to={`/admin/fields/${field._id}/edit`}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteField(field._id)}
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
            {filteredFields.map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field._id}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <TerrainIcon />
                      </Avatar>
                    }
                    title={field.name}
                    subheader={field.location.address}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Owner: {field.owner.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Size: {field.size.value} {field.size.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Soil: {field.soilType}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`${field.crops.length} crops`} 
                        size="small"
                      />
                      <Chip 
                        label={`${field.sensors} sensors`} 
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      component={RouterLink}
                      to={`/admin/fields/${field._id}`}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      component={RouterLink}
                      to={`/admin/fields/${field._id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteField(field._id)}
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
        {filteredFields.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TerrainIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No fields found
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
            Are you sure you want to delete this field? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteField} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminFields;
