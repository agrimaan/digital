import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { CartProvider } from './contexts/CartContext';

// Common pages
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import NotFound from './pages/common/NotFound';
import Unauthorized from './pages/common/Unauthorized';
import Profile from './pages/common/Profile';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import Fields from './pages/farmer/Fields';
import FieldDetail from './pages/farmer/FieldDetail';
import Crops from './pages/farmer/CropManagement';
import Weather from './pages/farmer/Weather';
import FarmerMarketplace from './pages/farmer/FarmerMarketplace';
import Analytics from './pages/farmer/Analytics';
import AddField from './pages/farmer/AddField';
import Sensors from './pages/farmer/Sensors';
import SensorDetail from './pages/farmer/SensorDetail';
import EditSensor from './pages/farmer/EditSensor';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerMarketplace from './pages/buyer/BuyerMarketplace';
import BuyerCart from './pages/buyer/BuyerCart';
import OrderHistory from './pages/buyer/OrderHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard_BFF';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminUserEdit from './pages/admin/AdminUserEdit';
import AdminUserCreate from './pages/admin/AdminUserCreate';
import AdminFields from './pages/admin/AdminFields';
import AdminFieldDetail from './pages/admin/AdminFieldDetail';
import AdminCrops from './pages/admin/AdminCrops';
import AdminCropDetail from './pages/admin/AdminCropDetail';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminSensors from './pages/admin/AdminSensors';
import AdminSensorDetail from './pages/admin/AdminSensorDetail';
import AdminReports from './pages/admin/AdminReports';
import AdminResources from './pages/admin/AdminResources';
import AdminSettings from './pages/admin/AdminSettings';
import AdminVerification from './pages/admin/AdminVerification';
import AdminBulkUploads from './pages/admin/AdminBulkUploads';
import AdminBlockchainDashboard from './pages/admin/AdminBlockchainDashboard';
import AdminLandTokenization from './pages/admin/AdminLandTokenization';

// Agronomist pages
import AgronomistDashboard from './pages/agronomist/AgronomistDashboard';

// Investor pages
import InvestorDashboard from './pages/investor/InvestorDashboard';

// Logistics pages
import LogisticsDashboard from './pages/logistics/LogisticsDashboard';

// Supplier pages
import SupplierRegister from './pages/supplier/SupplierRegister';
import SupplierLogin from './pages/supplier/SupplierLogin';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierProducts from './pages/supplier/SupplierProducts';

// Layout
import Layout from './components/layout/Layout';
import SupplierLayout from './components/layout/SupplierLayout';
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
         case 'supplier':
           return '/supplier/dashboard';
      default:
        return '/login';
    }
  };

  // No loading logic is needed here anymore, as AuthInitializer handles it.

  return (
  <Router>
    <CartProvider>
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
                    <Route path="sensors" element={<Sensors />} />
                    <Route path="sensors/:id" element={<SensorDetail />} />
                    <Route path="sensors/:id/edit" element={<EditSensor />} />
                    <Route path="weather" element={<Weather />} />
                    <Route path="marketplace" element={<FarmerMarketplace />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile" element={<Profile />} />
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
                       <Route path="cart" element={<BuyerCart />} />
                    <Route path="orders" element={<OrderHistory />} />
                    <Route path="profile" element={<Profile />} />
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
                    <Route path="/bff" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/new" element={<AdminUserCreate />} />
                    <Route path="users/:id" element={<AdminUserDetail />} />
                    <Route path="users/:id/edit" element={<AdminUserEdit />} />
                    <Route path="fields" element={<AdminFields />} />
                    <Route path="fields/:id" element={<AdminFieldDetail />} />
                    <Route path="crops" element={<AdminCrops />} />
                    <Route path="crops/:id" element={<AdminCropDetail />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                    <Route path="sensors" element={<AdminSensors />} />
                    <Route path="sensors/:id" element={<AdminSensorDetail />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="resources" element={<AdminResources />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="verification" element={<AdminVerification />} />
                    <Route path="bulk-uploads" element={<AdminBulkUploads />} />
                    <Route path="blockchain" element={<AdminBlockchainDashboard />} />
                    <Route path="land-tokenization" element={<AdminLandTokenization />} />
                    <Route path="profile" element={<Profile />} />
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
                  </Routes>
                </Layout>
              }
            />
          }
        />
        

          {/* Supplier Routes */}
          {/* Public Supplier Routes */}
          <Route path="/supplier/register" element={<SupplierRegister />} />
          <Route path="/supplier/login" element={<SupplierLogin />} />

          {/* Protected Supplier Routes */}
          <Route
            path="/supplier/*"
            element={
              <PrivateRoute
                roles={["supplier"]}
                element={
                  <SupplierLayout>
                    <Routes>
                      <Route path="dashboard" element={<SupplierDashboard />} />
                      <Route path="products" element={<SupplierProducts />} />
                      <Route path="profile" element={<Profile />} />
                    </Routes>
                  </SupplierLayout>
                }
              />
            }
          />
        {/* Root Redirect Logic */}
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  </Router>
  );
};

export default App;