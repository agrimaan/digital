const Cart = require('../models/Cart');
const responseHandler = require('../utils/responseHandler');

// @desc    Get buyer's cart
// @route   GET /api/marketplace/cart
// @access  Private (Buyer)
exports.getCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    let cart = await Cart.findOne({ buyer: buyerId });
    
    // Create empty cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({ buyer: buyerId, items: [] });
    }
    
    return responseHandler.success(res, 200, cart, 'Cart retrieved successfully');
  } catch (error) {
    console.error('Error getting cart:', error);
    return responseHandler.error(res, 500, 'Error retrieving cart', error);
  }
};

// @desc    Add item to cart
// @route   POST /api/marketplace/cart/items
// @access  Private (Buyer)
exports.addToCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { 
      listing, 
      cropName, 
      variety, 
      quantity, 
      unit, 
      pricePerUnit, 
      seller,
      sellerName,
      images,
      farmLocation
    } = req.body;
    
    console.log('Add to cart request body:', req.body);
    // Validate required fields
    if (!listing || !cropName || !quantity || !unit || !pricePerUnit || !seller) {
      return responseHandler.error(res, 400, 'Missing required fields');
    }
    

      // PURCHASE RESTRICTION: Prevent users from buying their own products
      if (seller === buyerId) {
        return responseHandler.error(res, 403, 'You cannot buy your own products');
      }
    // Find or create cart
    let cart = await Cart.findOne({ buyer: buyerId });
    
    if (!cart) {
      cart = new Cart({ buyer: buyerId, items: [] });
    }
    
    // Prepare item data
    const itemData = {
      listing,
      cropName,
      variety,
      quantity,
      unit,
      pricePerUnit,
      totalPrice: quantity * pricePerUnit,
      seller,
      sellerName,
      images,
      farmLocation
    };
    
    // Add item to cart
    await cart.addItem(itemData);
    
    return responseHandler.success(res, 200, cart, 'Item added to cart successfully');
  } catch (error) {
    console.error('Error adding to cart:', error);
    return responseHandler.error(res, 500, 'Error adding item to cart', error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/marketplace/cart/items/:listingId
// @access  Private (Buyer)
exports.updateCartItem = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listingId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return responseHandler.error(res, 400, 'Invalid quantity');
    }
    
    const cart = await Cart.findOne({ buyer: buyerId });
    
    if (!cart) {
      return responseHandler.error(res, 404, 'Cart not found');
    }
    
    await cart.updateItemQuantity(listingId, quantity);
    
    return responseHandler.success(res, 200, cart, 'Cart item updated successfully');
  } catch (error) {
    console.error('Error updating cart item:', error);
    return responseHandler.error(res, 500, 'Error updating cart item', error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/marketplace/cart/items/:listingId
// @access  Private (Buyer)
exports.removeFromCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listingId } = req.params;
    
    const cart = await Cart.findOne({ buyer: buyerId });
    
    if (!cart) {
      return responseHandler.error(res, 404, 'Cart not found');
    }
    
    await cart.removeItem(listingId);
    
    return responseHandler.success(res, 200, cart, 'Item removed from cart successfully');
  } catch (error) {
    console.error('Error removing from cart:', error);
    return responseHandler.error(res, 500, 'Error removing item from cart', error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/marketplace/cart
// @access  Private (Buyer)
exports.clearCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const cart = await Cart.findOne({ buyer: buyerId });
    
    if (!cart) {
      return responseHandler.error(res, 404, 'Cart not found');
    }
    
    await cart.clearCart();
    
    return responseHandler.success(res, 200, cart, 'Cart cleared successfully');
  } catch (error) {
    console.error('Error clearing cart:', error);
    return responseHandler.error(res, 500, 'Error clearing cart', error);
  }
};

// @desc    Get cart item count
// @route   GET /api/marketplace/cart/count
// @access  Private (Buyer)
exports.getCartCount = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const cart = await Cart.findOne({ buyer: buyerId });
    
    const count = cart ? cart.itemCount : 0;
    
    return responseHandler.success(res, 200, { count }, 'Cart count retrieved successfully');
  } catch (error) {
    console.error('Error getting cart count:', error);
    return responseHandler.error(res, 500, 'Error retrieving cart count', error);
  }
};

module.exports = exports;