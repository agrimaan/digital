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
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  },
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
});
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
// Private route component
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
const PrivateRoute = ({ children }) => {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  const { isAuthenticated, loading } = useSelector(state => state.auth);
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  if (loading) {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
    return <div>Loading...</div>;
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  }
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  return isAuthenticated ? children : <Navigate to="/login" />;
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
};
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
function App() {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  const dispatch = useDispatch();
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  useEffect(() => {
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
    dispatch(checkAuth());
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  }, [dispatch]);
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  return (
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
    <ThemeProvider theme={theme}>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
      <CssBaseline />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
      <Routes>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
        <Route path="/login" element={<LoginPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
        
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
        <Route path="/" element={
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
          <PrivateRoute>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
            <MainLayout />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
          </PrivateRoute>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
        }>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
          <Route index element={<DashboardPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
          <Route path="profile" element={<ProfilePage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
          <Route path="*" element={<NotFoundPage />} />
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
        </Route>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
      </Routes>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
    </ThemeProvider>
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
  );
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
}
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },

    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
export default App;
    spacing: 8, // Add spacing function
    shape: {
      borderRadius: 4,
    },
