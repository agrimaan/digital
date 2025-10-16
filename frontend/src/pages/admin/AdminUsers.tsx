import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  Grid,
  Tooltip,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// User type
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  createdAt: string;
  updatedAt: string;
  isSystemAdmin?: boolean;
}

// Pagination type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await axios.get(`${API_BASE_URL}/api/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);

      if (res.data.pagination) {
        setPagination(res.data.pagination);
      } else {
        const totalUsers = res.data.users?.length || 0;
        setPagination({
          total: totalUsers,
          page,
          limit,
          pages: Math.ceil(totalUsers / limit) || 1
        });
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit]);

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1, pagination.limit);
  };

  // Handle role filter
  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    const role = event.target.value;
    setRoleFilter(role);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1, pagination.limit);
  };

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  // Delete dialog
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setUserToDelete(null);
    setDeleteDialogOpen(false);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${userToDelete._id}`);
      fetchUsers();
      closeDeleteDialog();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Helpers
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'farmer': return 'success';
      case 'buyer': return 'primary';
      case 'agronomist': return 'info';
      case 'investor': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          component={RouterLink}
          to="/admin/users/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="role-filter-label">Filter by Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="Filter by Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="farmer">Farmer</MenuItem>
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="agronomist">Agronomist</MenuItem>
                <MenuItem value="investor">Investor</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={1.5}>
            <Button fullWidth variant="outlined" startIcon={<SearchIcon />} onClick={handleSearch}>
              Search
            </Button>
          </Grid>

          <Grid item xs={6} md={1.5}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
                fetchUsers(1, pagination.limit);
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : users.length === 0 ? (
          <Typography align="center" sx={{ p: 3 }}>No users found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} color={getRoleColor(user.role) as any} size="small" />
                      {user.isSystemAdmin && <Chip label="System Admin" color="secondary" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton component={RouterLink} to={`/admin/users/${user._id}`} size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton component={RouterLink} to={`/admin/users/${user._id}/edit`} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton size="small" onClick={() => openDeleteDialog(user)} disabled={user.isSystemAdmin}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deleteUser} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;
