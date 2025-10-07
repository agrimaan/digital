import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loadUser } from '../../features/auth/authSlice';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // While the initial authentication check is running, render a loading screen.
  // This is the gate that prevents the rest of the app (including routing) from rendering prematurely.
  if (loading) {
    return <div>Loading Application...</div>;
  }

  // Once the authentication check is complete, render the actual application.
  return <>{children}</>;
};

export default AuthInitializer;