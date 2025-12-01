
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import orderService, { CreateOrderData, ShippingAddress } from '../../services/orderService';

const BuyerCart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading, error, updateQuantity, removeItem, clearCart, refreshCart } = useCart();
  
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    contactName: '',
    contactPhone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    refreshCart();
  }, []);

  // Calculate cart totals
  const cartTotal = cart?.totalAmount || 0;
  const shippingCost = cart && cart.items.length > 0 ? 250 : 0;
  const taxRate = 0.08;
  const taxAmount = cartTotal * taxRate;
  const orderTotal = cartTotal + shippingCost + taxAmount;

  // Handle quantity change
  const handleQuantityChange = async (listingId: string, change: number) => {
    const item = cart?.items.find(i => i.listing === listingId);
    if (!item) return;
    
    const newQuantity = Math.max(1, item.quantity + change);
    try {
      await updateQuantity(listingId, newQuantity);
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  // Handle remove item
  const handleRemoveItem = async (listingId: string) => {
    try {
      await removeItem(listingId);
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    setCheckoutDialog(true);
    setOrderError(null);
  };

  // Validate form
  const isFormValid = () => {
    return (
      shippingAddress.street &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.country &&
      shippingAddress.postalCode &&
      shippingAddress.contactName &&
      shippingAddress.contactPhone &&
      paymentMethod
    );
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setOrderError('Cart is empty');
      return;
    }

    if (!isFormValid()) {
      setOrderError('Please fill in all required fields');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);

      // Group items by seller
      const itemsBySeller = cart.items.reduce((acc, item) => {
        if (!acc[item.seller]) {
          acc[item.seller] = [];
        }
        acc[item.seller].push(item);
        return acc;
      }, {} as Record<string, typeof cart.items>);

      // Create separate orders for each seller
      const orderPromises = Object.entries(itemsBySeller).map(([seller, items]) => {
        const orderData: CreateOrderData = {
          seller,
          items: items.map(item => ({
            product: item.listing,
            name: `${item.cropName} - ${item.variety}`,
            quantity: item.quantity,
            unit: item.unit,
            price: item.pricePerUnit,
            totalPrice: item.totalPrice
          })),
          paymentMethod,
          shippingAddress,
          notes
        };
        
        return orderService.createOrder(orderData);
      });

      await Promise.all(orderPromises);
      
      // Clear cart after successful order
      await clearCart();
      
      setOrderSuccess(true);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/buyer/orders');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error placing order:', err);
      setOrderError(err.message || 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading && !cart) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        
        <Button
          component={RouterLink}
          to="/buyer/marketplace"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Continue Shopping
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!cart || cart.items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Looks like you haven't added any products to your cart yet.
          </Typography>
          <Button
            component={RouterLink}
            to="/buyer/marketplace"
            variant="contained"
            startIcon={<ShoppingCartIcon />}
          >
            Browse Marketplace
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.listing}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {item.images && item.images.length > 0 && (
                            <Box
                              component="img"
                              sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                              src={item.images[0]}
                              alt={item.cropName}
                            />
                          )}
                          <Box>
                            <Typography variant="body1">
                              {item.cropName} - {item.variety}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Seller: {item.sellerName || 'Agrimaan'}
                            </Typography>
                            {item.farmLocation && (
                              <Typography variant="caption" color="text.secondary">
                                {item.farmLocation.address?.village}, {item.farmLocation.address?.district}, {item.farmLocation.address?.state}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>₹{item.pricePerUnit}/{item.unit}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleQuantityChange(item.listing, -1)}
                            disabled={item.quantity <= 1 || loading}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleQuantityChange(item.listing, 1)}
                            disabled={loading}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">₹{item.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveItem(item.listing)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Subtotal</Typography>
                    <Typography variant="body1">₹{cartTotal.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Shipping</Typography>
                    <Typography variant="body1">₹{shippingCost.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Tax (8%)</Typography>
                    <Typography variant="body1">₹{taxAmount.toLocaleString()}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">₹{orderTotal.toLocaleString()}</Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleCheckout}
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Checkout Dialog */}
      <Dialog
        open={checkoutDialog}
        onClose={() => !orderLoading && setCheckoutDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          {orderSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Order placed successfully! Redirecting to orders page...
            </Alert>
          ) : (
            <>
              <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                Complete your order by providing shipping and payment information.
              </Typography>
              
              {orderError && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {orderError}
                </Alert>
              )}

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Shipping Address
              </Typography>
              
              <TextField
                label="Contact Name"
                fullWidth
                margin="normal"
                required
                value={shippingAddress.contactName}
                onChange={(e) => setShippingAddress({ ...shippingAddress, contactName: e.target.value })}
              />
              
              <TextField
                label="Contact Phone"
                fullWidth
                margin="normal"
                required
                value={shippingAddress.contactPhone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, contactPhone: e.target.value })}
              />
              
              <TextField
                label="Street Address"
                fullWidth
                margin="normal"
                required
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="City"
                    fullWidth
                    margin="normal"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="State"
                    fullWidth
                    margin="normal"
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Postal Code"
                    fullWidth
                    margin="normal"
                    required
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Country"
                    fullWidth
                    margin="normal"
                    required
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Payment Method
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="debit_card">Debit Card</MenuItem>
                  <MenuItem value="cash">Cash on Delivery</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Order Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for the seller..."
              />

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1">₹{cartTotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Shipping</Typography>
                  <Typography variant="body1">₹{shippingCost.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Tax (8%)</Typography>
                  <Typography variant="body1">₹{taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6">₹{orderTotal.toLocaleString()}</Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!orderSuccess && (
            <>
              <Button onClick={() => setCheckoutDialog(false)} disabled={orderLoading}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handlePlaceOrder}
                disabled={orderLoading || !isFormValid()}
              >
                {orderLoading ? <CircularProgress size={24} /> : 'Place Order'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerCart;
