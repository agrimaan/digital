import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Box, CssBaseline, Drawer, Toolbar, useMediaQuery, useTheme } from '@mui/material'; // Import useTheme
import Header from './Header';
import FarmerSidebar from './FarmerSidebar';
import BuyerSidebar from './BuyerSidebar';
// import AdminSidebar from './AdminSidebar';
import AgronomistSidebar from './AgronomistSidebar';
import InvestorSidebar from './InvestorSidebar';
import LogisticsSidebar from './LogisticsSidebar';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // FIX: Hooks must be called at the top level and unconditionally.
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getSidebar = () => {
    // FIX: Add a guard clause to prevent errors when the user is not logged in.
    if (!user || !user.role) {
      return null;
    }

    const sidebarProps = {
        open: mobileOpen,
        toggleDrawer: handleDrawerToggle,
        user: user,
    };

    switch (user.role.toLowerCase()) {
      case 'farmer':
        return <FarmerSidebar {...sidebarProps} />;
      case 'buyer':
        return <BuyerSidebar {...sidebarProps} />;
      // case 'admin':
      //   return <AdminSidebar {...sidebarProps} />;
      case 'agronomist':
        return <AgronomistSidebar {...sidebarProps} />;
      case 'investor':
        return <InvestorSidebar {...sidebarProps} />;
      case 'logistics':
        return <LogisticsSidebar {...sidebarProps} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <Toolbar />
          {getSidebar()}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;