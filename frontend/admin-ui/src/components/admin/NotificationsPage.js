import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Badge,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, deleteNotification, createNotification } from '../../store/actions/notificationActions';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  
  const [filter, setFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: [],
    scheduled: false,
    scheduledDate: '',
  });

  useEffect(() => {
    dispatch(fetchNotifications({ filter }));
  }, [dispatch, filter]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleDelete = (notificationId) => {
    dispatch(deleteNotification(notificationId));
  };

  const handleCreateNotification = () => {
    setOpenDialog(true);
  };

  const handleSendNotification = () => {
    dispatch(createNotification(notificationForm));
    setOpenDialog(false);
    setNotificationForm({
      title: '',
      message: '',
      type: 'info',
      recipients: [],
      scheduled: false,
      scheduledDate: '',
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info':
      default: return 'info';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <NotificationsIcon color="success" />;
      case 'warning': return <NotificationsIcon color="warning" />;
      case 'error': return <NotificationsIcon color="error" />;
      case 'info':
      default: return <NotificationsIcon color="info" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const notificationTypes = [
    { value: 'info', label: 'Information' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNotification}
        >
          Create Notification
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<MarkReadIcon />}
              onClick={() => notifications.forEach(n => !n.read && handleMarkAsRead(n._id))}
            >
              Mark All Read
            </Button>
          </Box>

          <List>
            {notifications.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: 4,
                    borderColor: `${getTypeColor(notification.type)}.main`,
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      color="error"
                      variant="dot"
                      invisible={notification.read}
                    >
                      <Avatar sx={{ bgcolor: `${getTypeColor(notification.type)}.main` }}>
                        {getTypeIcon(notification.type)}
                      </Avatar>
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{notification.title}</Typography>
                        <Chip
                          label={notification.type}
                          size="small"
                          color={getTypeColor(notification.type)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification._id)}
                      disabled={notification.read}
                    >
                      <MarkReadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(notification._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                label="Type"
              >
                {notificationTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationForm.scheduled}
                  onChange={(e) => setNotificationForm({ ...notificationForm, scheduled: e.target.checked })}
                />
              }
              label="Schedule for later"
            />
            {notificationForm.scheduled && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Schedule Date"
                value={notificationForm.scheduledDate}
                onChange={(e) => setNotificationForm({ ...notificationForm, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            startIcon={<SendIcon />}
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;