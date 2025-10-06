import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    const userRole = localStorage.getItem('userRole');
    switch (userRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'farmer':
        navigate('/farmer/dashboard');
        break;
      case 'investor':
        navigate('/investor/dashboard');
        break;
      case 'buyer':
        navigate('/buyer/dashboard');
        break;
      case 'logistics':
        navigate('/logistics/dashboard');
        break;
      case 'agronomist':
        navigate('/agronomist/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 400,
          backgroundColor: 'white',
          borderRadius: 2,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom color="error">
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBackToDashboard}
            startIcon={<HomeIcon />}
            size="large"
            fullWidth
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound;