import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { farmerMarketplaceService, MarketplaceListing, CreateListingData } from '../../services/farmerMarketplaceService';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const FarmerMarketplace: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [readyCrops, setReadyCrops] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateListingData>({
    cropId: '',
    title: '',
    description: '',
    quantity: {
      available: 0,
      unit: 'kg',
    },
    pricing: {
      pricePerUnit: 0,
      currency: 'INR',
      negotiable: false,
    },
    harvestInfo: {
      expectedDate: new Date().toISOString().split('T')[0],
      actualDate: new Date().toISOString().split('T')[0],
    },
    qualityAttributes: {
      grade: 'A',
      isOrganic: false,
      certifications: [],
    },
  });

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {    
      if (tabValue == 0) {
        const data = await farmerMarketplaceService.getMyListings(); 
        console.log("data within loadData:", data);      
        setListings(data.data.listings || ['1']);
      } else if (tabValue === 1) {
        const data = await farmerMarketplaceService.getReadyCrops();
        setReadyCrops(data.data.crops || []);
      } else if (tabValue === 2) {
        const data = await farmerMarketplaceService.getStatistics();
        setStatistics(data.data || {});
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.createListing(formData);
      setSuccess('Listing created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateListing = async () => {
    if (!selectedListing) return;
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.updateListing(selectedListing._id, formData);
      setSuccess('Listing updated successfully!');
      setEditDialogOpen(false);
      setSelectedListing(null);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this listing?')) return;
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.deactivateListing(id);
      setSuccess('Listing deactivated successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate listing');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateListing = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.reactivateListing(id);
      setSuccess('Listing reactivated successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reactivate listing');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setFormData({
      cropId: listing.crop._id,
      title: listing.title,
      description: listing.description,
      quantity: listing.quantity,
      pricing: listing.pricing,
      harvestInfo: listing.harvestInfo,
      qualityAttributes: listing.qualityAttributes,
      images: listing.images,
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      cropId: '',
      title: '',
      description: '',
      quantity: {
        available: 0,
        unit: 'kg',
      },
      pricing: {
        pricePerUnit: 0,
        currency: 'INR',
        negotiable: false,
      },
      harvestInfo: {
        expectedDate: new Date().toISOString().split('T')[0],
        actualDate: new Date().toISOString().split('T')[0],
      },
      qualityAttributes: {
        grade: 'A',
        isOrganic: false,
        certifications: [],
      },
    });
  };

  const renderListingCard = (listing: MarketplaceListing) => (
    <Grid item xs={12} sm={6} md={4} key={listing._id}>
      <Card>
        {listing.images && listing.images.length > 0 && (
          <CardMedia
            component="img"
            height="200"
            image={listing.images[0]}
            alt={listing.title}
          />
        )}
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {listing.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {listing.crop.name} - {listing.crop.variety}
          </Typography>
          <Box sx={{ my: 1 }}>
            <Chip
              label={listing.status}
              color={listing.status === 'active' ? 'success' : 'default'}
              size="small"
              sx={{ mr: 1 }}
            />
            {listing.qualityAttributes?.isOrganic && (
              <Chip label="Organic" color="success" size="small" sx={{ mr: 1 }} />
            )}
            <Chip label={`Grade ${listing.qualityAttributes?.grade}`} size="small" />
          </Box>
          <Typography variant="h6" color="primary" gutterBottom>
            ₹{listing.pricing.pricePerUnit}/{listing.quantity.unit}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available: {listing.quantity.available} {listing.quantity.unit}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Tooltip title="Views">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption">{listing.statistics.views}</Typography>
              </Box>
            </Tooltip>
            <Tooltip title="Inquiries">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption">{listing.statistics.inquiries}</Typography>
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEditClick(listing)}
            >
              <EditIcon />
            </IconButton>
            {listing.status === 'active' ? (
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeactivateListing(listing._id)}
              >
                <VisibilityOffIcon />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                color="success"
                onClick={() => handleReactivateListing(listing._id)}
              >
                <VisibilityIcon />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderListingDialog = (isEdit: boolean) => (
    <Dialog
      open={isEdit ? editDialogOpen : createDialogOpen}
      onClose={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{isEdit ? 'Edit Listing' : 'Create New Listing'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {!isEdit && (
            <FormControl fullWidth>
              <InputLabel id="select-crop">Select Crop</InputLabel>
              <Select
                labelId="select-crop"
                label="Select Crop"
                value={formData.cropId}
                onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
              >
                {readyCrops.map((crop) => (
                  <MenuItem key={crop._id} value={crop._id}>
                    {crop.name} - {crop.variety} ({crop.currentStage})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            margin="normal"
            id="title"
            name="title"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            label="Description"
            margin="normal"
            id="description"
            name="description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Available Quantity"
                type="number"
                fullWidth
                value={formData.quantity.available}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: { ...formData.quantity, available: Number(e.target.value) },
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel id="unit-label">Unit</InputLabel>
                <Select
                  labelId="unit-label"
                  label="Unit"
                  value={formData.quantity.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: { ...formData.quantity, unit: e.target.value },
                    })
                  }
                >
                  <MenuItem value="kg">Kilograms (kg)</MenuItem>
                  <MenuItem value="quintal">Quintal</MenuItem>
                  <MenuItem value="ton">Ton</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            label="Price Per Unit"
            type="number"
            fullWidth
            value={formData.pricing.pricePerUnit}
            onChange={(e) =>
              setFormData({
                ...formData,
                pricing: { ...formData.pricing, pricePerUnit: Number(e.target.value) },
              })
            }
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          <FormControl fullWidth>
            <InputLabel id="grade">Grade</InputLabel>
            <Select
              labelId="grade"
              label="Grade"
              value={formData.qualityAttributes?.grade}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  qualityAttributes: {
                    ...formData.qualityAttributes,
                    grade: e.target.value,
                  },
                })
              }
            >
              <MenuItem value="A">Grade A</MenuItem>
              <MenuItem value="B">Grade B</MenuItem>
              <MenuItem value="C">Grade C</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}>
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleUpdateListing : handleCreateListing}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Marketplace
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
            >
              Create Listing
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="My Listings" />
            <Tab label="Ready Crops" />
            <Tab label="Statistics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : listings.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No listings yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Create your first listing to start selling your crops
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {listings.map(renderListingCard)}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : readyCrops.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No ready crops
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Crops in harvest stage will appear here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {readyCrops.map((crop) => (
                  <Grid item xs={12} sm={6} md={4} key={crop._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {crop.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Variety: {crop.variety}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stage: {crop.currentStage}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expected Yield: {crop.expectedYield} {crop.yieldUnit}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              cropId: crop._id,
                              title: `${crop.name} - ${crop.variety}`,
                            });
                            setCreateDialogOpen(true);
                          }}
                        >
                          Create Listing
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : statistics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalListings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Listings
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <VisibilityIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.activeListings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Listings
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <ShoppingCartIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalInquiries || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Inquiries
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <LocalShippingIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalOrders || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No statistics available
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {renderListingDialog(false)}
      {renderListingDialog(true)}
    </Container>
  );
};

export default FarmerMarketplace;