const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation middleware
const validateRegistration = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be one of: farmer, buyer, logistics, investor, agronomist, admin')
    .optional()
    .isIn(['farmer', 'buyer', 'logistics', 'investor', 'agronomist', 'admin'])
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

const validateForgotPassword = [
  check('email', 'Please include a valid email').isEmail()
];

const validateResetPassword = [
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

// Routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', validateForgotPassword, forgotPassword);
router.put('/resetpassword/:resettoken', validateResetPassword, resetPassword);

module.exports = router;