
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
exports.uploadProfileImage = [
  upload.single('profileImage'),
  async (req, res) => {
    try {
      if (req.fileValidationError) {
        return responseHandler.badRequest(res, req.fileValidationError);
      }

      if (!req.file) {
        return responseHandler.badRequest(res, 'Please upload an image file');
      }

      // Get the file path relative to the server
      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      // Update user profile with new image URL
      const user = await userService.updateUser(req.user.id, {
        profileImage: imageUrl
      });

      // Delete old profile image if it exists and is not the default
      if (user.profileImage && user.profileImage !== 'default-avatar.jpg' && user.profileImage !== imageUrl) {
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      return responseHandler.success(res, 200, {
        imageUrl: imageUrl
      }, 'Profile image uploaded successfully');
    } catch (error) {
      // Delete uploaded file if there's an error
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return responseHandler.error(res, 500, 'Error uploading profile image', error);
    }
  }
];

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
