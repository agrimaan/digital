import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Avatar,
  IconButton,
  Badge,
  CircularProgress,
  Alert, 
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  LocalGroceryStore as LocalGroceryStoreIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getMarketplaceItems } from '../../features/marketplace/marketplaceSlice';

interface BuyerStats {
  totalOrders: number;
  activeOrders: number;
  savedItems: number;
  totalSpent: number;
}

interface Product {
  _id: string;
  cropName: string;
  variety: string;
  pricePerUnit: number;
  image: string;
  seller: { name: string } | string;
  location: string;
  quality: 'Premium' | 'Good' | string;
  category: string;
}

const BuyerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items: marketplaceItems, loading, error } = useSelector(
    (state: RootState) => state.marketplace
  );

  const [stats] = useState<BuyerStats>({
    totalOrders: 0,
    activeOrders: 0,
    savedItems: 0,
    totalSpent: 0,
  });

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // ✅ pass an empty object so the thunk’s arg requirement is satisfied
    dispatch(getMarketplaceItems({}));
  }, [dispatch]);

  useEffect(() => {
    if (marketplaceItems && marketplaceItems.length > 0) {
      setFeaturedProducts(marketplaceItems.slice(0, 4) as Product[]);
    } else {
      setFeaturedProducts([]);
    }
  }, [marketplaceItems]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('buyerDashboard.welcome')}</Typography>
        <IconButton color="inherit">
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('buyerDashboard.totalOrders')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <LocalGroceryStoreIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('buyerDashboard.activeOrders')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats.activeOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <FavoriteIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('buyerDashboard.savedItems')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                {stats.savedItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography color="textSecondary" gutterBottom>
                  {t('buyerDashboard.totalSpent')}
                </Typography>
              </Box>
              <Typography variant="h5" component="h2">
                ₹{stats.totalSpent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Featured Products */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            {t('buyerDashboard.featuredProducts')}
          </Typography>
        </Grid>

        {featuredProducts.map((product) => {
          const sellerName =
            typeof product.seller === 'string' ? product.seller : product.seller?.name || 'Unknown Seller';

          return (
            <Grid item xs={12} sm={6} md={3} key={product._id}>
              <Card
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => navigate(`/buyer/marketplace/${product._id}`)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={product.image || '/images/default-product.jpg'}
                  alt={product.cropName}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {product.cropName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {product.variety}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="h6" color="primary">
                      ₹{product.pricePerUnit}/kg
                    </Typography>
                    <Chip
                      label={product.quality}
                      size="small"
                      color={
                        product.quality === 'Premium' ? 'success' : product.quality === 'Good' ? 'primary' : 'default'
                      }
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      {product.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <StarIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      {sellerName}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate('/buyer/marketplace')}>
          {t('buyerDashboard.browseMarketplace')}
        </Button>
      </Box>
    </Box>
  );
};

export default BuyerDashboard;
