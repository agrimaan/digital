import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import buyerMarketplaceService, { MarketplaceListing, ListingFilters } from '../../services/buyerMarketplaceService';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Nature as EcoIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';

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
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BuyerMarketplace: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<MarketplaceListing[]>([]);
  const [organicListings, setOrganicListings] = useState<MarketplaceListing[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryQuantity, setInquiryQuantity] = useState('');



  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      loadListings();
    } else if (tabValue === 1) {
      loadFeaturedListings();
    } else if (tabValue === 2) {
      loadOrganicListings();
    }
  }, [tabValue, page, selectedCrop, selectedGrade, minPrice, maxPrice, organicOnly]);

  const loadInitialData = async () => {
    try {
      const [cropsResponse, statsResponse] = await Promise.all([
        buyerMarketplaceService.getAvailableCrops(),
        buyerMarketplaceService.getStatistics(),
      ]);

      if (cropsResponse.success) {
        setAvailableCrops(cropsResponse.data);
      }

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ListingFilters = {
        page,
        limit: 12,
      };

      if (searchTerm) filters.search = searchTerm;
      if (selectedCrop) filters.crop = selectedCrop;
      if (selectedGrade) filters.grade = selectedGrade;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (organicOnly) filters.isOrganic = true;

      const response = await buyerMarketplaceService.getListings(filters);
      console.log('Listings response:', response.data);

      if (response.success  ) {
        const listings = setListings(response.data);
        console.log('User info in BuyerMarketplace:', user);
        console.log('Listings state:', listings);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await buyerMarketplaceService.getFeaturedListings(12);
      if (response.success) {
        setFeaturedListings(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load featured listings');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganicListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await buyerMarketplaceService.getOrganicListings({ page, limit: 12 });
      if (response.success) {
        setOrganicListings(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organic listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadListings();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCrop('');
    setSelectedGrade('');
    setMinPrice('');
    setMaxPrice('');
    setOrganicOnly(false);
    setPage(1);
  };

  const handleViewDetails = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setDetailsDialogOpen(true);
  };

  const handleOpenInquiry = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setInquiryDialogOpen(true);
  };

  const handleSubmitInquiry = async () => {
    if (!selectedListing || !inquiryMessage) {
      setError('Please provide a message');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await buyerMarketplaceService.recordInquiry(selectedListing._id, {
        message: inquiryMessage,
        contactPhone: inquiryPhone,
        interestedQuantity: inquiryQuantity ? parseFloat(inquiryQuantity) : undefined,
      });

      if (response.success) {
        setSuccess('Inquiry sent successfully!');
        setInquiryDialogOpen(false);
        setInquiryMessage('');
        setInquiryPhone('');
        setInquiryQuantity('');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const renderListingCard = (listing: MarketplaceListing) => (
    <Grid item xs={12} sm={6} md={4} key={listing._id}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {listing.images && listing.images.length > 0 ? (
          <CardMedia
            component="img"
            height="200"
            image={listing.images[0]}
            alt={listing.title}
          />
        ) : (
          <Box
            sx={{
              height: 200,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No Image
            </Typography>
          </Box>
        )}
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {listing.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {listing.crop.name} - {listing.crop.variety}
          </Typography>
          <Box sx={{ my: 1 }}>
            {listing.qualityAttributes.isOrganic && (
              <Chip icon={<EcoIcon />} label="Organic" color="success" size="small" sx={{ mr: 1 }} />
            )}
            <Chip label={`Grade ${listing.qualityAttributes.grade}`} size="small" />
          </Box>
          <Typography variant="h6" color="primary" gutterBottom>
            ₹{listing.pricing.pricePerUnit}/{listing.quantity.unit}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available: {listing.quantity.available} {listing.quantity.unit}
          </Typography>
          {listing.farmLocation?.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {listing.farmLocation.address.district}, {listing.farmLocation.address.state}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleViewDetails(listing)}
            >
              View Details
            </Button>
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={() => handleOpenInquiry(listing)}
            >
              Inquire
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Marketplace
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              console.log('Refreshing data for tab:', tabValue);
              if (tabValue === 0) loadListings();
              else if (tabValue === 1) loadFeaturedListings();
              else if (tabValue === 2) loadOrganicListings();
              console.log('Data refreshed', listings)
            }}
            disabled={loading}
          >
            Refresh
          </Button>
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

        {/* Statistics */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{statistics.totalListings || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Listings
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{statistics.activeListings || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Listings
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{statistics.totalCrops || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Crop Types
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">{statistics.organicListings || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Organic
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Crop Type</InputLabel>
                <Select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  label="Crop Type"
                >
                  <MenuItem value="">All Crops</MenuItem>
                  {availableCrops.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  label="Grade"
                >
                  <MenuItem value="">All Grades</MenuItem>
                  <MenuItem value="A">Grade A</MenuItem>
                  <MenuItem value="B">Grade B</MenuItem>
                  <MenuItem value="C">Grade C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="All Listings" />
            <Tab label="Featured" icon={<StarIcon />} iconPosition="start" />
            <Tab label="Organic" icon={<EcoIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : listings.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No listings found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your filters
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  {listings.map(renderListingCard)}
                </Grid>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {featuredListings.map(renderListingCard)}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {organicListings.map(renderListingCard)}
              </Grid>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedListing && (
          <>
            <DialogTitle>
              {selectedListing.title}
              <IconButton
                onClick={() => setDetailsDialogOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedListing.description}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Crop:</Typography>
                  <Typography variant="body2">
                    {selectedListing.crop.name} - {selectedListing.crop.variety}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Grade:</Typography>
                  <Typography variant="body2">
                    {selectedListing.qualityAttributes.grade}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Price:</Typography>
                  <Typography variant="body2">
                    ₹{selectedListing.pricing.pricePerUnit}/{selectedListing.quantity.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Available:</Typography>
                  <Typography variant="body2">
                    {selectedListing.quantity.available} {selectedListing.quantity.unit}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Location:</Typography>
                  <Typography variant="body2">
                    {selectedListing.farmLocation?.address?.district}, {selectedListing.farmLocation?.address?.state}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleOpenInquiry(selectedListing);
                }}
              >
                Make Inquiry
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Inquiry Dialog */}
      <Dialog
        open={inquiryDialogOpen}
        onClose={() => setInquiryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Inquiry</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Message"
              multiline
              rows={4}
              fullWidth
              required
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Enter your inquiry message..."
            />
            <TextField
              label="Contact Phone"
              fullWidth
              value={inquiryPhone}
              onChange={(e) => setInquiryPhone(e.target.value)}
              placeholder="Your contact number"
            />
            <TextField
              label="Interested Quantity"
              type="number"
              fullWidth
              value={inquiryQuantity}
              onChange={(e) => setInquiryQuantity(e.target.value)}
              placeholder="Quantity you're interested in"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInquiryDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitInquiry}
            disabled={loading || !inquiryMessage}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Inquiry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerMarketplace;