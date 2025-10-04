import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useDispatch } from 'react-redux';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
//import store from './store';


// Components
import ProtectedRoute from './utils/ProtectedRoute';
import Layout from './components/layout/Layout';

// Actions
import { checkAuth } from './store/actions/authActions';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#ff6f00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

// Wrapper component for protected routes with layout
const ProtectedRouteWithLayout = ({ component: Component, allowedRoles }) => {
  return (
    <ProtectedRoute 
      component={() => (
        <Layout>
          <Component />
        </Layout>
      )} 
      allowedRoles={allowedRoles} 
    />
  );
};

function App() {
  const dispatch = useDispatch();

  // Check authentication status on app load
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes with Layout */}
          <Route 
            path="/" 
            element={<ProtectedRouteWithLayout component={DashboardPage} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRouteWithLayout component={ProfilePage} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/farms" 
            element={<ProtectedRouteWithLayout component={() => <h1>Farms Page</h1>} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/crops" 
            element={<ProtectedRouteWithLayout component={() => <h1>Crops Page</h1>} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/marketplace" 
            element={<ProtectedRouteWithLayout component={() => <h1>Marketplace Page</h1>} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/weather" 
            element={<ProtectedRouteWithLayout component={() => <h1>Weather Page</h1>} allowedRoles={['farmer']} />} 
          />
          <Route 
            path="/settings" 
            element={<ProtectedRouteWithLayout component={() => <h1>Settings Page</h1>} allowedRoles={['farmer']} />} 
          />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;