import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Common pages
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import NotFound from './pages/common/NotFound';
import Unauthorized from './pages/common/Unauthorized';
import Settings from './pages/common/Settings';
import Profile from './pages/common/Profile';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import Fields from './pages/farmer/Fields';
import FieldDetail from './pages/farmer/FieldDetail';
import Crops from './pages/farmer/Crops';
import Weather from './pages/farmer/Weather';
import FarmerMarketplace from './pages/common/Marketplace';
import Analytics from './pages/farmer/Analytics';
import AddField from './pages/farmer/AddField';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerMarketplace from './pages/buyer/BuyerMarketplace';
import OrderHistory from './pages/buyer/OrderHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboardAPI';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFields from './pages/admin/AdminFields';

// Agronomist pages
import AgronomistDashboard from './pages/agronomist/AgronomistDashboard';

// Investor pages
import InvestorDashboard from './pages/investor/InvestorDashboard';

// Logistics pages
import LogisticsDashboard from './pages/logistics/LogisticsDashboard';

// Layout
import Layout from './components/layout/Layout';
import EditField from 'pages/farmer/EditField';

// HOC for protected routes
const PrivateRoute: React.FC<{
  element: React.ReactElement;
  roles?: string[];
}> = ({ element, roles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // This check is now safe because AuthInitializer guarantees the state is settled.
  if (roles && (!user || !user.role || !roles.includes(user.role.toLowerCase()))) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return element;
};

const App: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const getHomeRoute = () => {
    if (!user || !user.role) return '/login'; 
    switch (user.role.toLowerCase()) {
      case 'farmer':
        return '/farmer';
      case 'buyer':
        return '/buyer';
      case 'admin':
        return '/admin';
      case 'agronomist':
        return '/agronomist';
      case 'investor':
        return '/investor';
      case 'logistics':
        return '/logistics';
      default:
        return '/login';
    }
  };

  // No loading logic is needed here anymore, as AuthInitializer handles it.

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Register />}
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Farmer Routes */}
        <Route
          path="/farmer/*"
          element={
            <PrivateRoute
              roles={['farmer']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<FarmerDashboard />} />
                    <Route path="fields" element={<Fields />} />
                    <Route path="fields/new" element={<AddField />} /> 
                    <Route path="fields/:id" element={<FieldDetail />} />
                    <Route path="fields/:id/edit" element={<EditField />} />
                    <Route path="crops" element={<Crops />} />
                    <Route path="weather" element={<Weather />} />
                    <Route path="marketplace" element={<FarmerMarketplace />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />

        {/* Buyer Routes */}
        <Route
          path="/buyer/*"
          element={
            <PrivateRoute
              roles={['buyer']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<BuyerDashboard />} />
                    <Route path="marketplace" element={<BuyerMarketplace />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute
              roles={['admin']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="fields" element={<AdminFields />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />

        {/* Agronomist Routes */}
        <Route
          path="/agronomist/*"
          element={
            <PrivateRoute
              roles={['agronomist']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<AgronomistDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />

        {/* Investor Routes */}
        <Route
          path="/investor/*"
          element={
            <PrivateRoute
              roles={['investor']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<InvestorDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />

        {/* Logistics Routes */}
        <Route
          path="/logistics/*"
          element={
            <PrivateRoute
              roles={['logistics']}
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<LogisticsDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </Layout>
              }
            />
          }
        />
        
        {/* Root Redirect Logic */}
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;