import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  makeStyles, 
  CircularProgress, 
  Snackbar 
} from '@mui/material';
import { Alert } from '@mui/lab';
import { login } from '../store/actions/authActions';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 400,
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  logo: {
    marginBottom: theme.spacing(3),
  },
}));

const LoginPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const { email, password } = formData;
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(email, password));
      navigate('/');
    } catch (err) {
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <div className={classes.root}>
      <Container component="main" maxWidth="xs">
        <Paper className={classes.paper} elevation={3}>
          <Typography variant="h4" className={classes.logo}>
            Agrimaan Buyer Service
          </Typography>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Grid container>
              <Grid item xs>
                <Button color="primary" size="small">
                  Forgot password?
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error || 'Login failed. Please check your credentials.'}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default LoginPage;
