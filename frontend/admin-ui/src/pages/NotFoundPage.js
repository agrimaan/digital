import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { 
  Box,
  Container, 
  Typography, 
  Button, 
  Paper 
} from '@mui/material';
import { makeStyles } from '@mui/styles'; // For the legacy makeStyles hook

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(2),
    fontSize: '3rem',
  },
  subtitle: {
    marginBottom: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  button: {
    marginTop: theme.spacing(2),
  },
}));

const NotFoundPage = () => {
  const navigate = useNavigate()
  const classes = useStyles();
  
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
    <Typography variant="h3">404</Typography>
    <Typography variant="h6">Page not found</Typography>
    <Button variant="contained" onClick={() => navigate('/admin/users', { replace: true })}>
    Go to Users
    </Button>
    </Box>
  );
};

export default NotFoundPage;
