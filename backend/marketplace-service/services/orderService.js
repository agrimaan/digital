const Order = require('../models/Order');
const Product = require('../models/Product');
const productService = require('./productService');

/**
 * Get all orders
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of orders
 */
exports.getAllOrders = async (filter = {}) => {
  return await Order.find(filter).populate('items.product');
};

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Order object
 */
exports.getOrderById = async (id) => {
  return await Order.findById(id).populate('items.product');
};

/**
 * Get order by order number
 * @param {string} orderNumber - Order number
 * @returns {Promise<Object>} Order object
 */
exports.getOrderByNumber = async (orderNumber) => {
  return await Order.findOne({ orderNumber }).populate('items.product');
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
exports.createOrder = async (orderData) => {
  // Calculate total amount if not provided
  if (!orderData.totalAmount) {
    orderData.totalAmount = orderData.items.reduce((total, item) => total + item.totalPrice, 0);
  }
  
  // Create order
  const order = await Order.create(orderData);
  
  // Update product quantities
  for (const item of orderData.items) {
    await productService.updateProductQuantity(item.product, -item.quantity);
  }
  
  return order;
};

/**
 * Update order
 * @param {string} id - Order ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated order
 */
exports.updateOrder = async (id, updateData) => {
  return await Order.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('items.product');
};

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status
 * @param {string} userId - User ID making the update
 * @param {string} comment - Comment for status change
 * @returns {Promise<Object>} Updated order
 */
exports.updateOrderStatus = async (id, status, userId, comment = '') => {
  const order = await Order.findById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Update status
  order.status = status;
  
  // Add status history entry
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    comment: comment || `Order status changed to ${status}`,
    updatedBy: userId
  });
  
  // If order is cancelled, restore product quantities
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      await productService.updateProductQuantity(item.product, item.quantity);
    }
  }
  
  return await order.save();
};

/**
 * Update payment status
 * @param {string} id - Order ID
 * @param {string} paymentStatus - New payment status
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} Updated order
 */
exports.updatePaymentStatus = async (id, paymentStatus, paymentDetails = {}) => {
  const order = await Order.findById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Update payment status
  order.paymentStatus = paymentStatus;
  
  // Update payment details if provided
  if (paymentDetails.transactionId) {
    order.paymentDetails.transactionId = paymentDetails.transactionId;
  }
  
  if (paymentDetails.paymentDate) {
    order.paymentDetails.paymentDate = paymentDetails.paymentDate;
  }
  
  if (paymentDetails.receiptUrl) {
    order.paymentDetails.receiptUrl = paymentDetails.receiptUrl;
  }
  
  // Add status history entry
  order.statusHistory.push({
    status: `payment_${paymentStatus}`,
    timestamp: new Date(),
    comment: `Payment status changed to ${paymentStatus}`
  });
  
  return await order.save();
};

/**
 * Update shipment details
 * @param {string} id - Order ID
 * @param {Object} shipmentDetails - Shipment details
 * @returns {Promise<Object>} Updated order
 */
exports.updateShipmentDetails = async (id, shipmentDetails) => {
  const order = await Order.findById(id);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Update shipment details
  order.shipment = {
    ...order.shipment,
    ...shipmentDetails
  };
  
  // If tracking number is provided, update status to shipped
  if (shipmentDetails.trackingNumber && order.status === 'processing') {
    order.status = 'shipped';
    
    // Add status history entry
    order.statusHistory.push({
      status: 'shipped',
      timestamp: new Date(),
      comment: `Order shipped with tracking number ${shipmentDetails.trackingNumber}`
    });
  }
  
  // If actual delivery date is provided, update status to delivered
  if (shipmentDetails.actualDelivery && order.status === 'shipped') {
    order.status = 'delivered';
    
    // Add status history entry
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      comment: `Order delivered on ${new Date(shipmentDetails.actualDelivery).toISOString().split('T')[0]}`
    });
  }
  
  return await order.save();
};

/**
 * Get orders by buyer
 * @param {string} buyerId - Buyer ID
 * @returns {Promise<Array>} Array of orders
 */
exports.getOrdersByBuyer = async (buyerId) => {
  return await Order.find({ buyer: buyerId }).populate('items.product');
};

/**
 * Get orders by seller
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Array>} Array of orders
 */
exports.getOrdersBySeller = async (sellerId) => {
  return await Order.find({ seller: sellerId }).populate('items.product');
};

/**
 * Get orders by status
 * @param {string} status - Order status
 * @returns {Promise<Array>} Array of orders
 */
exports.getOrdersByStatus = async (status) => {
  return await Order.find({ status }).populate('items.product');
};

/**
 * Get orders by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of orders
 */
exports.getOrdersByDateRange = async (startDate, endDate) => {
  return await Order.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('items.product');
};

/**
 * Calculate order statistics
 * @param {string} userId - User ID (buyer or seller)
 * @param {string} role - Role ('buyer' or 'seller')
 * @returns {Promise<Object>} Order statistics
 */
exports.getOrderStatistics = async (userId, role) => {
  const filter = role === 'buyer' ? { buyer: userId } : { seller: userId };
  const orders = await Order.find(filter);
  
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  const statusCounts = orders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, {});
  
  const paymentStatusCounts = orders.reduce((counts, order) => {
    counts[order.paymentStatus] = (counts[order.paymentStatus] || 0) + 1;
    return counts;
  }, {});
  
  return {
    totalOrders,
    totalAmount,
    statusCounts,
    paymentStatusCounts
  };
};