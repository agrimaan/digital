const express = require('express');
const router = express.Router();
const { 
  uploadProfileImage, 
  getProfileWithStats,
  updatePreferences 
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   POST /api/users/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', uploadProfileImage);

// @route   GET /api/users/profile/stats
// @desc    Get user profile with statistics
// @access  Private
router.get('/profile/stats', getProfileWithStats);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', updatePreferences);

module.exports = router;