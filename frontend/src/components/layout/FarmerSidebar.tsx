import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip
} from '@mui/material';
import   MatchmakingIcon from '@mui/icons-material/GroupAdd';

import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Terrain as LandscapeIcon,
  Grass as CropsIcon,
  Sensors as SensorsIcon,
  Analytics as AnalyticsIcon,
  WbSunny as WeatherIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  toggleDrawer: () => void;
  user: any;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const FarmerSidebar: React.FC<SidebarProps> = ({ open, toggleDrawer, user }) => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      path: '/farmer',
      icon: <DashboardIcon />
    },
    {
      title: 'Fields',
      path: '/farmer/fields',
      icon: <LandscapeIcon />
    },
    {
      title: 'Crops',
      path: '/farmer/crops',
      icon: <CropsIcon />
    },
    {
      title: 'Sensors',
      path: '/farmer/sensors',
      icon: <SensorsIcon />
    },
    {
      title: 'Analytics',
      path: '/farmer/analytics',
      icon: <AnalyticsIcon />
    },
    {
      title: 'Weather',
      path: '/farmer/weather',
      icon: <WeatherIcon />
    },
    {
      title: 'Matchmaking',
      path: '/farmer/matchmaking',
      icon: <MatchmakingIcon />
    },
    {
      title: 'Sustainability',
      path: '/farmer/sustainability',
      icon: <MatchmakingIcon />
    },
    {
      title: 'Resources',
      path: '/farmer/resources',
      icon: <MatchmakingIcon />
    }
  ];
  
  const secondaryNavItems: NavItem[] = [
    {
      title: 'Profile',
      path: '/farmer/profile',
      icon: <ProfileIcon />
    },
    {
      title: 'Settings',
      path: '/farmer/settings',
      icon: <SettingsIcon />
    },
    {
      title: 'Help',
      path: '/farmer/help',
      icon: <HelpIcon />
    }
  ];
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );
  
  const filteredSecondaryNavItems = secondaryNavItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : 72,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        ...(!open && {
          overflowX: 'hidden',
          width: 72,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }),
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: [1],
        }}
      >
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      
      <Divider />
      
      {/* Primary Navigation */}
      <List component="nav">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
            
          return (
            <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={open ? '' : item.title} placement="right">
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      color: isActive ? 'primary.main' : 'inherit',
                    }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      {/* Secondary Navigation */}
      <List>
        {filteredSecondaryNavItems.map((item) => {
          const isActive = location.pathname === item.path;
            
          return (
            <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={open ? '' : item.title} placement="right">
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      color: isActive ? 'primary.main' : 'inherit',
                    }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* App Version */}
      {open && (
        <Box sx={{ p: 2, opacity: 0.7 }}>
          <ListItemText 
            primary="Agrimaan App" 
            secondary="v1.0.0" 
            primaryTypographyProps={{ variant: 'caption' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </Box>
      )}
    </Drawer>
  );
};

export default FarmerSidebar;