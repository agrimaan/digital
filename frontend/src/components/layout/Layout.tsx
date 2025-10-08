import React, { useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CssBaseline, Toolbar } from '@mui/material';

import Header from './Header';
import FarmerSidebar from './FarmerSidebar';
import LogisticsSidebar from './LogisticsSidebar';
import InvestorSidebar from './InvestorSidebar';
import AgronomistSidebar from './AgronomistSidebar';
import BuyerSidebar from './BuyerSidebar';
import ResponsiveLayout from './ResponsiveLayout';

import AlertDisplay from '../common/AlertDisplay';
import { RootState } from '../../store';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Admin users use ResponsiveLayout
  if (user?.role === 'admin') {
    return (
      <ResponsiveLayout
        title="Admin View"
        userName={user?.name || 'Admin'}
        userAvatar={user?.profileImage}
        onLogout={() => console.log('Admin logout')}
      >
        <Box sx={{ p: 3 }}>
          <AlertDisplay />
          {children || <Outlet />}
        </Box>
      </ResponsiveLayout>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Header */}
      <Header toggleDrawer={toggleDrawer} />

      {/* Sidebars */}
      {user?.role === 'farmer' && <FarmerSidebar open={open} toggleDrawer={toggleDrawer} user={user} />}
      {user?.role === 'logistics' && <LogisticsSidebar open={open} toggleDrawer={toggleDrawer} user={user} />}
      {user?.role === 'investor' && <InvestorSidebar open={open} toggleDrawer={toggleDrawer} user={user} />}
      {user?.role === 'agronomist' && <AgronomistSidebar open={open} toggleDrawer={toggleDrawer} user={user} />}
      {user?.role === 'buyer' && <BuyerSidebar open={open} toggleDrawer={toggleDrawer} user={user} />}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Spacer for fixed header */}

        {/* Alert Display */}
        <AlertDisplay />

        {/* Page Content */}
        <Box sx={{ p: 3, flexGrow: 1 }}>
          {children || <Outlet />}
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 3,
            mt: 'auto',
            backgroundColor: (theme) => theme.palette.background.paper,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            © {new Date().getFullYear()} Agrimaan App. All rights reserved.
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
