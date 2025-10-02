#!/bin/bash

# Script to generate all frontend microservices for the Agrimaan platform
# This script creates a complete structure for all 6 frontend microservices

# Set the base directory for frontend microservices
BASE_DIR="./microservices/frontend"
mkdir -p $BASE_DIR

# Array of frontend services with their ports
declare -A SERVICES=(
  ["farmer-service"]=5001
  ["buyer-service"]=5002
  ["logistics-service"]=5003
  ["investor-service"]=5004
  ["agronomist-service"]=5005
  ["admin-service"]=5006
)

# Function to create the basic structure for a frontend service
create_service_structure() {
  local service_name=$1
  local port=$2
  local service_dir="$BASE_DIR/$service_name"
  
  echo "Creating structure for $service_name on port $port..."
  
  # Create the directory structure
  mkdir -p $service_dir/src/components/common
  mkdir -p $service_dir/src/components/layout
  mkdir -p $service_dir/src/pages
  mkdir -p $service_dir/src/services
  mkdir -p $service_dir/src/store/actions
  mkdir -p $service_dir/src/store/reducers
  mkdir -p $service_dir/src/utils
  mkdir -p $service_dir/src/assets/images
  mkdir -p $service_dir/src/assets/styles
  mkdir -p $service_dir/public
  
  # Create package.json
  cat > $service_dir/package.json << EOL
{
  "name": "agrimaan-$service_name",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@mui/material": "^4.12.4",
    "@mui/icons-material": "^4.11.3",
    ": @mui/lab": "^4.0.0-alpha.61",
    "@reduxjs/toolkit": "^1.9.5",
    "axios": "^1.4.0",
    "chart.js": "^4.3.0",
    "formik": "^2.4.2",
    "jwt-decode": "^3.1.2",
    "moment": "^2.29.4",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.1",
    "react-router-dom": "^6.14.1",
    "react-scripts": "5.0.1",
    "redux": "^4.2.1",
    "redux-thunk": "^2.4.2",
    "yup": "^1.2.0"
  },
  "scripts": {
    "start": "PORT=$port react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOL

  # Create Dockerfile
  cat > $service_dir/Dockerfile << EOL
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE $port
CMD ["nginx", "-g", "daemon off;"]
EOL

  # Create nginx.conf
  cat > $service_dir/nginx.conf << EOL
server {
    listen $port;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://api-gateway:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

  # Create .env file
  cat > $service_dir/.env << EOL
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SERVICE_NAME=$service_name
PORT=$port
EOL

  # Create public/index.html
  cat > $service_dir/public/index.html << EOL
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <title>Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOL

  # Create public/manifest.json
  cat > $service_dir/public/manifest.json << EOL
{
  "short_name": "Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')",
  "name": "Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOL

  # Create src/index.js
  cat > $service_dir/src/index.js << EOL
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import store from './store';
import './assets/styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
EOL

  # Create src/App.js
  cat > $service_dir/src/App.js << EOL
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout components
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Auth actions
import { checkAuth } from './store/actions/authActions';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // Green - representing agriculture
    },
    secondary: {
      main: '#ff9800', // Orange
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Private route component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
EOL

  # Create store/index.js
  cat > $service_dir/src/store/index.js << EOL
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
EOL

  # Create store/reducers/index.js
  cat > $service_dir/src/store/reducers/index.js << EOL
import { combineReducers } from 'redux';
import authReducer from './authReducer';
import uiReducer from './uiReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  // Add more reducers here
});

export default rootReducer;
EOL

  # Create store/reducers/authReducer.js
  cat > $service_dir/src/store/reducers/authReducer.js << EOL
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      localStorage.setItem('token', action.payload.token);
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload.user;
    },
    loginFailure: (state, action) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    },
    authLoaded: (state, action) => {
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload;
    },
    authError: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
    }
  }
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  authLoaded, 
  authError 
} = authSlice.actions;

export default authSlice.reducer;
EOL

  # Create store/reducers/uiReducer.js
  cat > $service_dir/src/store/reducers/uiReducer.js << EOL
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  notifications: [],
  theme: 'light'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    }
  }
});

export const { 
  toggleSidebar, 
  addNotification, 
  removeNotification, 
  toggleTheme 
} = uiSlice.actions;

