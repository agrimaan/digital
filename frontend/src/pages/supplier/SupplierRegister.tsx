import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { setAlert } from '../../features/alert/alertSlice';
import { register } from '../../features/auth/authSlice';
import axios from 'axios';

import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormHelperText
} from '@mui/material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface BusinessInfo {
  businessName: string;
  businessType: string;
  gstNumber: string;
  panNumber: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface DocumentInfo {
  gstCertificate: string;
  panCard: string;
  businessLicense: string;
}

const SupplierRegister: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [activeStep, setActiveStep] = useState(0);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: ''
  });
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    gstCertificate: '',
    panCard: '',
    businessLicense: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const steps = ['Business Info', 'Contact Details', 'Legal Documents'];
  
  const handleBusinessInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessInfo({
      ...businessInfo,
      [e.target.name]: e.target.value
    });
  };
  
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo({
      ...contactInfo,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDocumentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentInfo({
      ...documentInfo,
      [e.target.name]: e.target.value
    });
  };
  
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate business info
      if (!businessInfo.businessName || !businessInfo.businessType || 
          !businessInfo.gstNumber || !businessInfo.panNumber) {
        setError('Please fill in all required business information');
        return;
      }
      // Validate GST number format
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(businessInfo.gstNumber)) {
        setError('Please enter a valid GST number');
        return;
      }
      // Validate PAN number format
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(businessInfo.panNumber)) {
        setError('Please enter a valid PAN number');
        return;
      }
    } else if (activeStep === 1) {
      // Validate contact info
      if (!contactInfo.firstName || !contactInfo.lastName || 
          !contactInfo.email || !contactInfo.phone ||
          !contactInfo.street || !contactInfo.city ||
          !contactInfo.state || !contactInfo.zipCode) {
        setError('Please fill in all required contact information');
        return;
      }
      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(contactInfo.email)) {
        setError('Please enter a valid email address');
        return;
      }
      // Validate phone number format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(contactInfo.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      // Validate ZIP code format
      const zipRegex = /^[0-9]{6}$/;
      if (!zipRegex.test(contactInfo.zipCode)) {
        setError('Please enter a valid 6-digit ZIP code');
        return;
      }
    } else if (activeStep === 2) {
      // Validate document info
      if (!documentInfo.gstCertificate || !documentInfo.panCard) {
        setError('Please provide links to required documents');
        return;
      }
      if (!termsAccepted) {
        setError('Please accept the terms and conditions');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare registration data
      const registrationData = {
        businessName: businessInfo.businessName,
        businessType: businessInfo.businessType,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: {
          street: contactInfo.street,
          city: contactInfo.city,
          state: contactInfo.state,
          zipCode: contactInfo.zipCode,
          country: contactInfo.country
        },
        gstNumber: businessInfo.gstNumber,
        panNumber: businessInfo.panNumber,
        documents: {
          gstCertificate: documentInfo.gstCertificate,
          panCard: documentInfo.panCard,
          businessLicense: documentInfo.businessLicense || ''
        },
        role: 'supplier'
      };
      console.log("registrationData witin handleSubmit: ", registrationData);
      
      // Register supplier
      await axios.post(`${API_BASE_URL}/api/suppliers/register`, registrationData);
      
      dispatch(setAlert({ 
        message: 'Supplier Registration successful! Please wait for verification. Meanwhile lets register you for portal access', 
        type: 'success' 
      }) as any);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      dispatch(setAlert({ message: errorMessage, type: 'error' }) as any);
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
                id="businessName"
                name="businessName"
                label="Business Name"
                fullWidth
                value={businessInfo.businessName}
                onChange={handleBusinessInfoChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="businessType-label">Business Type</InputLabel>
                <Select
                  labelId="businessType-label"
                  id="businessType"
                  name="businessType"
                  value={businessInfo.businessType}
                  label="Business Type"
                  onChange={(e) => setBusinessInfo({
                    ...businessInfo,
                    businessType: e.target.value as string
                  })}
                >
                  <MenuItem value="wholesaler">wholesaler</MenuItem>
                  <MenuItem value="manufacturer">Manufacturer</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                  <MenuItem value="retailer">retailer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="gstNumber"
                name="gstNumber"
                label="GST Number"
                fullWidth
                value={businessInfo.gstNumber}
                onChange={handleBusinessInfoChange}
                helperText="Format: 11AAAAA1111A1A1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="panNumber"
                name="panNumber"
                label="PAN Number"
                fullWidth
                value={businessInfo.panNumber}
                onChange={handleBusinessInfoChange}
                helperText="Format: AAAAA1111A"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="firstName"
                name="firstName"
                label="First Name"
                fullWidth
                value={contactInfo.firstName}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="lastName"
                name="lastName"
                label="Last Name"
                fullWidth
                value={contactInfo.lastName}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="email"
                name="email"
                label="Email Address"
                fullWidth
                value={contactInfo.email}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="phone"
                name="phone"
                label="Phone Number"
                fullWidth
                value={contactInfo.phone}
                onChange={handleContactInfoChange}
                helperText="10-digit phone number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="street"
                name="street"
                label="Street Address"
                fullWidth
                value={contactInfo.street}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="city"
                name="city"
                label="City"
                fullWidth
                value={contactInfo.city}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="state"
                name="state"
                label="State"
                fullWidth
                value={contactInfo.state}
                onChange={handleContactInfoChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="zipCode"
                name="zipCode"
                label="ZIP Code"
                fullWidth
                value={contactInfo.zipCode}
                onChange={handleContactInfoChange}
                helperText="6-digit ZIP code"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="country"
                name="country"
                label="Country"
                fullWidth
                value={contactInfo.country}
                onChange={handleContactInfoChange}
                disabled
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                id="gstCertificate"
                name="gstCertificate"
                label="GST Certificate URL"
                fullWidth
                value={documentInfo.gstCertificate}
                onChange={handleDocumentInfoChange}
                helperText="Link to uploaded GST certificate"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="panCard"
                name="panCard"
                label="PAN Card URL"
                fullWidth
                value={documentInfo.panCard}
                onChange={handleDocumentInfoChange}
                helperText="Link to uploaded PAN card"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="businessLicense"
                name="businessLicense"
                label="Business License URL"
                fullWidth
                value={documentInfo.businessLicense}
                onChange={handleDocumentInfoChange}
                helperText="Link to uploaded business license (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label="I accept the terms and conditions"
              />
              {!termsAccepted && (
                <FormHelperText error>Please accept the terms and conditions</FormHelperText>
              )}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };
  
  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Supplier Registration
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography variant="h5" gutterBottom>
              Thank you for registering.
            </Typography>
            <Typography variant="subtitle1">
              Your supplier registration has been submitted successfully. 
              You will receive an email confirmation once your account is verified.
            </Typography>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {renderStepContent(activeStep)}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                  Back
                </Button>
              )}
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{ mt: 3, ml: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 3, ml: 1 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </React.Fragment>
        )}
      </Paper>
    </Container>
  );
};

export default SupplierRegister;