import React from 'react';
import { Link } from 'react-router-dom';
import { 
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
  const classes = useStyles();
  
  return (
    <Container maxWidth="md">
      <Paper className={classes.root}>
        <Typography variant="h1" className={classes.title}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" className={classes.subtitle}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          className={classes.button}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
