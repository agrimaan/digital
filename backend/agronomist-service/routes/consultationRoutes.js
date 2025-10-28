const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  deleteConsultation
} = require('../controllers/consultationController');
const { protect, authorize } = require('@agrimaan/shared').middleware;

// Validation middleware
const validateConsultationCreation = [
  check('farmerId', 'Farmer ID is required').not().isEmpty(),
  check('agronomistId', 'Agronomist ID is required').not().isEmpty(),
  check('fieldId', 'Field ID is required').not().isEmpty(),
  check('title', 'Consultation title is required').not().isEmpty(),
  check('description', 'Consultation description is required').not().isEmpty(),
  check('consultationType', 'Consultation type is required').not().isEmpty(),
  check('consultationType', 'Consultation type must be one of: field-analysis, crop-issue, soil-testing, weather-advisory, general-advice')
    .isIn(['field-analysis', 'crop-issue', 'soil-testing', 'weather-advisory', 'general-advice']),
  check('scheduledAt', 'Scheduled time is required').not().isEmpty()
];

const validateConsultationUpdate = [
  check('title', 'Consultation title must not be empty if provided').optional().not().isEmpty(),
  check('description', 'Consultation description must not be empty if provided').optional().not().isEmpty(),
  check('consultationType', 'Consultation type must be valid if provided')
    .optional()
    .isIn(['field-analysis', 'crop-issue', 'soil-testing', 'weather-advisory', 'general-advice']),
  check('status', 'Status must be valid if provided')
    .optional()
    .isIn(['scheduled', 'in-progress', 'completed', 'cancelled'])
];

// Routes
router
  .route('/')
  .get(protect, getConsultations)
  .post(protect, validateConsultationCreation, createConsultation);

router
  .route('/:id')
  .get(protect, getConsultation)
  .put(protect, validateConsultationUpdate, updateConsultation)
  .delete(protect, deleteConsultation);

module.exports = router;