const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getUsers, 
  getRecentUsers,
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
//const { protect, authorize } = require('../middleware/auth')
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateUserCreation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be one of: farmer, buyer, logistics, investor, agronomist, admin, supplier')
    .optional()
    .isIn(['farmer', 'buyer', 'logistics', 'investor', 'agronomist', 'admin'])
];

const validateUserUpdate = [
  check('firstName', 'First name must not be empty if provided').optional().not().isEmpty(),
  check('lastName', 'Last name must not be empty if provided').optional().not().isEmpty(),
  check('email', 'Please include a valid email if provided').optional().isEmail(),
  check('role', 'Role must be one of: farmer, buyer, logistics, investor, agronomist, admin, supplier')
    .optional()
    .isIn(['farmer', 'buyer', 'logistics', 'investor', 'agronomist', 'admin', 'supplier'])
];

  // Routes
router
.route('/')
.get(protect, authorize('admin'), getUsers)
.post(protect, authorize('admin','super-user'), validateUserCreation, createUser);

router
.route('/recent')
.get(protect, authorize('admin'), getRecentUsers);

router
.route('/:id')
.get(protect, getUser)
.put(protect, validateUserUpdate, updateUser)
.delete(protect, authorize('admin','super-user'), deleteUser);



module.exports = router;