
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'farmer' | 'buyer' | 'seller';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  profileImage?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const AdminUserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'farmer' as 'admin' | 'farmer' | 'buyer' | 'seller',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const userData = response.data.data || response.data;
        setCurrentUser(userData);
        
        // Initialize form with user data
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'farmer',
          phone: userData.phone || '',
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          country: userData.address?.country || '',
          zipCode: userData.address?.zipCode || ''
        });
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare user data for API
      const updatedUserData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode
        }
      };

      // Make API call to update user
      await axios.put(`${API_BASE_URL}/api/users/${id}`, updatedUserData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('User updated successfully');
      setSaving(false);
      
      // Navigate back to user detail after a short delay
      setTimeout(() => {
        navigate(`/admin/users/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/users/${id}`);
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

  if (error && !currentUser) {
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
            Edit User
          </Typography>
          <Button
            onClick={handleCancel}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Basic Information"
                  avatar={<PersonIcon />}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                          name="role"
                          value={formData.role}
                          label="Role"
                          onChange={handleRoleChange}
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="farmer">Farmer</MenuItem>
                          <MenuItem value="buyer">Buyer</MenuItem>
                          <MenuItem value="seller">Seller</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Address Information"
                  avatar={<PersonIcon />}
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ZIP Code"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AdminUserEdit;
