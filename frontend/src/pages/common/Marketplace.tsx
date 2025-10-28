import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Tabs,
  Tab,
  CircularProgress,
  Alert,
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
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

import { RootState } from '../../store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Define types
interface MarketplaceItem {
  _id: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  sellerRating: number;
  location: string;
  harvestDate: Date;
  listedDate: Date;
  quality: string;
  description: string;
  image?: string;
  status: 'Available' | 'Sold' | 'Reserved';
  category: 'Grains' | 'Vegetables' | 'Fruits' | 'Herbs';
  userCropId?: string;
}

interface UserCrop {
  _id: string;
  name: string;
  variety: string;
  plantedArea: string;
  harvestDate: string;
  status: string;
  estimatedYield: number;
  unit: string;
}

interface ListingFormData {
  selectedCrop: UserCrop | null;
  quantity: string;
  pricePerUnit: string;
  quality: string;
  description: string;
  image: string;
}

const Marketplace: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [listingDialog, setListingDialog] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [userCrops, setUserCrops] = useState<UserCrop[]>([]);
  
  const [listingForm, setListingForm] = useState<ListingFormData>({
    selectedCrop: null,
    quantity: '',
    pricePerUnit: '',
    quality: 'Grade A',
    description: '',
    image: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch marketplace items
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/marketplace`);
        setItems(res.data.data || res.data);
        
        // Fetch user crops if user is a farmer
        if (user?.role === 'farmer') {
          const cropsRes = await axios.get(`${API_BASE_URL}/api/crops`);
          setUserCrops(cropsRes.data.data || cropsRes.data);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch marketplace items';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketplaceItems();
  }, [user]);
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.seller.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle purchase
  const handlePurchaseClick = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setPurchaseDialog(true);
  };
  
  // Handle purchase
  const handlePurchase = () => {
    if (selectedItem) {
      // In a real app, this would make an API call to purchase the item
      alert(`Successfully purchased ${selectedItem.quantity} ${selectedItem.unit} of ${selectedItem.cropName} from ${selectedItem.seller.name}!`);
      
      // Update item status
      setItems(prev => prev.map(item => 
        item._id === selectedItem._id 
          ? { ...item, status: 'Sold' } 
          : item
      ));
      
      setPurchaseDialog(false);
      setSelectedItem(null);
    }
  };
  
  // Handle list crop
  const handleListCropClick = () => {
    setListingDialog(true);
  };
  
  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setListingForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle crop selection
  const handleCropSelect = (e: any) => {
    const selected = userCrops.find(crop => crop._id === e.target.value);
    if (selected) {
      setListingForm(prev => ({
        ...prev,
        selectedCrop: selected,
        quantity: selected.estimatedYield.toString(),
        description: `Fresh ${selected.name} ${selected.variety} harvested from our farm`
      }));
    }
  };
  
  // Handle listing submission
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const listingData = {
        cropName: listingForm.selectedCrop?.name,
        variety: listingForm.selectedCrop?.variety,
        quantity: parseFloat(listingForm.quantity),
        unit: listingForm.selectedCrop?.unit || 'kg',
        pricePerUnit: parseFloat(listingForm.pricePerUnit),
        quality: listingForm.quality,
        description: listingForm.description,
        image: listingForm.image,
        status: 'Available',
        category: 'Grains', // This would be determined by the crop type
        userCropId: listingForm.selectedCrop?._id
      };
      
      const res = await axios.post(`${API_BASE_URL}/api/marketplace`, listingData);
      
      // Add new item to the list
      setItems(prev => [res.data.data, ...prev]);
      
      // Reset form and close dialog
      setListingForm({
        selectedCrop: null,
        quantity: '',
        pricePerUnit: '',
        quality: 'Grade A',
        description: '',
        image: ''
      });
      
      setListingDialog(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create listing';
      setError(errorMessage);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('marketplace.title')}
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={t('marketplace.browse')} />
        <Tab label={t('marketplace.myListings')} />
      </Tabs>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('marketplace.filters')}
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder={t('marketplace.searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>{t('marketplace.category')}</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as string)}
                  label={t('marketplace.category')}
                >
                  <MenuItem value="All">{t('marketplace.allCategories')}</MenuItem>
                  <MenuItem value="Grains">{t('marketplace.grains')}</MenuItem>
                  <MenuItem value="Vegetables">{t('marketplace.vegetables')}</MenuItem>
                  <MenuItem value="Fruits">{t('marketplace.fruits')}</MenuItem>
                  <MenuItem value="Herbs">{t('marketplace.herbs')}</MenuItem>
                </Select>
              </FormControl>
              
              {user?.role === 'farmer' && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleListCropClick}
                  sx={{ mt: 2 }}
                >
                  {t('marketplace.listCrop')}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card 
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={item.image || '/images/default-product.jpg'}
                    alt={item.cropName}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {item.cropName}
                      </Typography>
                      <IconButton aria-label="add to favorites" size="small">
                        {item.status === 'Sold' ? (
                          <FavoriteIcon color="disabled" />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.variety}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" color="primary">
                        ₹{item.pricePerUnit}/{item.unit}
                      </Typography>
                      <Chip 
                        label={item.quality} 
                        size="small" 
                        color={
                          item.quality === 'Premium' ? 'success' :
                          item.quality === 'Good' ? 'primary' : 'default'
                        } 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        {item.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        {item.seller.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating 
                        value={item.sellerRating} 
                        readOnly 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Typography variant="body2" color="textSecondary">
                        ({item.sellerRating})
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary">
                      {new Date(item.harvestDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      component={RouterLink}
                      to={`/marketplace/${item._id}`}
                    >
                      {t('marketplace.viewDetails')}
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      disabled={item.status === 'Sold'}
                      onClick={() => handlePurchaseClick(item)}
                    >
                      {item.status === 'Sold' ? t('marketplace.soldOut') : t('marketplace.purchase')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      
      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onClose={() => setPurchaseDialog(false)}>
        <DialogTitle>
          {t('marketplace.purchaseItem')}
          <IconButton
            aria-label="close"
            onClick={() => setPurchaseDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.cropName} ({selectedItem.variety})
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {t('marketplace.seller')}: {selectedItem.seller.name}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {t('marketplace.quantity')}: {selectedItem.quantity} {selectedItem.unit}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {t('marketplace.price')}: ₹{selectedItem.totalPrice}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                {t('marketplace.quality')}: {selectedItem.quality}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                {selectedItem.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPurchaseDialog(false)} color="primary">
            {t('marketplace.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handlePurchase}
            startIcon={<ShoppingCartIcon />}
          >
            {t('marketplace.confirmPurchase')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Listing Dialog */}
      <Dialog open={listingDialog} onClose={() => setListingDialog(false)}>
        <DialogTitle>
          {t('marketplace.listNewCrop')}
          <IconButton
            aria-label="close"
            onClick={() => setListingDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleListingSubmit}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>{t('marketplace.selectCrop')}</InputLabel>
              <Select
                value={listingForm.selectedCrop?._id || ''}
                onChange={handleCropSelect}
                label={t('marketplace.selectCrop')}
              >
                {userCrops.map(crop => (
                  <MenuItem key={crop._id} value={crop._id}>
                    {crop.name} ({crop.variety})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('marketplace.quantity')}
              name="quantity"
              value={listingForm.quantity}
              onChange={handleFormChange}
              type="number"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('marketplace.pricePerUnit')}
              name="pricePerUnit"
              value={listingForm.pricePerUnit}
              onChange={handleFormChange}
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>{t('marketplace.quality')}</InputLabel>
              <Select
                value={listingForm.quality}
                onChange={(e) => setListingForm(prev => ({ ...prev, quality: e.target.value as string }))}
                label={t('marketplace.quality')}
              >
                <MenuItem value="Premium">{t('marketplace.premium')}</MenuItem>
                <MenuItem value="Grade A">{t('marketplace.gradeA')}</MenuItem>
                <MenuItem value="Grade B">{t('marketplace.gradeB')}</MenuItem>
                <MenuItem value="Standard">{t('marketplace.standard')}</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('marketplace.description')}
              name="description"
              value={listingForm.description}
              onChange={handleFormChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('marketplace.imageURL')}
              name="image"
              value={listingForm.image}
              onChange={handleFormChange}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setListingDialog(false)} color="primary">
            {t('marketplace.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleListingSubmit}
            startIcon={<AttachMoneyIcon />}
          >
            {t('marketplace.createListing')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Marketplace;