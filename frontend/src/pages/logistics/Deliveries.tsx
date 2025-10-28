
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { getDeliveries, deleteDelivery } from '../../features/logistics/logisticsSlice';

const Deliveries: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { deliveries, loading, error } = useSelector((state: any) => state.logistics);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    dispatch(getDeliveries());
  }, [dispatch]);
  
  const handleAddDelivery = () => {
    navigate('/logistics/deliveries/add');
  };
  
  const handleEditDelivery = (deliveryId: string) => {
    navigate(`/logistics/deliveries/edit/${deliveryId}`);
  };
  
  const handleDeleteClick = (deliveryId: string) => {
    setDeliveryToDelete(deliveryId);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (deliveryToDelete) {
      await dispatch(deleteDelivery(deliveryToDelete));
      setDeleteDialogOpen(false);
      setDeliveryToDelete(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeliveryToDelete(null);
  };
  
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const matchesSearch = 
      delivery.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? delivery.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Deliveries Management
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  variant="outlined"
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as string)}
                    label="Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="in-transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddDelivery}
              >
                Add Delivery
              </Button>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Farmer</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Pickup Location</TableCell>
                    <TableCell>Delivery Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Estimated Delivery</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDeliveries.map((delivery: any) => (
                    <TableRow key={delivery._id}>
                      <TableCell>{delivery.orderId}</TableCell>
                      <TableCell>{delivery.farmer?.name || 'Unknown'}</TableCell>
                      <TableCell>{delivery.buyer?.name || 'Unknown'}</TableCell>
                      <TableCell>{delivery.pickupAddress?.city || 'Unknown'}</TableCell>
                      <TableCell>{delivery.deliveryAddress?.city || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          label={delivery.status}
                          color={
                            delivery.status === 'delivered' ? 'success' :
                            delivery.status === 'in-transit' ? 'primary' :
                            delivery.status === 'pending' ? 'warning' :
                            delivery.status === 'assigned' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(delivery.estimatedDeliveryTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleEditDelivery(delivery._id)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteClick(delivery._id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this delivery?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deliveries;
