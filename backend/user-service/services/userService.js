
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

/**
 * Get user statistics for admin dashboard
 * @returns {Promise<Object>} User statistics
 */
exports.getUserStats = async () => {
  const totalUsers = await User.countDocuments();
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Format the usersByRole object
  const roleCounts = {
    farmers: 0,
    buyers: 0,
    agronomists: 0,
    investors: 0,
    admins: 0
  };

  usersByRole.forEach(role => {
    if (roleCounts.hasOwnProperty(role._id)) {
      roleCounts[role._id] = role.count;
    }
  });

  return {
    totalUsers,
    usersByRole: roleCounts
  };
};

/**
 * Get recent users for admin dashboard
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} Recent users
 */
exports.getRecentUsers = async (limit = 5) => {
  return await User
    .find()
    .select('_id firstName lastName email role createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Get verification statistics
 * @returns {Promise<Object>} Verification statistics
 */
exports.getVerificationStats = async () => {
  const totalUsers = await User.countDocuments();
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const unverifiedUsers = totalUsers - verifiedUsers;
  
  // Note: Land token and bulk upload stats would come from their respective services
  // For now, returning user verification stats only
  return {
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    pendingLandTokens: 0,  // Would come from blockchain-service
    pendingBulkUploads: 0  // Would come from admin-service
  };
};

/**
 * Get pending verifications
 * @returns {Promise<Object>} Pending verifications
 */
exports.getPendingVerifications = async () => {
  const unverifiedUsers = await User
    .find({ isVerified: false })
    .select('_id firstName lastName email role createdAt isVerified')
    .sort({ createdAt: -1 });

  // Note: Land token and bulk upload pending items would come from their respective services
  return {
    pendingUsers: unverifiedUsers,
    pendingLandTokens: [],  // Would come from blockchain-service
    pendingBulkUploads: []  // Would come from admin-service
  };
};
