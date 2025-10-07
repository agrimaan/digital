import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          You do not have permission to view this page.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default Unauthorized;