import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { register, loadUser } from '../../features/auth/authSlice';
import AddressAutocomplete from '../common/AddressAutocomplete';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 

const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '', 
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer'
  });
  
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '', 
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const { firstName, lastName, phoneNumber, address, email, password, confirmPassword, role } = formData;

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'farmer':
          navigate('/farmer');
          break;
        case 'buyer':
          navigate('/buyer');
          break;
        case 'business':
          navigate('/business');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'logistics':
          navigate('/logistics');
          break;
        case 'agronomist':
          navigate('/agronomist');
          break;
        case 'investor':
          navigate('/investor');
          break;
        case 'supplier':
          navigate('/supplier');
          break;
        default:
          navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhoneNumberChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value || ''
    }));
    if (formErrors.phoneNumber) {
      setFormErrors(prev => ({
        ...prev,
        phoneNumber: ''
      }));
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      role: event.target.value
    }));
    
    if (formErrors.role) {
      setFormErrors(prev => ({
        ...prev,
        role: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '', 
      email: '',
      password: '',
      confirmPassword: '',
      role: ''
    };
    
    let isValid = true;
    
    if (!firstName.trim()) {
      errors.firstName = 'First Name is required';
      isValid = false;
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last Name is required';
      isValid = false;
    }

    if (!phoneNumber) {
      errors.phoneNumber = 'Phone Number is required';
      isValid = false;
    } else if (phoneNumber.length < 8) { 
      errors.phoneNumber = 'Phone Number appears too short';
      isValid = false;
    }
    
    if (!address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }
    if (!email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    if (!role) {
      errors.role = 'Please select your role';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleAddressPicked = (fullAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      address: fullAddress, 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const registrationData = { ...formData };

    try 
    {
      await dispatch(register(registrationData) as any).unwrap();
      dispatch(loadUser() as any); 
      
      if(formData.role === 'supplier') {
        navigate('/supplier/register');
      }
      else
      {
        navigate('/login');
      } 
    }catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Sign Up
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={handleChange}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={handleChange}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
            />
            
            <FormControl
              fullWidth
              margin="normal"
              variant="outlined"
              error={!!formErrors.phoneNumber}
              focused={isPhoneFocused}
              sx={{
                mt: 2,
                mb: 1,
              }}
            >
              <InputLabel
                htmlFor="phone-input"
                shrink={!!phoneNumber || isPhoneFocused}
              >
                Phone Number *
              </InputLabel>

              <PhoneInput
                id="phone-input"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                defaultCountry="IN"
                international
                limitMaxLength
                className={`${formErrors.phoneNumber ? 'Mui-error' : ''}`}
                inputClassName="MuiOutlinedInput-input"
              />
              {formErrors.phoneNumber && (
                <FormHelperText>{formErrors.phoneNumber}</FormHelperText>
              )}
            </FormControl>

            <AddressAutocomplete
              value={address} 
              onPicked={handleAddressPicked}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />

            <FormControl fullWidth margin="normal" error={!!formErrors.role}>
              <InputLabel id="role-label">I am a</InputLabel>
              <Select
                labelId="role-label"
                value={role}
                label="I am a"
                onChange={handleRoleChange}
                required
              >
                <MenuItem value="farmer">Farmer</MenuItem>
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="logistics">Logistics Provider</MenuItem>
                  <MenuItem value="business">Business (Fertilizer/Equipment Supplier)</MenuItem>
                <MenuItem value="agronomist">Agronomist</MenuItem>
                <MenuItem value="investor">Investor</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                
              </Select>
              {formErrors.role && (
                <FormHelperText>{formErrors.role}</FormHelperText>
              )}
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            
            <Box textAlign="center">
              <Link to="/login">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;