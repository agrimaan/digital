const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bulkUploadService = require('../services/bulkUploadService');
const { BulkUpload } = require('../models/BulkUpload');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bulk-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

/**
 * @desc    Get all bulk uploads
 * @route   GET /api/admin/bulk-uploads
 * @access  Private/Admin
 */
exports.getBulkUploads = async (req, res) => {
  try {
    const options = {
      uploadType: req.query.uploadType,
      status: req.query.status,
      limit: parseInt(req.query.limit) || 50,
      skip: parseInt(req.query.skip) || 0
    };

    const uploads = await bulkUploadService.getAllBulkUploads(options);

    res.json({
      success: true,
      data: uploads,
      count: uploads.length
    });
  } catch (err) {
    console.error('Error fetching bulk uploads:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get bulk upload by ID
 * @route   GET /api/admin/bulk-uploads/:id
 * @access  Private/Admin
 */
exports.getBulkUploadById = async (req, res) => {
  try {
    const upload = await bulkUploadService.getBulkUploadById(req.params.id);

    res.json({
      success: true,
      data: upload
    });
  } catch (err) {
    console.error('Error fetching bulk upload:', err.message);
    if (err.message === 'Bulk upload not found') {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create new bulk upload
 * @route   POST /api/admin/bulk-uploads
 * @access  Private/Admin
 */
exports.createBulkUpload = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file
    const validation = bulkUploadService.validateFile(req.file);
    if (!validation.valid) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors
      });
    }

    // Parse file based on type
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let parsedData;
    
    try {
      if (fileExtension === '.csv') {
        parsedData = await bulkUploadService.parseCSV(req.file.path);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        parsedData = await bulkUploadService.parseExcel(req.file.path);
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format'
        });
      }
    } catch (parseError) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File parsing failed',
        error: parseError.message
      });
    }

    // Check if any data was parsed
    if (!parsedData.data || parsedData.data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid data found in file'
      });
    }

    // Create bulk upload record
    const uploadId = uuidv4();
    const upload = new BulkUpload({
      uploadId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: fileExtension.substring(1), // Remove the dot
      fileSize: req.file.size,
      uploadType: req.body.uploadType || 'users',
      uploadedBy: req.user.id,
      totalRecords: parsedData.data.length,
      status: 'uploading'
    });

    await upload.save();

    // Start background processing
    setImmediate(async () => {
      try {
        await bulkUploadService.processBulkUpload(uploadId, upload.uploadType, parsedData.data);
      } catch (processError) {
        console.error('Background processing error:', processError.message);
      } finally {
        // Clean up uploaded file
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError.message);
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        uploadId: upload.uploadId,
        filename: upload.originalName,
        uploadType: upload.uploadType,
        totalRecords: upload.totalRecords,
        status: upload.status,
        createdAt: upload.createdAt
      },
      message: 'Bulk upload created successfully. Processing will continue in the background.'
    });

  } catch (err) {
    console.error('Error creating bulk upload:', err.message);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get bulk upload statistics
 * @route   GET /api/admin/bulk-upload-stats
 * @access  Private/Admin
 */
exports.getBulkUploadStats = async (req, res) => {
  try {
    const stats = await bulkUploadService.getBulkUploadStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching bulk upload stats:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

// Export multer upload middleware for use in routes
exports.upload = upload.single('file');
