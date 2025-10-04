import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component to handle authentication and authorization
 * @param {Object} props - Component props
 * @param {React.Component} props.component - Component to render if authenticated
 * @param {Array} props.allowedRoles - Array of roles allowed to access this route
 * @returns {React.Component} - Protected component or redirect to login
 */
const ProtectedRoute = ({ component: Component, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  const location = useLocation();

  // If still loading auth state, show loading indicator
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If roles are specified and user doesn't have permission, show unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  // If authenticated and authorized, render the component
  return <Component />;
};

export default ProtectedRoute;