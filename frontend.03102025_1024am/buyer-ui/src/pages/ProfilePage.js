import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Paper, 
  Typography, 
  makeStyles, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  Divider 
} from '@mui/material';
import api from '../services/api';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  avatar: {
    width: theme.spacing(12),
    height: theme.spacing(12),
    marginBottom: theme.spacing(2),
  },
  form: {
    marginTop: theme.spacing(3),
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
}));

const ProfilePage = () => {
  const classes = useStyles();
  const { user } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });
    
    try {
      // Replace with actual API endpoint
      // await api.put('/users/profile', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        loading: false,
        success: true,
        error: null,
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
      });
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({
        loading: false,
        success: false,
        error: 'New passwords do not match',
      });
      return;
    }
    
    setStatus({ loading: true, success: false, error: null });
    
    try {
      // Replace with actual API endpoint
      // await api.put('/users/password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        loading: false,
        success: true,
        error: null,
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to update password',
      });
    }
  };
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        Profile
      </Typography>
      
      <Paper className={classes.paper}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} container direction="column" alignItems="center">
            <Avatar className={classes.avatar}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user?.role || 'User'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <form className={classes.form} onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Personal Information</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    variant="outlined"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    variant="outlined"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    variant="outlined"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    variant="outlined"
                    value={formData.address}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.submitButton}
                    disabled={status.loading}
                  >
                    {status.loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                  
                  {status.success && (
                    <Typography color="primary" style={{ marginTop: 8 }}>
                      Profile updated successfully!
                    </Typography>
                  )}
                  
                  {status.error && (
                    <Typography color="error" style={{ marginTop: 8 }}>
                      {status.error}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
            
            <Divider className={classes.divider} />
            
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Change Password</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.submitButton}
                    disabled={status.loading}
                  >
                    {status.loading ? 'Updating...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default ProfilePage;
