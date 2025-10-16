const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// --- INTERNAL ADMIN ROUTES (used by admin-service) ---
const {
  listInternal,
  getInternal,
  deleteInternal,
  searchInternal,
} = require('../controllers/adminInternalUsersController');

console.log("Loading internalUsersRoute.js");

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-user'));

// GET /api/internal/users?page=&limit=&search=&role=&sort=
router.get('/', listInternal);

// GET /api/internal/users/search?q=
router.get('/search', searchInternal);

// GET /api/internal/users/recent?limit=5
router.get('/recent', async (req, res) => {
  try {
    console.log("Fetching recent users");
    const limit = Math.max(parseInt(req.query.limit || '5', 10), 1);
    const docs = await User.find({}, '-passwordHash').sort('-createdAt').limit(limit);
    res.json({ 
      users: docs.map(doc => ({
        ...doc.toObject(),
        name: doc.firstName && doc.lastName ? `${doc.firstName} ${doc.lastName}` : (doc.firstName || doc.lastName),
      }))
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ message: 'Error fetching recent users' });
  }
});

// GET /api/internal/users/:id
router.get('/:id', getInternal);

// DELETE /api/internal/users/:id
router.delete('/:id', deleteInternal);

module.exports = router;