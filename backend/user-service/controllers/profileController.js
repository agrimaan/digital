
const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const responseHandler = require('../utils/responseHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @desc    Upload profile image
// @route   POST /api/users/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return responseHandler.badRequest(res, 'Base64 image is required');
    }

    // Save base64 string directly into DB
    const user = await userService.updateUser(req.user.id, {
      profileImage: image
    });

    return responseHandler.success(
      res,
      200,
      { profileImage: user.profileImage },
      'Profile image updated successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, 'Error uploading profile image', error);
  }
};

// @desc    Get user profile with stats
// @route   GET /api/users/profile/stats
// @access  Private
exports.getProfileWithStats = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      return responseHandler.notFound(res, 'User not found');
    }

    // In a real application, you would fetch these stats from respective services
    // For now, we'll return placeholder data
    const stats = {
      fields: 0,
      crops: 0,
      sensors: 0,
      listings: 0,
      orders: 0
    };

    return responseHandler.success(res, 200, {
      user,
      stats
    }, 'Profile with stats retrieved successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving profile stats', error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { notifications, language, timezone } = req.body;

    const updateData = {
      preferences: {
        notifications,
        language,
        timezone
      }
    };

    const user = await userService.updateUser(req.user.id, updateData);

    return responseHandler.success(res, 200, user, 'Preferences updated successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error updating preferences', error);
  }
};

module.exports = exports;
