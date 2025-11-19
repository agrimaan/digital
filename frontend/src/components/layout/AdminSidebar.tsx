
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Upload as UploadIcon,
  Token as TokenIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  onNavigate?: (path: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Bulk Uploads', icon: <UploadIcon />, path: '/admin/bulk-uploads' },
    { text: 'Blockchain Dashboard', icon: <TokenIcon />, path: '/admin/blockchain' },
    { text: 'Land Tokenization', icon: <TokenIcon />, path: '/admin/land-tokenization' },
    { text: 'Verification Queue', icon: <CheckCircleIcon />, path: '/admin/verification-queue' },
    { text: 'Terms Management', icon: <DescriptionIcon />, path: '/admin/terms' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/admin/reports' },
  ];

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: 'primary.main',
        color: 'white',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'white' }}>
        Admin Panel
      </Typography>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
      
      <List sx={{ flex: 1 }}>
        {adminMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                color: 'white',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AdminSidebar;
