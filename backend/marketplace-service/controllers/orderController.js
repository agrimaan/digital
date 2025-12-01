const { validationResult } = require('express-validator');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    // Only admin can get all orders
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access all orders');
    }
    
    // Apply filters if provided in query params
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    
    const orders = await orderService.getAllOrders(filter);
    console.log("orders within getOrders of marketplace-service/orderController:", orders);
    return responseHandler.success(res, 200, orders, 'Orders retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving orders', error);
  }
};

// @desc    Get recent orders
// @route   GET /api/orders/recent
// @access  Private/Admin
exports.getRecentOrders = async (req, res) => {
  try {
    // Only admin can get all orders
    if (req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access all orders');
    }
     
    const orders = await orderService.getRecentOrders(req.query.limit);
    
    return responseHandler.success(res, 200, orders, 'Recent Orders retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving orders', error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return responseHandler.notFound(res, 'Order not found');
    }

    // Check if user is buyer, seller, or admin
    if (order.buyer !== req.user.id && order.seller !== req.user.id && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to access this order');
    }

    return responseHandler.success(res, 200, order, 'Order retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving order', error);
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    // Set buyer to current user
    const orderData = {
      ...req.body,
      buyer: req.user.id
    };
    
    // Validate and prepare order items
    const items = [];
    let totalAmount = 0;
    
    for (const item of orderData.items) {
      const product = await productService.getProductById(item.product);
      
      if (!product) {
        return responseHandler.badRequest(res, `Product ${item.product} not found`);
      }
      
      if (!product.isActive) {
        return responseHandler.badRequest(res, `Product ${product.name} is not available`);
      }
      
      if (product.quantity.available < item.quantity) {
        return responseHandler.badRequest(res, `Insufficient quantity available for ${product.name}`);
      }

        // PURCHASE RESTRICTION: Prevent users from buying their own products
        if (product.seller === req.user.id) {
          return responseHandler.error(res, 403, `You cannot buy your own product: ${product.name}`);
        }
      
      const totalPrice = product.price.value * item.quantity;
      
      items.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        unit: product.quantity.unit,
        price: product.price.value,
        totalPrice
      });
      
      totalAmount += totalPrice;
    }
    
    // Use the first product's seller as the order seller
    if (!orderData.seller && items.length > 0) {
      const firstProduct = await productService.getProductById(items[0].product);
      orderData.seller = firstProduct.seller;
    }
    
    // Update order data
    orderData.items = items;
    orderData.totalAmount = totalAmount;
    orderData.currency = req.body.currency || 'INR';
    
    // Create order
    const order = await orderService.createOrder(orderData);
    
    return responseHandler.success(res, 201, order, 'Order created successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error creating order', error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const { status, comment } = req.body;
    
    if (!status) {
      return responseHandler.badRequest(res, 'Status is required');
    }
    
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return responseHandler.notFound(res, 'Order not found');
    }

    // Check permissions based on status change
    if (status === 'cancelled') {
      // Buyer can cancel if order is pending or confirmed
      // Seller can cancel if order is pending, confirmed, or processing
      // Admin can cancel any order
      if (
        req.user.id === order.buyer && !['pending', 'confirmed'].includes(order.status) ||
        req.user.id === order.seller && !['pending', 'confirmed', 'processing'].includes(order.status) ||
        req.user.role !== 'admin' && req.user.id !== order.buyer && req.user.id !== order.seller
      ) {
        return responseHandler.forbidden(res, 'Not authorized to cancel this order');
      }
    } else if (['confirmed', 'processing', 'shipped'].includes(status)) {
      // Only seller or admin can update to these statuses
      if (req.user.id !== order.seller && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Not authorized to update this order status');
      }
    } else if (status === 'delivered') {
      // Only buyer, seller, or admin can mark as delivered
      if (req.user.id !== order.buyer && req.user.id !== order.seller && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Not authorized to mark this order as delivered');
      }
    } else if (status === 'refunded') {
      // Only seller or admin can refund
      if (req.user.id !== order.seller && req.user.role !== 'admin') {
        return responseHandler.forbidden(res, 'Not authorized to refund this order');
      }
    }

    // Update order status
    const updatedOrder = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.id,
      comment
    );
    
    return responseHandler.success(res, 200, updatedOrder, 'Order status updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating order status', error);
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const { paymentStatus, paymentDetails } = req.body;
    
    if (!paymentStatus) {
      return responseHandler.badRequest(res, 'Payment status is required');
    }
    
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return responseHandler.notFound(res, 'Order not found');
    }

    // Only buyer, seller, or admin can update payment status
    if (req.user.id !== order.buyer && req.user.id !== order.seller && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update payment status');
    }

    // Update payment status
    const updatedOrder = await orderService.updatePaymentStatus(
      req.params.id,
      paymentStatus,
      paymentDetails
    );
    
    return responseHandler.success(res, 200, updatedOrder, 'Payment status updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating payment status', error);
  }
};

// @desc    Update shipment details
// @route   PUT /api/orders/:id/shipment
// @access  Private
exports.updateShipmentDetails = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return responseHandler.notFound(res, 'Order not found');
    }

    // Only seller or admin can update shipment details
    if (req.user.id !== order.seller && req.user.role !== 'admin') {
      return responseHandler.forbidden(res, 'Not authorized to update shipment details');
    }

    // Update shipment details
    const updatedOrder = await orderService.updateShipmentDetails(
      req.params.id,
      req.body
    );
    
    return responseHandler.success(res, 200, updatedOrder, 'Shipment details updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating shipment details', error);
  }
};

// @desc    Get orders by buyer
// @route   GET /api/orders/buyer
// @access  Private
exports.getOrdersByBuyer = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByBuyer(req.user.id);
    
    return responseHandler.success(res, 200, orders, 'Orders retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving orders', error);
  }
};

// @desc    Get orders by seller
// @route   GET /api/orders/seller
// @access  Private
exports.getOrdersBySeller = async (req, res) => {
  try {
    const orders = await orderService.getOrdersBySeller(req.user.id);
    
    return responseHandler.success(res, 200, orders, 'Orders retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving orders', error);
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/statistics
// @access  Private
exports.getOrderStatistics = async (req, res) => {
  try {
    // Determine role (buyer or seller)
    const role = req.query.role === 'seller' ? 'seller' : 'buyer';
    
    const statistics = await orderService.getOrderStatistics(req.user.id, role);
    
    return responseHandler.success(res, 200, statistics, 'Order statistics retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving order statistics', error);
  }
};