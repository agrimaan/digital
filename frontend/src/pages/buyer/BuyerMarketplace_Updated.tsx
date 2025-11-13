import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import marketplaceService, { MarketplaceProduct } from '../../services/marketplaceService';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
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
  Rating,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  FilterList as FilterListIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { RootState } from '../../store';

const BuyerMarketplace: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterQuality, setFilterQuality] = useState('All');
  const [items, setItems] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceProduct | null>(null);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [cart, setCart] = useState<MarketplaceProduct[]>([]);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await marketplaceService.getProducts({ showInactive: false });
      setItems(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search term and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.specifications?.variety || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesQuality = filterQuality === 'All' || 
                          (item.isOrganic && filterQuality === 'Organic') ||
                          (item.specifications?.quality === filterQuality);
    
    return matchesSearch && matchesCategory && matchesQuality && item.isActive;
  });

  // Handle purchase dialog
  const handleOpenPurchaseDialog = (item: MarketplaceProduct) => {
    setSelectedItem(item);
    setPurchaseDialog(true);
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialog(false);
    setSelectedItem(null);
  };

  // Handle purchase
  const handlePurchase = () => {
    if (selectedItem) {
      alert(`Successfully purchased ${selectedItem.quantity.available} ${selectedItem.quantity.unit} of ${selectedItem.name}!`);
      handleClosePurchaseDialog();
      loadProducts(); // Reload to get updated data
    }
  };

  // Handle save/unsave item
  const handleToggleSaveItem = (id: string) => {
    if (savedItems.includes(id)) {
      setSavedItems(prev => prev.filter(itemId => itemId !== id));
    } else {
      setSavedItems(prev => [...prev, id]);
    }
  };

  // Handle add to cart
  const handleAddToCart = (item: MarketplaceProduct) => {
    if (!cart.some(cartItem => cartItem._id === item._id)) {
      setCart(prev => [...prev, item]);
      alert(`Added ${item.name} to your cart!`);
    } else {
      alert(`${item.name} is already in your cart!`);
    }
  };

  // Get quality color
  const getQualityColor = (item: MarketplaceProduct) => {
    if (item.isOrganic) return 'success';
    if (item.specifications?.quality === 'Premium') return 'success';
    if (item.specifications?.quality === 'Grade A') return 'primary';
    return 'default';
  };

  // Get quality label
  const getQualityLabel = (item: MarketplaceProduct) => {
    if (item.isOrganic) return 'Organic';
    return item.specifications?.quality || 'Standard';
  };

  // Get image URL
  const getImageUrl = (item: MarketplaceProduct) => {
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    // Default images based on category
    const defaultImages: Record<string, string> = {
      crop: 'https://images.unsplash.com/photo-1574323347407-f5e1c5a6ec21?w=400',
      seed: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
      fertilizer: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      pesticide: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      equipment: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
      other: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'
    };
    return defaultImages[item.category] || defaultImages.other;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketplace
        </Typography>
        
        <Box>
          <Button
            component={RouterLink}
            to="/buyer/cart"
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            sx={{ mr: 1 }}
          >
            Cart ({cart.length})
          </Button>
          <Button
            component={RouterLink}
            to="/buyer/saved"
            variant="outlined"
            startIcon={<FavoriteIcon />}
          >
            Saved ({savedItems.length})
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search crops, varieties, or sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="All">All Categories</MenuItem>
                <MenuItem value="crop">Crops</MenuItem>
                <MenuItem value="seed">Seeds</MenuItem>
                <MenuItem value="fertilizer">Fertilizers</MenuItem>
                <MenuItem value="pesticide">Pesticides</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Quality</InputLabel>
              <Select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                label="Quality"
              >
                <MenuItem value="All">All Qualities</MenuItem>
                <MenuItem value="Organic">Organic</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Grade A">Grade A</MenuItem>
                <MenuItem value="Grade B">Grade B</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(item)}
                    alt={item.name}
                  />
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      bgcolor: 'white', 
                      '&:hover': { bgcolor: 'white' } 
                    }}
                    onClick={() => handleToggleSaveItem(item._id)}
                  >
                    {savedItems.includes(item._id) ? (
                      <FavoriteIcon color="error" />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {item.name}
                    {item.specifications?.variety && ` - ${item.specifications.variety}`}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={getQualityLabel(item)} 
                      color={getQualityColor(item) as any} 
                      size="small" 
                    />
                    <Chip 
                      label={item.category} 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AttachMoneyIcon fontSize="small" />
                    <Typography variant="h6" color="primary">
                      ₹{item.price.value}/{item.price.unit}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Available: {item.quantity.available} {item.quantity.unit}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {item.location?.address?.city || 'Location not specified'}, {item.location?.address?.state || ''}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description}
                  </Typography>

                  {item.harvestDate && (
                    <Typography variant="caption" color="text.secondary">
                      Harvested: {new Date(item.harvestDate).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    sx={{ flexGrow: 1 }}
                    onClick={() => handleAddToCart(item)}
                    startIcon={<ShoppingCartIcon />}
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ flexGrow: 1 }}
                    onClick={() => handleOpenPurchaseDialog(item)}
                  >
                    Buy Now
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No products found matching your criteria.
          </Typography>
        </Box>
      )}

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialog}
        onClose={handleClosePurchaseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Confirm Purchase
            <IconButton onClick={handleClosePurchaseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.name}
                {selectedItem.specifications?.variety && ` - ${selectedItem.specifications.variety}`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Available: {selectedItem.quantity.available} {selectedItem.quantity.unit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Price: ₹{selectedItem.price.value}/{selectedItem.price.unit}
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                Total: ₹{(selectedItem.price.value * selectedItem.quantity.available).toLocaleString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Location: {selectedItem.location?.address?.city}, {selectedItem.location?.address?.state}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quality: {getQualityLabel(selectedItem)}
              </Typography>
              {selectedItem.harvestDate && (
                <Typography variant="body2" color="text.secondary">
                  Harvest Date: {new Date(selectedItem.harvestDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchaseDialog}>Cancel</Button>
          <Button 
            onClick={handlePurchase}
            variant="contained"
            color="success"
            startIcon={<ShoppingCartIcon />}
          >
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerMarketplace;