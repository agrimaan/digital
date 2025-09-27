const User = require('../models/User');

/**
 * Get all users
 * @returns {Promise<Array>} Array of users
 */
exports.getAllUsers = async () => {
  return await User.find().select('-password');
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User object
 */
exports.getUserById = async (id) => {
  return await User.findById(id).select('-password');
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User object
 */
exports.getUserByEmail = async (email) => {
  return await User.findOne({ email }).select('-password');
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
exports.createUser = async (userData) => {
  return await User.create(userData);
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
exports.updateUser = async (id, updateData) => {
  return await User.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).select('-password');
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    return false;
  }
  await user.remove();
  return true;
};

/**
 * Check if user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
exports.userExistsByEmail = async (email) => {
  const user = await User.findOne({ email });
  return !!user;
};

/**
 * Authenticate user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} User object or null
 */
exports.authenticateUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return null;
  }
  
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    return null;
  }
  
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  };
};