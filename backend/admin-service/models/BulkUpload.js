const mongoose = require('mongoose');

// Bulk Upload Record Schema (individual records within an upload)
const bulkUploadRecordSchema = new mongoose.Schema({
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkUpload',
    required: true
  },
  rowNumber: {
    type: Number,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error', 'skipped'],
    default: 'pending'
  },
  errorMessage: String,
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bulk Upload Schema
const bulkUploadSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'xlsx', 'xls'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadType: {
    type: String,
    enum: ['users', 'fields', 'crops', 'sensors', 'land_tokens'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'uploading'
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  successfulRecords: {
    type: Number,
    default: 0
  },
  failedRecords: {
    type: Number,
    default: 0
  },
  errors: [{
    row: Number,
    error: String,
    data: mongoose.Schema.Types.Mixed
  }],
  processingLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    level: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    }
  }],
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const BulkUpload = mongoose.model('BulkUpload', bulkUploadSchema);
const BulkUploadRecord = mongoose.model('BulkUploadRecord', bulkUploadRecordSchema);

module.exports = {
  BulkUpload,
  BulkUploadRecord
};
