
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  CircularProgress, 
  Snackbar,
  Box,
  Alert
} from '@mui/material';
import { login } from '../store/actions/authActions';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(login(formData));
      navigate('/dashboard');
    } catch (err) {
      setSnackbarMessage(err.message || 'Login failed');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: 'BACKGROUND_GRADIENT'
    }}>
      <Container component="main" maxWidth="xs">
        <Paper sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }} elevation={6}>
          <img
            src="/logo192.png"
            alt="Logo"
            style={{ width: 80, height: 80, marginBottom: 16 }}
          />
          <Typography component="h1" variant="h4" gutterBottom>
            {t('ROLE_NAME.login.title')}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {t('ROLE_NAME.login.subtitle')}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{
            width: '100%',
            marginTop: 2
          }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('common.email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('common.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                margin: '24px 0 16px',
                padding: '12px',
                fontSize: '1.1rem'
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                t('ROLE_NAME.login.signIn')
              )}
            </Button>
            <Grid container>
              <Grid item xs>
                <Button color="primary" size="small">
                  {t('auth.forgotPassword')}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="error">
            {snackbarMessage || error || t('auth.loginError')}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default LoginPage;
