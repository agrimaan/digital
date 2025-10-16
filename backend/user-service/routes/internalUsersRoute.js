const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Validation middleware


  // --- INTERNAL ADMIN ROUTES (used by admin-service) ---
  const {
    listInternal,
    getInternal,
    deleteInternal,
    searchInternal,
  } = require('../controllers/adminInternalUsersController');
  
 
  // Put these *after* your public routes:
  const internalRouter = express.Router();
// mount under /internal
router.use('/internal', internalRouter);

  console.log("checking internalUserRoutes.js");
  internalRouter
  .route('/')
  .get(protect, authorize('admin','super-user'), listInternal);

  internalRouter
  .route('/search')
  .get(protect, authorize('admin','super-user'), searchInternal);

  internalRouter
  .route('/:id')
  .get(protect, authorize('admin','super-user'), getInternal)
  .delete(protect, authorize('admin','super-user'), deleteInternal);


// Only admins (or super-user) should access internal endpoints
//internalRouter.get('/', protect, authorize('admin', 'super-user'), listInternal);
//internalRouter.get('/search', protect, authorize('admin', 'super-user'), searchInternal);

//internalRouter.get('/:id', protect, authorize('admin', 'super-user'), getInternal);

//internalRouter.delete('/:id', protect, authorize('admin', 'super-user'), deleteInternal);

// GET /internal/users/recent?limit=5
internalRouter.get('/recent', protect, authorize('admin','super-user'), async (req, res) => {
    console.log("checking internalRouter /recent");

    const limit = Math.max(parseInt(req.query.limit || '5', 10), 1);
    const docs = await User.find({}, '-passwordHash').sort('-createdAt').limit(limit);
    res.json({ users: docs.map(doc => ({
      ...doc.toObject(),
      name: doc.firstName && doc.lastName ? `${doc.firstName} ${doc.lastName}` : (doc.firstName || doc.lastName),
    }))});
  });

  




module.exports = router;