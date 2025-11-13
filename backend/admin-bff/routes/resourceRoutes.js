const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Apply authentication and authorization to all routes
router.use(authenticate);
router.use(authorizeAdmin);

// Resource routes
router.route('/')
  .get(getResources)
  .post(createResource);

router.route('/:id')
  .get(getResourceById)
  .put(updateResource)
  .delete(deleteResource);

module.exports = router;