import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import { profileService, UserProfile, UpdateProfileData, ChangePasswordData } from '../../services/profileService';
import AddressAutocomplete from '../common/AddressAutocomplete';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import { parsePhoneNumberFromString } from 'libphonenumber-js'; 

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<UpdateProfileData>({});

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const parsedCountryCode = useMemo(() => {
    if (formData.phoneNumber) {
      const phoneNumber = parsePhoneNumberFromString(formData.phoneNumber);
      return phoneNumber?.country
    }
    return undefined;
  }, [formData.phoneNumber]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        profileService.getProfile(),
        profileService.getProfileStats(),
      ]);

      if (profileResponse.success) {
        setProfile(profileResponse.user);
        setOriginalProfile(profileResponse.user);
        setFormData({
          firstName: profileResponse.user.firstName,
          lastName: profileResponse.user.lastName,
          phoneNumber: profileResponse.user.phoneNumber, 
          address: profileResponse.user.address,
          preferences: profileResponse.user.preferences,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      handleSaveProfile();
    } else {
      setEditMode(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    try {
      const dataToSend: UpdateProfileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        preferences: formData.preferences,
      };

      const response = await profileService.updateProfile(profile._id, dataToSend);
      if (response.success) {
        setProfile(response.data);
        setOriginalProfile(response.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setFormData({
        firstName: originalProfile.firstName,
        lastName: originalProfile.lastName,
        phoneNumber: originalProfile.phoneNumber,
        address: originalProfile.address,
        preferences: originalProfile.preferences,
      });
    }
    setEditMode(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneNumberChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value || '' 
    }));
  };
  
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await profileService.changePassword(passwordData);
      if (response.success) {
        setSuccess('Password changed successfully!');
        setPasswordDialogOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
        setConfirmPassword('');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddressPicked = (fullAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      address: fullAddress, 
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

      // Convert to Base64
    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

    const base64 = await toBase64(file);

    setSaving(true);
    setError(null);
    try {
      const response = await profileService.uploadProfileImage(base64);
      if (response.success) {
        setSuccess('Profile image updated successfully!');
        loadProfileData(); // Reload profile to get new image URL
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Box>
    );
  }

  const getFullName = () => `${profile.firstName} ${profile.lastName}`;
  const getInitials = () => `${profile.firstName[0]}${profile.lastName[0]}`;
  
  const getLocation = () => {
    if (profile.address) {
      return profile.address;
    }
    return 'Location not set';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton 
                    component="label"
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      width: 32,
                      height: 32
                    }}
                    size="small"
                    disabled={saving}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </IconButton>
                }
              >
                <Avatar 
                  src={profile.profileImage}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {getInitials()}
                </Avatar>
              </Badge>
            </Box>

            {editMode ? (
              <Box sx={{ mb: 2 }}>
                <TextField 
                  value={formData.firstName || ''} 
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  variant="outlined" 
                  label="First Name"
                  fullWidth
                  sx={{ mb: 1 }}
                />
                <TextField 
                  value={formData.lastName || ''} 
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  variant="outlined" 
                  label="Last Name"
                  fullWidth
                />
              </Box>
            ) : (
              <Typography variant="h5" gutterBottom>
                {getFullName()}
              </Typography>
            )}

            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant={editMode ? "contained" : "outlined"}
                color={editMode ? "success" : "primary"}
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                onClick={handleEditToggle}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                {saving ? <CircularProgress size={24} /> : editMode ? "Save Profile" : "Edit Profile"}
              </Button>
              {editMode && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary={profile.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone" 
                  secondary={
                    editMode ? (
                      <Box 
                          className="phone-input-mui-wrapper" 
                          sx={{ mt: 1, mb: 1, width: '100%' }}
                      >
                        <PhoneInput 
                          placeholder="Enter phone number"
                          value={formData.phoneNumber || ''} 
                          onChange={handlePhoneNumberChange}
                          country={parsedCountryCode}
                          defaultCountry="IN"
                          international
                          limitMaxLength
                          className="PhoneInput" 
                          inputClassName="PhoneInputInput"
                        />
                      </Box>
                    ) : (profile.phoneNumber || 'Not set')
                  } 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationOnIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Address"
                  secondary={
                    editMode ? (
                      <Box sx={{ mt: 1 }}>
                        <AddressAutocomplete
                          value={formData.address || ''} 
                          onPicked={handleAddressPicked}
                          label=''
                        />
                      </Box>
                    ) : (
                      getLocation()
                    )
                  }
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom align="left">
              Account Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Member Since" 
                  secondary={new Date(profile.createdAt).toLocaleDateString('en-GB')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Last Login" 
                  secondary={profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('en-GB') : 'N/A'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                <Tab label="Activity" icon={<HistoryIcon />} iconPosition="start" />
                <Tab 
                  label="Notifications" 
                  icon={
                    <Badge badgeContent={0} color="error">
                      <NotificationsIcon />
                    </Badge>
                  } 
                  iconPosition="start" 
                />
                <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Activity tracking coming soon
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No new notifications
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Change Password" 
                    secondary="Update your account password" 
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Change
                  </Button>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive updates and alerts via email" 
                  />
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Privacy Settings" 
                    secondary="Manage your data and privacy preferences" 
                  />
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </ListItem>
              </List>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              variant="outlined"
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              helperText="Password must be at least 6 characters"
              variant="outlined"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !confirmPassword}
          >
            {saving ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;