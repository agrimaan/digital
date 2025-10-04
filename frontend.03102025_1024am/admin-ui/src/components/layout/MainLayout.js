import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { styled, useTheme } from '@mui/material/styles';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Container, 
  Divider, 
  Avatar, 
  Menu, 
  MenuItem 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Person as PersonIcon, 
  ExitToApp as LogoutIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/reducers/uiReducer';
import { logoutUser } from '../../store/actions/authActions';

const drawerWidth = 240;

const Root = styled('div')({
  display: 'flex',
});

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const Title = styled(Typography)({
  flexGrow: 1,
});

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
  },
}));

const DrawerContainer = styled('div')({
  overflow: 'auto',
});

const Content = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const ToolbarSpacer = styled('div')(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const StyledAvatar = styled(Avatar)({
  cursor: 'pointer',
});

const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector(state => state.ui || { sidebarOpen: true });
  const { user } = useSelector(state => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logoutUser());
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  return (
    <Root>
      <StyledAppBar position="fixed">
        <Toolbar>
          <MenuButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
          >
            <MenuIcon />
          </MenuButton>
          <Title variant="h6">
            Agrimaan Admin Service
          </Title>
          <StyledAvatar 
            onClick={handleMenuOpen}
          >
            {user?.name?.charAt(0) || 'U'}
          </StyledAvatar>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      <StyledDrawer
        variant="permanent"
        open={true}
      >
        <ToolbarSpacer />
        <DrawerContainer>
          <List>
            <ListItem button component={Link} to="/dashboard">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/users">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <ListItem button component={Link} to="/content">
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Content" />
            </ListItem>
            <ListItem button component={Link} to="/analytics">
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics" />
            </ListItem>
            <ListItem button component={Link} to="/settings">
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <Divider />
            <ListItem button component={Link} to="/audit-logs">
              <ListItemIcon>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="Audit Logs" />
            </ListItem>
            <ListItem button component={Link} to="/notifications">
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Notifications" />
            </ListItem>
          </List>
        </DrawerContainer>
      </StyledDrawer>
      <Content>
        <ToolbarSpacer />
        <Container>
          <Outlet />
        </Container>
      </Content>
    </Root>
  );
};

export default MainLayout;
