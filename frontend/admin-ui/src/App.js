import React, { useEffect } from 'react';
// BrowserRouter is removed from here because it's already in index.js
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';

// Layout and Page components
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Auth actions
import { checkAuth } from './store/actions/authActions';

// Create a theme instance to provide to the application
const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // Green - representing agriculture
    },
    secondary: {
      main: '#ff9800', // Orange accent
    },
    background: {
      default: '#f4f6f8', // A light grey background
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// PrivateRoute component protects routes that require authentication
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  // You can show a loading spinner while checking auth status
  if (loading) {
    return <div>Loading...</div>;
  }

  // If authenticated, render the children components, otherwise redirect to login
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const dispatch = useDispatch();

  // On initial app load, check if the user is already authenticated (e.g., via a token)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* The <BrowserRouter> is removed from this file. 
        The routing context is provided by the BrowserRouter in your index.js.
      */}
      <Routes>
        {/* Public Route: Anyone can access the login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes: This wrapper handles all other routes.
          The PrivateRoute component will either show the content or redirect to /login.
        */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  {/* Your main application routes go here */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  
                  {/* Default route after login redirects to the dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  
                  {/* A catch-all for any routes that don't match */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;