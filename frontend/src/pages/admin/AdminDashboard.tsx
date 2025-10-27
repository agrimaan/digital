// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Container, Divider, Grid, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip,
  Avatar, List, ListItem, ListItemAvatar, ListItemText, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import {
  People as PeopleIcon, Terrain as TerrainIcon, Grass as GrassIcon,
  Sensors as SensorsIcon, ShoppingCart as ShoppingCartIcon, Edit as EditIcon,
  Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon,
  Person as PersonIcon, SupervisorAccount as AdminIcon, LocalShipping as ShippingIcon,
  Store as StoreIcon, Download as DownloadIcon, Upload as UploadIcon,
  Construction as ResourcesIcon
} from '@mui/icons-material';
import SettingsIcon from "@mui/icons-material/Settings";
import { useTheme } from '@mui/material/styles';

import { RootState } from '../../store';
import axios from 'axios';
//import { API_BASE_URL } from '../../config/apiConfig';

import adminDashboardAPI from '../../services/adminService';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// ---------------- Types ----------------
interface DashboardData {
  counts: {
    users: number; fields: number; crops: number; sensors: number;
    orders: number; landTokens: number; bulkUploads: number; resources?: number;
  };
  blockchainStats?: {
    totalTokens: number;
    totalTransactions: number;
    activeContracts: number;
  };
  usersByRole: {
    farmers: number; buyers: number; agronomists: number; investors: number; admins: number; supplier: number;
  };
  recentOrders: Array<{
    _id: string;
    buyer: { _id: string; name: string };
    seller: { _id: string; name: string };
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentUsers: Array<User>;
  verificationStats: {
    pendingUsers: number; pendingLandTokens: number; pendingBulkUploads: number;
  };
  systemHealth: {
    otpEnabled: boolean; emailConfigured: boolean; smsConfigured: boolean; oauthConfigured: boolean;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus?: string;
  createdAt: string;
  phone?: { number: string; verified: boolean };
  emailVerification?: { verified: boolean };
}

interface LandToken {
  _id: string;
  landId: string;
  owner: { name: string; email: string };
  landDetails: {
    location: { city: string; state: string };
    area: { value: number; unit: string };
  };
  verification: { status: string };
  status: string;
  createdAt: string;
}

interface BulkUpload {
  _id: string;
  filename: string;
  type: string;
  status: string;
  records: number;
  success: number;
  failed: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface Resource {
  _id: string;
  name: string;
  type: string;
  hourlyRate: number;
  location: string;
  owner: { name: string; email: string };
  createdAt: string;
}

// ---------------- Component ----------------
const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [landTokens, setLandTokens] = useState<LandToken[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUpload[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('');

  const [resourceDialog, setResourceDialog] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({ name: '', type: '', hourlyRate: 0, location: '' });

  // ---- API client with token ----
  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const api = useMemo(() => {
    if (!API_BASE_URL) {
      // Guard: make failure obvious in UI
      setError('API_BASE_URL is not set. Please set VITE_API_BASE_URL / REACT_APP_API_BASE_URL / NEXT_PUBLIC_API_BASE_URL.');
    }
    const inst = axios.create({ baseURL: API_BASE_URL });
    inst.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return inst;
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parse = <T,>(raw: any, fallback: T): T => (raw?.data?.data ?? raw?.data ?? raw ?? fallback);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
     
      // These methods can return various wrappers; normalize with parse()
      const [statsRaw, recentUsersRaw, recentOrdersRaw, healthRaw] = await Promise.all([
        adminDashboardAPI.dashboard.getDashboardStats(),
        adminDashboardAPI.dashboard.getUsersByRole(),
        adminDashboardAPI.dashboard.getFields(),
        adminDashboardAPI.dashboard.getCrops(),
        adminDashboardAPI.dashboard.getSensors(),
        adminDashboardAPI.dashboard.getOrders(),
        adminDashboardAPI.dashboard.getRecentUsers(10),
        adminDashboardAPI.dashboard.getRecentOrders(5),
        adminDashboardAPI.dashboard.getSystemHealth()
      ]);

      const stats = parse<any>(statsRaw, {});
      const ru = parse<any>(recentUsersRaw, []);
      const ro = parse<any>(recentOrdersRaw, []);
      const health = parse<any>(healthRaw, {});

      // Land tokens (best-effort)
      let realLandTokens: LandToken[] = [];
      try {
        const r = await api.get('/api/blockchain/tokens', { params: { tokenType: 'Fields' } });
        const arr = parse<any>(r, []);
        realLandTokens = Array.isArray(arr) ? arr : (arr.data || arr.items || []);
      } catch (e) {
        console.warn('Land tokens service unavailable:', (e as any)?.message || e);
      }

      // Bulk uploads
      let realBulkUploads: BulkUpload[] = [];
      try {
        const r = await api.get('/api/admin/bulk-uploads');
        const arr = parse<any>(r, []);
        realBulkUploads = Array.isArray(arr) ? arr : (arr.data || arr.items || []);
      } catch (e) {
        console.warn('Bulk uploads service unavailable:', (e as any)?.message || e);
      }

      // Resources
      let realResources: Resource[] = [];
      try {
        const r = await api.get('/api/admin/resources');
        const arr = parse<any>(r, []);
        realResources = Array.isArray(arr) ? arr : (arr.data || arr.items || []);
      } catch (e) {
        console.warn('Resources service unavailable:', (e as any)?.message || e);
      }

      // Counts – tolerate multiple shapes: stats.counts.*, or stats.users, etc.
      const counts = {
        users: Number(stats.counts?.users ?? stats.users ?? 0),
        fields: Number(stats.counts?.fields ?? stats.fields ?? 0),
        crops: Number(stats.counts?.crops ?? stats.crops ?? 0),
        sensors: Number(stats.counts?.sensors ?? stats.sensors ?? 0),
        orders: Number(stats.counts?.orders ?? stats.orders ?? 0),
        landTokens: Number(stats.counts?.landTokens ?? stats.landTokens ?? realLandTokens.length ?? 0),
        bulkUploads: Number(stats.counts?.bulkUploads ?? stats.bulkUploads ?? realBulkUploads.length ?? 0),
        resources: Number(stats.counts?.resources ?? realResources.length ?? 0),
      };

      const usersByRole = stats.usersByRole ?? {
        farmers: 0, buyers: 0, agronomists: 0, investors: 0, admins: 0
      };

      const recentOrders = Array.isArray(ro?.recentOrders) ? ro.recentOrders : (Array.isArray(ro) ? ro : (ro.data || ro.items || []));
      const recentUsers = Array.isArray(ru?.users) ? ru.users : (Array.isArray(ru) ? ru : (ru.data || ru.items || []));

      setDashboardData({
        counts,
        usersByRole,
        recentOrders,
        recentUsers,
        verificationStats: stats.verificationStats ?? { pendingUsers: 0, pendingLandTokens: 0, pendingBulkUploads: 0 },
        systemHealth: health ?? { otpEnabled: false, emailConfigured: false, smsConfigured: false, oauthConfigured: false }
      });

      setUsers(recentUsers);
      setLandTokens(realLandTokens);
      setBulkUploads(realBulkUploads);
      setResources(realResources);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Fix for Avatar bgcolor (must be actual color, not semantic name)
  const roleBgColor = (role: string) => {
    const map: Record<string, string> = {
      admin: theme.palette.error.main,
      farmer: theme.palette.success.main,
      buyer: theme.palette.primary.main,
      agronomist: theme.palette.info.main,
      investor: theme.palette.warning.main,
    };
    return map[role] || theme.palette.grey[500];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'farmer': return <TerrainIcon />;
      case 'buyer': return <ShoppingCartIcon />;
      case 'agronomist': return <GrassIcon />;
      case 'investor': return <StoreIcon />;
      default: return <PersonIcon />;
    }
  };

  const handleOpenResourceDialog = (resource?: Resource) => {
    if (resource) {
      setCurrentResource(resource);
      setResourceForm({
        name: resource.name,
        type: resource.type,
        hourlyRate: resource.hourlyRate,
        location: resource.location
      });
    } else {
      setCurrentResource(null);
      setResourceForm({ name: '', type: '', hourlyRate: 0, location: '' });
    }
    setResourceDialog(true);
  };

  const handleResourceSubmit = async () => {
    try {
      if (currentResource) {
        await api.put(`/api/admin/resources/${currentResource._id}`, resourceForm);
      } else {
        await api.post('/api/admin/resources', resourceForm);
      }
      setResourceDialog(false);
      await fetchDashboardData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save resource');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/api/admin/resources/${resourceId}`);
      await fetchDashboardData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete resource');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading dashboard data…</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const counts = dashboardData?.counts ?? { users: 0, fields: 0, crops: 0, sensors: 0, orders: 0, landTokens: 0, bulkUploads: 0, resources: 0 };
  const blockchainStats = dashboardData?.blockchainStats ?? { totalTokens: 0, totalTransactions: 0, activeContracts: 0 };
  console.log(counts);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box>
          <Button component={RouterLink} to="/admin/users/new" variant="contained" startIcon={<AddIcon />} sx={{ mr: 1 }}>
            Add User
          </Button>
          <Button component={RouterLink} to="/admin/settings" variant="outlined" startIcon={<SettingsIcon />}>
            Settings
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Welcome, {user?.name || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is your comprehensive admin control panel. From here, you can manage all aspects of the platform including users, fields, crops, sensors, land tokens, bulk uploads, and system configuration.
        </Typography>
      </Paper>
      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard title="Total Users" count={counts.users} icon={<PeopleIcon color="primary" sx={{ fontSize: 40 }} />} to="/admin/users" cta="Manage Users" />
        <StatCard title="Fields" count={counts.fields} icon={<TerrainIcon color="success" sx={{ fontSize: 40 }} />} to="/admin/fields" cta="Manage Fields" />
        <StatCard title="Crops" count={counts.crops} icon={<GrassIcon color="info" sx={{ fontSize: 40 }} />} to="/admin/crops" cta="Manage Crops" />
        <StatCard title="Sensors" count={counts.sensors} icon={<SensorsIcon color="warning" sx={{ fontSize: 40 }} />} to="/admin/sensors" cta="Manage Sensors" />
        <StatCard title="Orders" count={counts.orders} icon={<ShoppingCartIcon color="secondary" sx={{ fontSize: 40 }} />} to="/admin/orders" cta="Manage Orders" />
        <StatCard title="Resources" count={counts.resources || 0} icon={<ResourcesIcon color="primary" sx={{ fontSize: 40 }} />} to="/admin/resources" cta="Manage Resources" />
      </Grid>

      {/* Action row */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/admin/users/new">Add User</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenResourceDialog()}>Add Resource</Button>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setBulkUploadDialog(true)} color="secondary">Bulk Upload</Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.open(`${API_BASE_URL}/api/admin/reports/users?format=csv`, '_blank')}>Export Users</Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.open(`${API_BASE_URL}/api/admin/reports/land-tokens?format=csv`, '_blank')}>Export Land Tokens</Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label={`Recent Users (${users.length})`} />
          <Tab label={`Recent Orders (${dashboardData?.recentOrders?.length || 0})`} />
          <Tab label={`Pending Land Tokens (${landTokens.length})`} />
          <Tab label={`Bulk Uploads (${bulkUploads.length})`} />
          <Tab label={`Resources (${resources.length})`} />
        </Tabs>
      </Box>

      {/* Users */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <SectionHeader title="Recent Users" to="/admin/users" icon={<PeopleIcon />} />
          {users.length ? (
            <List>
              {users.map((u) => (
                <ListItem key={u._id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="View">
                        <IconButton component={RouterLink} to={`/admin/users/${u._id}`} size="small"><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton component={RouterLink} to={`/admin/users/${u._id}/edit`} size="small"><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  }>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: roleBgColor(u.role) }}>{getRoleIcon(u.role)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={<><Typography component="span" variant="body2" color="text.primary">{u.email}</Typography>{` — Joined ${formatDate(u.createdAt)}`}</>}
                  />
                </ListItem>
              ))}
            </List>
          ) : <Typography color="text.secondary">No users found.</Typography>}
        </Paper>
      )}

      {/* Orders */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <SectionHeader title="Recent Orders" to="/admin/orders" icon={<ShoppingCartIcon />} />
          {dashboardData?.recentOrders?.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.recentOrders.map((o) => (
                    <TableRow key={o._id}>
                      <TableCell>{o._id.slice(0, 8)}…</TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell>{o.buyer?.name || '—'}</TableCell>
                      <TableCell>{o.seller?.name || '—'}</TableCell>
                      <TableCell align="right">
                        {typeof o.totalAmount === 'number' ? o.totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={o.status?.[0]?.toUpperCase() + o.status?.slice(1)} color={getStatusColor(o.status) as any} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton component={RouterLink} to={`/admin/orders/${o._id}`} size="small"><VisibilityIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Typography color="text.secondary">No recent orders found.</Typography>}
        </Paper>
      )}

      {/* Land tokens */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <SectionHeader title="Pending Land Tokens" to="/admin/tokens" icon={<StoreIcon />} />
          {landTokens.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Land ID</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {landTokens.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.landId}</TableCell>
                      <TableCell>{t.owner?.name}</TableCell>
                      <TableCell>{t.landDetails?.location?.city}, {t.landDetails?.location?.state}</TableCell>
                      <TableCell>{t.landDetails?.area?.value} {t.landDetails?.area?.unit}</TableCell>
                      <TableCell><Chip label={t.verification?.status || '—'} size="small" color={(t.verification?.status === 'pending' ? 'warning' : 'default') as any} /></TableCell>
                      <TableCell>{formatDate(t.createdAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton component={RouterLink} to={`/admin/tokens/${t._id}`} size="small"><VisibilityIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Typography color="text.secondary">No pending land tokens found.</Typography>}
        </Paper>
      )}

      {/* Bulk uploads */}
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <SectionHeader title="Bulk Uploads" to="/admin/bulk-uploads" icon={<UploadIcon />} />
          {bulkUploads.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Records</TableCell>
                    <TableCell align="right">Success</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkUploads.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.filename}</TableCell>
                      <TableCell><Chip label={u.type} size="small" /></TableCell>
                      <TableCell><Chip label={u.status} color={getStatusColor(u.status) as any} size="small" /></TableCell>
                      <TableCell align="right">{u.records}</TableCell>
                      <TableCell align="right">{u.success}</TableCell>
                      <TableCell align="right">{u.failed}</TableCell>
                      <TableCell>{formatDate(u.uploadedAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="Download Report">
                          <IconButton size="small"><DownloadIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Typography color="text.secondary">No bulk uploads found.</Typography>}
        </Paper>
      )}

      {/* Resources */}
      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <SectionHeader title="All Resources" to="/admin/resources" icon={<ResourcesIcon />} />
          {resources.length ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>₹{r.hourlyRate}</TableCell>
                      <TableCell>{r.location}</TableCell>
                      <TableCell>{r.owner?.name}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenResourceDialog(r)} size="small"><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteResource(r._id)} size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Typography color="text.secondary">No resources found.</Typography>}
        </Paper>
      )}

      {/* Verification Dialog */}
      <Dialog open={verificationDialog} onClose={() => setVerificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{/* context-based title */}Verification</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth multiline rows={4}
            label="Verification Notes / Rejection Reason"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>Cancel</Button>
          <Button color="error" onClick={() => { /* TODO */ setVerificationDialog(false); }}>Reject</Button>
          <Button color="success" variant="contained" onClick={() => { /* TODO */ setVerificationDialog(false); }}>Approve</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialog} onClose={() => setBulkUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Upload Type</InputLabel>
            <Select value={uploadType} label="Upload Type" onChange={(e) => setUploadType(e.target.value)}>
              <MenuItem value="users">Users</MenuItem>
              <MenuItem value="fields">Fields</MenuItem>
              <MenuItem value="crops">Crops</MenuItem>
              <MenuItem value="sensors">Sensors</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!uploadType} sx={{ mb: 2 }}>
            Download Template
          </Button>

          <input
            type="file" accept=".csv,.xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={!uploadFile || !uploadType}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Resource Dialog */}
      <Dialog open={resourceDialog} onClose={() => setResourceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Resource Name" type="text" fullWidth
            value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select value={resourceForm.type} label="Type" onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}>
              <MenuItem value="Machinery">Machinery</MenuItem>
              <MenuItem value="Equipment">Equipment</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField margin="dense" label="Hourly Rate" type="number" fullWidth
            value={resourceForm.hourlyRate}
            onChange={(e) => setResourceForm({ ...resourceForm, hourlyRate: parseFloat(e.target.value) || 0 })} />
          <TextField margin="dense" label="Location" type="text" fullWidth
            value={resourceForm.location} onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialog(false)}>Cancel</Button>
          <Button onClick={handleResourceSubmit} color="primary" variant="contained">
            {currentResource ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// ---- Small helpers ----
const StatCard: React.FC<{ title: string; count: number; icon: React.ReactNode; to: string; cta: string; }> = ({ title, count, icon, to, cta }) => (
  <Grid item xs={12} sm={6} md={2}>
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" component="div">{count ?? 0}</Typography>
          </Box>
          {icon}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button component={RouterLink} to={to} size="small" color="primary">{cta}</Button>
        </Box>
      </CardContent>
    </Card>
  </Grid>
);

const SectionHeader: React.FC<{ title: string; to: string; icon: React.ReactNode; }> = ({ title, to, icon }) => (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" component="h2">{title}</Typography>
      <Button component={RouterLink} to={to} size="small" endIcon={icon as any}>View All</Button>
    </Box>
    <Divider sx={{ mb: 2 }} />
  </>
);

export default AdminDashboard;
