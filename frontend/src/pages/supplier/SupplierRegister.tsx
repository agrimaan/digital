import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const steps = ['Business Information', 'Contact Details', 'Legal Documents'];

const businessTypes = [
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'retailer', label: 'Retailer' }
];

const SupplierRegister: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: '',
    ownerName: '',
    
    // Contact Details
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    
    // Legal Documents
    gstNumber: '',
    panNumber: '',
    
    // Contact Person
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonPhone: '',
    contactPersonEmail: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        contactPerson: {
          name: formData.contactPersonName,
          designation: formData.contactPersonDesignation,
          phone: formData.contactPersonPhone,
          email: formData.contactPersonEmail
        }
      };

      const response = await axios.post(`${API_BASE_URL}/api/suppliers/register`, payload);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/supplier/Supplierlogin');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Business Type</InputLabel>
                <Select
                  name="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  label="Business Type"
                >
                  {businessTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Owner Name"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="street"
                value={formData.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="ZIP Code"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="GST Number"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="27AABCU9603R1ZM"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="AABCU9603R"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Person Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person Name"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Designation"
                name="contactPersonDesignation"
                value={formData.contactPersonDesignation}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contactPersonEmail"
                type="email"
                value={formData.contactPersonEmail}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BusinessIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Supplier Registration
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Registration successful! Your application is pending admin approval. Redirecting to login...
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Registration'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <RouterLink to="/suppliers/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
              Login here
            </RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SupplierRegister;