export default uiSlice.reducer;
EOL

  # Create store/actions/authActions.js
  cat > $service_dir/src/store/actions/authActions.js << EOL
import axios from 'axios';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  authLoaded, 
  authError 
} from '../reducers/authReducer';
import { setAuthToken } from '../../utils/setAuthToken';

// Login user
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginStart());

    const res = await axios.post(\`\${process.env.REACT_APP_API_URL}/auth/login\`, { 
      email, 
      password 
    });

    dispatch(loginSuccess(res.data));
    
    // Set token in axios headers
    setAuthToken(res.data.token);
    
    return res.data;
  } catch (err) {
    dispatch(loginFailure(err.response?.data?.message || 'Login failed'));
    throw err;
  }
};

// Check if user is authenticated
export const checkAuth = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    dispatch(authError());
    return;
  }
  
  setAuthToken(token);
  
  try {
    const res = await axios.get(\`\${process.env.REACT_APP_API_URL}/auth/me\`);
    dispatch(authLoaded(res.data));
  } catch (err) {
    dispatch(authError());
  }
};

// Logout user
export const logoutUser = () => (dispatch) => {
  dispatch(logout());
};
EOL

  # Create utils/setAuthToken.js
  cat > $service_dir/src/utils/setAuthToken.js << EOL
import axios from 'axios';

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
EOL

  # Create services/api.js
  cat > $service_dir/src/services/api.js << EOL
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
    withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
EOL

  # Create components/layout/MainLayout.js
  cat > $service_dir/src/components/layout/MainLayout.js << EOL
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
mport { makeStyles } from '@mui/styles';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Container, 
  Divider, 
  Avatar, 
  Menu, 
  MenuItem 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Person as PersonIcon, 
  ExitToApp as LogoutIcon 
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/reducers/uiReducer';
import { logoutUser } from '../../store/actions/authActions';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
  avatar: {
    cursor: 'pointer',
  },
}));

const MainLayout = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logoutUser());
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')
          </Typography>
          <Avatar 
            className={classes.avatar}
            onClick={handleMenuOpen}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        open={sidebarOpen}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.toolbar} />
        <div className={classes.drawerContainer}>
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <Divider />
            {/* Add more menu items here specific to the service */}
          </List>
        </div>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default MainLayout;
EOL

  # Create pages/LoginPage.js
  cat > $service_dir/src/pages/LoginPage.js << EOL
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
import { Alert } from ': @mui/lab';
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
            Agrimaan $(echo $service_name | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')
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
EOL

  # Create pages/DashboardPage.js
  cat > $service_dir/src/pages/DashboardPage.js << EOL
import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  makeStyles, 
  Card, 
  CardContent, 
  CardHeader 
} from '@mui/material';
import api from '../services/api';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  card: {
    height: '100%',
  },
  cardHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const DashboardPage = () => {
  const classes = useStyles();
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    data: null,
    error: null,
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Replace with actual API endpoint
        const response = await api.get('/dashboard');
        setDashboardData({
          loading: false,
          data: response.data,
          error: null,
        });
      } catch (error) {
        setDashboardData({
          loading: false,
          data: null,
          error: 'Failed to load dashboard data',
        });
        console.error('Dashboard data fetch error:', error);
      }
    };
    
    // Simulate API call for now
    setTimeout(() => {
      setDashboardData({
        loading: false,
        data: {
          // Sample data - replace with actual data structure
          stats: {
            totalUsers: 1250,
            activeUsers: 876,
            totalTransactions: 5432,
            revenue: 123456,
          },
          recentActivity: [
            { id: 1, type: 'login', user: 'John Doe', timestamp: '2023-06-15T10:30:00Z' },
            { id: 2, type: 'transaction', user: 'Jane Smith', timestamp: '2023-06-15T09:45:00Z' },
            { id: 3, type: 'signup', user: 'New User', timestamp: '2023-06-15T08:20:00Z' },
          ],
        },
        error: null,
      });
    }, 1000);
    
    // Uncomment to use real API
    // fetchDashboardData();
  }, []);
  
  if (dashboardData.loading) {
    return <Typography>Loading dashboard data...</Typography>;
  }
  
  if (dashboardData.error) {
    return <Typography color="error">{dashboardData.error}</Typography>;
  }
  
  const { stats, recentActivity } = dashboardData.data;
  
  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardHeader title="Total Users" className={classes.cardHeader} />
            <CardContent>
              <Typography variant="h3">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardHeader title="Active Users" className={classes.cardHeader} />
            <CardContent>
              <Typography variant="h3">{stats.activeUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardHeader title="Transactions" className={classes.cardHeader} />
            <CardContent>
              <Typography variant="h3">{stats.totalTransactions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <CardHeader title="Revenue" className={classes.cardHeader} />
            <CardContent>
              <Typography variant="h3">\${stats.revenue.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.map((activity) => (
              <div key={activity.id}>
                <Typography>
                  {activity.user} - {activity.type} - {new Date(activity.timestamp).toLocaleString()}
                </Typography>
              </div>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;
EOL

  # Create pages/ProfilePage.js
  cat > $service_dir/src/pages/ProfilePage.js << EOL
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Paper, 
  Typography, 
  makeStyles, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  Divider 
} from '@mui/material';
import api from '../services/api';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  avatar: {
    width: theme.spacing(12),
    height: theme.spacing(12),
    marginBottom: theme.spacing(2),
  },
  form: {
    marginTop: theme.spacing(3),
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
}));

const ProfilePage = () => {
  const classes = useStyles();
  const { user } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });
    
    try {
      // Replace with actual API endpoint
      // await api.put('/users/profile', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        loading: false,
        success: true,
        error: null,
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
      });
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({
        loading: false,
        success: false,
        error: 'New passwords do not match',
      });
      return;
    }
    
    setStatus({ loading: true, success: false, error: null });
    
    try {
      // Replace with actual API endpoint
      // await api.put('/users/password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        loading: false,
        success: true,
        error: null,
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.response?.data?.message || 'Failed to update password',
      });
    }
  };
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        Profile
      </Typography>
      
      <Paper className={classes.paper}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} container direction="column" alignItems="center">
            <Avatar className={classes.avatar}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user?.role || 'User'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <form className={classes.form} onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Personal Information</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    variant="outlined"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    variant="outlined"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    variant="outlined"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    variant="outlined"
                    value={formData.address}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.submitButton}
                    disabled={status.loading}
                  >
                    {status.loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                  
                  {status.success && (
                    <Typography color="primary" style={{ marginTop: 8 }}>
                      Profile updated successfully!
                    </Typography>
                  )}
                  
                  {status.error && (
                    <Typography color="error" style={{ marginTop: 8 }}>
                      {status.error}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
            
            <Divider className={classes.divider} />
            
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Change Password</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    variant="outlined"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.submitButton}
                    disabled={status.loading}
                  >
                    {status.loading ? 'Updating...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default ProfilePage;
EOL

  # Create pages/NotFoundPage.js
  cat > $service_dir/src/pages/NotFoundPage.js << EOL
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  makeStyles, 
  Paper 
} from '@mui/material';

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
EOL

  # Create assets/styles/index.css
  cat > $service_dir/src/assets/styles/index.css << EOL
body {
  margin: 0;
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

a {
  text-decoration: none;
  color: inherit;
}

.MuiDrawer-paper {
  position: relative !important;
}
EOL

  echo "Created $service_name structure successfully!"
}

# Create service-specific components for each service
create_farmer_service_components() {
  local service_dir="$BASE_DIR/farmer-service"
  
  # Create farmer-specific components
  mkdir -p $service_dir/src/components/farmer
  mkdir -p $service_dir/src/pages/farmer
  
  # Create FarmList component
  cat > $service_dir/src/components/farmer/FarmList.js << EOL
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  makeStyles, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 650,
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  headerCell: {
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  addButton: {
    marginBottom: theme.spacing(2),
  },
  actionCell: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
}));

const FarmList = () => {
  const classes = useStyles();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFarms([
        { id: 1, name: 'Green Valley Farm', location: 'Karnataka', size: '5 acres', crops: 'Rice, Wheat', status: 'Active' },
        { id: 2, name: 'Sunshine Fields', location: 'Punjab', size: '10 acres', crops: 'Corn, Potatoes', status: 'Active' },
        { id: 3, name: 'Riverside Plantation', location: 'Kerala', size: '3 acres', crops: 'Banana, Coconut', status: 'Inactive' },
      ]);
      setLoading(false);
    }, 1000);
    
    // Actual API call would be:
    // const fetchFarms = async () => {
    //   try {
    //     const response = await api.get('/farms');
    //     setFarms(response.data);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching farms:', error);
    //     setLoading(false);
    //   }
    // };
    // fetchFarms();
  }, []);
  
  if (loading) {
    return <Typography>Loading farms...</Typography>;
  }
  
  return (
    <div className={classes.root}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        className={classes.addButton}
      >
        Add New Farm
      </Button>
      
      <TableContainer component={Paper}>
        <Table className={classes.table}>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.headerCell}>Farm Name</TableCell>
              <TableCell className={classes.headerCell}>Location</TableCell>
              <TableCell className={classes.headerCell}>Size</TableCell>
              <TableCell className={classes.headerCell}>Crops</TableCell>
              <TableCell className={classes.headerCell}>Status</TableCell>
              <TableCell className={classes.headerCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {farms.map((farm) => (
              <TableRow key={farm.id}>
                <TableCell>{farm.name}</TableCell>
                <TableCell>{farm.location}</TableCell>
                <TableCell>{farm.size}</TableCell>
                <TableCell>{farm.crops}</TableCell>
                <TableCell>{farm.status}</TableCell>
                <TableCell className={classes.actionCell}>
                  <Tooltip title="View">
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FarmList;
EOL

  # Update MainLayout.js to include farmer-specific menu items
  sed -i '/Add more menu items here specific to the service/a \
            <ListItem button component={Link} to="/farms">\
              <ListItemIcon>\
                <span className="material-icons">agriculture</span>\
              </ListItemIcon>\
              <ListItemText primary="My Farms" />\
            </ListItem>\
            <ListItem button component={Link} to="/crops">\
              <ListItemIcon>\
                <span className="material-icons">eco</span>\
              </ListItemIcon>\
              <ListItemText primary="Crops" />\
            </ListItem>\
            <ListItem button component={Link} to="/marketplace">\
              <ListItemIcon>\
                <span className="material-icons">store</span>\
              </ListItemIcon>\
              <ListItemText primary="Marketplace" />\
            </ListItem>' $service_dir/src/components/layout/MainLayout.js
  
  # Create FarmsPage.js
  cat > $service_dir/src/pages/farmer/FarmsPage.js << EOL
import React from 'react';
import { Typography, makeStyles } from '@mui/material';
import FarmList from '../../components/farmer/FarmList';

const useStyles = makeStyles((theme) => ({
  title: {
    marginBottom: theme.spacing(3),
  },
}));

const FarmsPage = () => {
  const classes = useStyles();
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        My Farms
      </Typography>
      <FarmList />
    </div>
  );
};

export default FarmsPage;
EOL

  # Update App.js to include farmer-specific routes
  sed -i '/<Route path="profile" element={<ProfilePage \/>} \/>/a \
          <Route path="farms" element={<FarmsPage \/>} \/>' $service_dir/src/App.js
  
  # Add import for FarmsPage
  sed -i '/import ProfilePage/a import FarmsPage from '\''./pages/farmer/FarmsPage'\'';' $service_dir/src/App.js
}

create_buyer_service_components() {
  local service_dir="$BASE_DIR/buyer-service"
  
  # Create buyer-specific components
  mkdir -p $service_dir/src/components/buyer
  mkdir -p $service_dir/src/pages/buyer
  
  # Create ProductList component
  cat > $service_dir/src/components/buyer/ProductList.js << EOL
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  makeStyles,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import api from '../../services/api';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
  },
  cardContent: {
    flexGrow: 1,
  },
  searchBar: {
    marginBottom: theme.spacing(3),
    display: 'flex',
  },
  searchField: {
    flexGrow: 1,
    marginRight: theme.spacing(2),
  },
  price: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  farmer: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const ProductList = () => {
  const classes = useStyles();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        { 
          id: 1, 
          name: 'Organic Rice', 
          price: 45, 
          unit: 'kg', 
          quantity: 500, 
          farmer: 'Green Valley Farm', 
          location: 'Karnataka',
          image: 'https://via.placeholder.com/300x200?text=Rice'
        },
        { 
          id: 2, 
          name: 'Fresh Wheat', 
          price: 32, 
          unit: 'kg', 
          quantity: 1000, 
          farmer: 'Sunshine Fields', 
          location: 'Punjab',
          image: 'https://via.placeholder.com/300x200?text=Wheat'
        },
        { 
          id: 3, 
          name: 'Organic Potatoes', 
          price: 25, 
          unit: 'kg', 
          quantity: 300, 
          farmer: 'Riverside Plantation', 
          location: 'Kerala',
          image: 'https://via.placeholder.com/300x200?text=Potatoes'
        },
        { 
          id: 4, 
          name: 'Fresh Tomatoes', 
          price: 35, 
          unit: 'kg', 
          quantity: 200, 
          farmer: 'Green Valley Farm', 
          location: 'Karnataka',
          image: 'https://via.placeholder.com/300x200?text=Tomatoes'
        },
      ]);
      setLoading(false);
    }, 1000);
    
    // Actual API call would be:
    // const fetchProducts = async () => {
    //   try {
    //     const response = await api.get('/products');
    //     setProducts(response.data);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching products:', error);
    //     setLoading(false);
    //   }
    // };
    // fetchProducts();
  }, []);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return <Typography>Loading products...</Typography>;
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <TextField
          className={classes.searchField}
          variant="outlined"
          placeholder="Search products, farmers, locations..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <IconButton>
          <FilterIcon />
        </IconButton>
      </div>
      
      <Grid container spacing={4}>
        {filteredProducts.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardMedia
                className={classes.cardMedia}
                image={product.image}
                title={product.name}
              />
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography variant="h6" className={classes.price}>
                  ₹{product.price}/{product.unit}
                </Typography>
                <Typography>
                  Available: {product.quantity} {product.unit}
                </Typography>
                <Typography className={classes.farmer}>
                  {product.farmer}, {product.location}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Details
                </Button>
                <Button size="small" color="primary">
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ProductList;
EOL

  # Update MainLayout.js to include buyer-specific menu items
  sed -i '/Add more menu items here specific to the service/a \
            <ListItem button component={Link} to="/marketplace">\
              <ListItemIcon>\
                <span className="material-icons">store</span>\
              </ListItemIcon>\
              <ListItemText primary="Marketplace" />\
            </ListItem>\
            <ListItem button component={Link} to="/orders">\
              <ListItemIcon>\
                <span className="material-icons">shopping_cart</span>\
              </ListItemIcon>\
              <ListItemText primary="My Orders" />\
            </ListItem>\
            <ListItem button component={Link} to="/farmers">\
              <ListItemIcon>\
                <span className="material-icons">people</span>\
              </ListItemIcon>\
              <ListItemText primary="Farmers" />\
            </ListItem>' $service_dir/src/components/layout/MainLayout.js
  
  # Create MarketplacePage.js
  cat > $service_dir/src/pages/buyer/MarketplacePage.js << EOL
import React from 'react';
import { Typography, makeStyles } from '@mui/material';
import ProductList from '../../components/buyer/ProductList';

const useStyles = makeStyles((theme) => ({
  title: {
    marginBottom: theme.spacing(3),
  },
}));

const MarketplacePage = () => {
  const classes = useStyles();
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        Marketplace
      </Typography>
      <ProductList />
    </div>
  );
};

export default MarketplacePage;
EOL

  # Update App.js to include buyer-specific routes
  sed -i '/<Route path="profile" element={<ProfilePage \/>} \/>/a \
          <Route path="marketplace" element={<MarketplacePage \/>} \/>' $service_dir/src/App.js
  
  # Add import for MarketplacePage
  sed -i '/import ProfilePage/a import MarketplacePage from '\''./pages/buyer/MarketplacePage'\'';' $service_dir/src/App.js
}

# Create all frontend microservices
for service_name in "${!SERVICES[@]}"; do
  port=${SERVICES[$service_name]}
  create_service_structure "$service_name" "$port"
done

# Add service-specific components
create_farmer_service_components
create_buyer_service_components

echo "All frontend microservices have been generated successfully!"
echo "The microservices are located in: $BASE_DIR"