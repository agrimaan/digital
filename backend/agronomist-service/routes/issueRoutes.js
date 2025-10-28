const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getCropIssues,
  getCropIssue,
  createCropIssue,
  updateCropIssue,
  deleteCropIssue
} = require('../controllers/issueController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateIssueCreation = [
  check('farmerId', 'Farmer ID is required').not().isEmpty(),
  check('fieldId', 'Field ID is required').not().isEmpty(),
  check('cropId', 'Crop ID is required').not().isEmpty(),
  check('title', 'Issue title is required').not().isEmpty(),
  check('description', 'Issue description is required').not().isEmpty(),
  check('issueType', 'Issue type is required').not().isEmpty(),
  check('issueType', 'Issue type must be one of: pest, disease, nutrient-deficiency, weather-damage, equipment-issue, other')
    .isIn(['pest', 'disease', 'nutrient-deficiency', 'weather-damage', 'equipment-issue', 'other'])
];

const validateIssueUpdate = [
  check('title', 'Issue title must not be empty if provided').optional().not().isEmpty(),
  check('description', 'Issue description must not be empty if provided').optional().not().isEmpty(),
  check('issueType', 'Issue type must be valid if provided')
    .optional()
    .isIn(['pest', 'disease', 'nutrient-deficiency', 'weather-damage', 'equipment-issue', 'other']),
  check('severity', 'Severity must be valid if provided')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['reported', 'under-review', 'in-progress', 'resolved', 'dismissed'])
];

// Routes
router
  .route('/')
  .get(protect, getCropIssues)
  .post(protect, authorize('farmer'), validateIssueCreation, createCropIssue);

router
  .route('/:id')
  .get(protect, getCropIssue)
  .put(protect, validateIssueUpdate, updateCropIssue)
  .delete(protect, authorize('farmer', 'admin'), deleteCropIssue);

module.exports = router;