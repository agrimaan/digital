
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        The page you're looking for doesn't exist.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mt: 2 }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
