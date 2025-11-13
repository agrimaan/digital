// agrimaan/agrimaan/agrimaan-Agrimaan-f5978834f62c5f25b4c70b3c6945328822b00b84/agrimaan-app/frontend/src/pages/admin/AdminResources.tsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
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
  Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { Link as RouterLink } from 'react-router-dom';

interface Resource {
  _id: string;
  name: string;
  type: string;
  hourlyRate: number;
  location: string;
  owner: { name: string; email: string };
  createdAt: string;
}

const AdminResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formState, setFormState] = useState({ name: '', type: '', hourlyRate: 0, location: '' });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/resources`);
      setResources(res.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch resources');
      setLoading(false);
    }
  };

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setCurrentResource(resource);
      setFormState({
        name: resource.name,
        type: resource.type,
        hourlyRate: resource.hourlyRate,
        location: resource.location,
      });
    } else {
      setCurrentResource(null);
      setFormState({ name: '', type: '', hourlyRate: 0, location: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentResource(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSelectChange = (e: any) => {
    setFormState({ ...formState, type: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (currentResource) {
        await axios.put(`${API_BASE_URL}/api/resources/${currentResource._id}`, formState);
      } else {
        await axios.post(`${API_BASE_URL}/api/resources`, formState);
      }
      handleCloseDialog();
      fetchResources();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/resources/${id}`);
        fetchResources();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete resource');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <CircularProgress />
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
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Resources
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Resource
          </Button>
        </Grid>
      </Grid>
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Hourly Rate</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <TableRow key={resource._id}>
                    <TableCell>{resource.name}</TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>₹{resource.hourlyRate}</TableCell>
                    <TableCell>{resource.location}</TableCell>
                    <TableCell>{resource.owner.name}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(resource)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(resource._id)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No resources found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Resource Name"
            type="text"
            fullWidth
            value={formState.name}
            onChange={handleFormChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={formState.type}
              onChange={handleSelectChange}
              label="Type"
            >
              <MenuItem value="Machinery">Machinery</MenuItem>
              <MenuItem value="Equipment">Equipment</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="hourlyRate"
            label="Hourly Rate"
            type="number"
            fullWidth
            value={formState.hourlyRate}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            value={formState.location}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {currentResource ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminResources;