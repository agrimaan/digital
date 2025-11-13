const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { BulkUpload, BulkUploadRecord } = require('../models/BulkUpload');
const User = require('../models/User');
const Field = require('../models/Field'); // We'll need to create this
const Crop = require('../models/Crop'); // We'll need to create this
const emailService = require('./emailService');

class BulkUploadService {
  constructor() {
    this.supportedFormats = ['.csv', '.xlsx', '.xls'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.batchSize = 100; // Process in batches
  }

  // Validate file format and size
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    return { valid: errors.length === 0, errors };
  }

  // Parse CSV file
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowIndex = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowIndex++;
          try {
            // Clean and validate data
            const cleanedData = this.cleanRowData(data, rowIndex);
            results.push(cleanedData);
          } catch (error) {
            errors.push({
              row: rowIndex,
              error: error.message,
              data: data
            });
          }
        })
        .on('end', () => {
          resolve({ data: results, errors });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  // Parse Excel file
  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const results = [];
      const errors = [];

      jsonData.forEach((row, index) => {
        try {
          const cleanedData = this.cleanRowData(row, index + 2); // +2 because Excel rows start from 1 and we skip header
          results.push(cleanedData);
        } catch (error) {
          errors.push({
            row: index + 2,
            error: error.message,
            data: row
          });
        }
      });

      return { data: results, errors };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  // Clean and validate row data
  cleanRowData(row, rowIndex) {
    const cleanedData = {};
    
    // Clean up keys and values
    Object.keys(row).forEach(key => {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      let value = row[key];
      
      // Clean value
      if (typeof value === 'string') {
        value = value.trim();
      }
      
      cleanedData[cleanKey] = value;
    });

    // Basic validation
    this.validateRowData(cleanedData, rowIndex);

    return cleanedData;
  }

  // Validate individual row data
  validateRowData(data, rowIndex) {
    // This will be extended based on upload type
    if (!data || Object.keys(data).length === 0) {
      throw new Error(`Row ${rowIndex}: Empty row data`);
    }
  }

  // Process bulk upload based on type
  async processBulkUpload(uploadId, uploadType, records) {
    const upload = await BulkUpload.findOne({ uploadId });
    if (!upload) {
      throw new Error('Upload not found');
    }

    try {
      upload.status = 'processing';
      upload.startedAt = new Date();
      upload.totalRecords = records.length;
      await upload.save();

      let processedRecords = 0;
      let successfulRecords = 0;
      let failedRecords = 0;
      const errors = [];

      // Process in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        
        try {
          const batchResults = await this.processBatch(uploadId, uploadType, batch, i + 1);
          
          processedRecords += batchResults.processed;
          successfulRecords += batchResults.successful;
          failedRecords += batchResults.failed;
          
          if (batchResults.errors.length > 0) {
            errors.push(...batchResults.errors);
          }

          // Update progress
          upload.processedRecords = processedRecords;
          upload.successfulRecords = successfulRecords;
          upload.failedRecords = failedRecords;
          upload.errors = errors.slice(0, 100); // Keep only first 100 errors
          await upload.save();

        } catch (batchError) {
          console.error(`Batch processing error: ${batchError.message}`);
          failedRecords += batch.length;
          errors.push({
            row: i + 1,
            error: `Batch processing failed: ${batchError.message}`,
            data: null
          });
        }
      }

      // Finalize upload
      upload.status = failedRecords > 0 ? 'completed' : 'completed';
      upload.completedAt = new Date();
      upload.processedRecords = processedRecords;
      upload.successfulRecords = successfulRecords;
      upload.failedRecords = failedRecords;
      upload.errors = errors.slice(0, 100);
      
      await upload.save();

      // Send notification email
      try {
        await this.sendCompletionEmail(upload);
      } catch (emailError) {
        console.error(`Failed to send completion email: ${emailError.message}`);
      }

      return upload;

    } catch (error) {
      upload.status = 'failed';
      upload.completedAt = new Date();
      upload.errors = [{ row: 0, error: error.message, data: null }];
      await upload.save();
      throw error;
    }
  }

  // Process a batch of records
  async processBatch(uploadId, uploadType, batch, startRow) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      const rowNumber = startRow + i;

      try {
        // Create bulk upload record
        const bulkRecord = new BulkUploadRecord({
          uploadId,
          rowNumber,
          data: record,
          status: 'pending'
        });

        // Process based on upload type
        let processedData = null;
        
        switch (uploadType) {
          case 'users':
            processedData = await this.processUserRecord(record, rowNumber);
            break;
          case 'fields':
            processedData = await this.processFieldRecord(record, rowNumber);
            break;
          case 'crops':
            processedData = await this.processCropRecord(record, rowNumber);
            break;
          case 'sensors':
            processedData = await this.processSensorRecord(record, rowNumber);
            break;
          case 'land_tokens':
            processedData = await this.processLandTokenRecord(record, rowNumber);
            break;
          default:
            throw new Error(`Unsupported upload type: ${uploadType}`);
        }

        // Update record status
        bulkRecord.status = 'processed';
        bulkRecord.processedAt = new Date();
        await bulkRecord.save();

        results.successful++;
        results.processed++;

      } catch (error) {
        // Update record with error
        bulkRecord.status = 'error';
        bulkRecord.errorMessage = error.message;
        bulkRecord.processedAt = new Date();
        await bulkRecord.save();

        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message,
          data: record
        });
      }

      results.processed++;
    }

    return results;
  }

  // Process user record
  async processUserRecord(data, rowNumber) {
    try {
      // Validate required fields
      if (!data.email) {
        throw new Error(`Row ${rowNumber}: Email is required`);
      }
      if (!data.first_name) {
        throw new Error(`Row ${rowNumber}: First name is required`);
      }
      if (!data.last_name) {
        throw new Error(`Row ${rowNumber}: Last name is required`);
      }
      if (!data.password) {
        throw new Error(`Row ${rowNumber}: Password is required`);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error(`Row ${rowNumber}: User with email ${data.email} already exists`);
      }

      // Create new user
      const userData = {
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password,
        role: data.role || 'farmer',
        phoneNumber: data.phone_number || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        pincode: data.pincode || '',
        landArea: data.land_area || 0,
        landOwnership: data.land_ownership || 'owned',
        farmingExperience: data.farming_experience || 0,
        preferredCrops: data.preferred_crops ? data.preferred_crops.split(',').map(c => c.trim()) : [],
        isVerified: data.is_verified === 'true' || data.is_verified === true,
        verificationStatus: data.verification_status || 'pending'
      };

      const user = new User(userData);
      await user.save();

      return user;

    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  // Process field record
  async processFieldRecord(data, rowNumber) {
    try {
      // Validate required fields
      if (!data.field_name) {
        throw new Error(`Row ${rowNumber}: Field name is required`);
      }
      if (!data.location) {
        throw new Error(`Row ${rowNumber}: Location is required`);
      }
      if (!data.area) {
        throw new Error(`Row ${rowNumber}: Area is required`);
      }
      if (!data.coordinates) {
        throw new Error(`Row ${rowNumber}: Coordinates are required`);
      }

      // Check if field already exists
      const existingField = await Field.findOne({ 
        name: data.field_name,
        location: data.location 
      });
      if (existingField) {
        throw new Error(`Row ${rowNumber}: Field with name ${data.field_name} already exists at this location`);
      }

      // Create new field
      const fieldData = {
        name: data.field_name,
        location: data.location,
        area: parseFloat(data.area),
        coordinates: data.coordinates,
        soilType: data.soil_type || 'unknown',
        fieldType: data.field_type || 'agricultural',
        irrigationType: data.irrigation_type || 'rainfed',
        ownershipType: data.ownership_type || 'owned',
        description: data.description || '',
        status: data.status || 'active'
      };

      const field = new Field(fieldData);
      await field.save();

      return field;

    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  // Process crop record
  async processCropRecord(data, rowNumber) {
    try {
      // Validate required fields
      if (!data.crop_name) {
        throw new Error(`Row ${rowNumber}: Crop name is required`);
      }
      if (!data.field_name) {
        throw new Error(`Row ${rowNumber}: Field name is required`);
      }
      if (!data.planting_date) {
        throw new Error(`Row ${rowNumber}: Planting date is required`);
      }

      // Find the field
      const field = await Field.findOne({ name: data.field_name });
      if (!field) {
        throw new Error(`Row ${rowNumber}: Field with name ${data.field_name} not found`);
      }

      // Check if crop already exists for this field
      const existingCrop = await Crop.findOne({
        name: data.crop_name,
        field: field._id,
        plantingDate: new Date(data.planting_date)
      });
      if (existingCrop) {
        throw new Error(`Row ${rowNumber}: Crop ${data.crop_name} already exists for this field and planting date`);
      }

      // Create new crop
      const cropData = {
        name: data.crop_name,
        field: field._id,
        variety: data.variety || 'unknown',
        plantingDate: new Date(data.planting_date),
        expectedHarvestDate: data.expected_harvest_date ? new Date(data.expected_harvest_date) : null,
        area: data.area ? parseFloat(data.area) : field.area,
        status: data.status || 'planted',
        notes: data.notes || ''
      };

      const crop = new Crop(cropData);
      await crop.save();

      return crop;

    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  // Process sensor record
  async processSensorRecord(data, rowNumber) {
    try {
      // Validate required fields
      if (!data.sensor_name) {
        throw new Error(`Row ${rowNumber}: Sensor name is required`);
      }
      if (!data.sensor_type) {
        throw new Error(`Row ${rowNumber}: Sensor type is required`);
      }
      if (!data.location) {
        throw new Error(`Row ${rowNumber}: Location is required`);
      }

      // Check if sensor already exists
      const existingSensor = await Sensor.findOne({ 
        name: data.sensor_name,
        location: data.location 
      });
      if (existingSensor) {
        throw new Error(`Row ${rowNumber}: Sensor with name ${data.sensor_name} already exists at this location`);
      }

      // Create new sensor
      const sensorData = {
        name: data.sensor_name,
        type: data.sensor_type,
        location: data.location,
        coordinates: data.coordinates || null,
        status: data.status || 'active',
        lastReading: data.last_reading ? new Date(data.last_reading) : null,
        batteryLevel: data.battery_level ? parseFloat(data.battery_level) : 100,
        description: data.description || ''
      };

      const sensor = new Sensor(sensorData);
      await sensor.save();

      return sensor;

    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  // Process land token record
  async processLandTokenRecord(data, rowNumber) {
    try {
      // Validate required fields
      if (!data.token_name) {
        throw new Error(`Row ${rowNumber}: Token name is required`);
      }
      if (!data.field_name) {
        throw new Error(`Row ${rowNumber}: Field name is required`);
      }
      if (!data.token_value) {
        throw new Error(`Row ${rowNumber}: Token value is required`);
      }

      // Find the field
      const field = await Field.findOne({ name: data.field_name });
      if (!field) {
        throw new Error(`Row ${rowNumber}: Field with name ${data.field_name} not found`);
      }

      // Check if land token already exists
      const existingToken = await LandToken.findOne({
        name: data.token_name,
        field: field._id
      });
      if (existingToken) {
        throw new Error(`Row ${rowNumber}: Land token with name ${data.token_name} already exists for this field`);
      }

      // Create new land token
      const tokenData = {
        name: data.token_name,
        field: field._id,
        tokenValue: parseFloat(data.token_value),
        tokenType: data.token_type || 'Fields',
        description: data.description || '',
        status: data.status || 'active',
        createdDate: data.created_date ? new Date(data.created_date) : new Date()
      };

      const token = new LandToken(tokenData);
      await token.save();

      return token;

    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  }

  // Send completion email
  async sendCompletionEmail(upload) {
    try {
      const user = await User.findById(upload.uploadedBy);
      if (!user || !user.email) {
        console.log('User not found or no email address');
        return;
      }

      const subject = `Bulk Upload Completed - ${upload.filename}`;
      const message = `
        <h2>Bulk Upload Completed</h2>
        <p>Your bulk upload has been processed successfully.</p>
        <ul>
          <li><strong>Filename:</strong> ${upload.filename}</li>
          <li><strong>Type:</strong> ${upload.uploadType}</li>
          <li><strong>Total Records:</strong> ${upload.totalRecords}</li>
          <li><strong>Successful:</strong> ${upload.successfulRecords}</li>
          <li><strong>Failed:</strong> ${upload.failedRecords}</li>
          <li><strong>Status:</strong> ${upload.status}</li>
        </ul>
        <p>You can view the detailed results in your admin dashboard.</p>
      `;

      await emailService.sendEmail(user.email, subject, message);
    } catch (error) {
      console.error('Error sending completion email:', error.message);
    }
  }

  // Get bulk upload statistics
  async getBulkUploadStats() {
    try {
      const totalUploads = await BulkUpload.countDocuments();
      
      const uploadsByStatus = await BulkUpload.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const uploadsByType = await BulkUpload.aggregate([
        {
          $group: {
            _id: '$uploadType',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalRecords = await BulkUpload.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalRecords' }
          }
        }
      ]);

      const recentUploads = await BulkUpload.find()
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5);

      return {
        totalUploads,
        uploadsByStatus: uploadsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        uploadsByType: uploadsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalRecords: totalRecords.length > 0 ? totalRecords[0].total : 0,
        recentUploads: recentUploads.map(upload => ({
          uploadId: upload.uploadId,
          filename: upload.filename,
          uploadType: upload.uploadType,
          status: upload.status,
          totalRecords: upload.totalRecords,
          successfulRecords: upload.successfulRecords,
          failedRecords: upload.failedRecords,
          createdAt: upload.createdAt,
          uploadedBy: upload.uploadedBy
        }))
      };
    } catch (error) {
      console.error('Error getting bulk upload stats:', error.message);
      return {
        totalUploads: 0,
        uploadsByStatus: {},
        uploadsByType: {},
        totalRecords: 0,
        recentUploads: []
      };
    }
  }

  // Get all bulk uploads
  async getAllBulkUploads(options = {}) {
    try {
      const query = {};
      if (options.uploadType) {
        query.uploadType = options.uploadType;
      }
      if (options.status) {
        query.status = options.status;
      }
      if (options.uploadedBy) {
        query.uploadedBy = options.uploadedBy;
      }

      const uploads = await BulkUpload.find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);

      return uploads;
    } catch (error) {
      console.error('Error getting all bulk uploads:', error.message);
      return [];
    }
  }

  // Get bulk upload by ID
  async getBulkUploadById(uploadId) {
    try {
      const upload = await BulkUpload.findOne({ uploadId })
        .populate('uploadedBy', 'firstName lastName email');

      if (!upload) {
        throw new Error('Bulk upload not found');
      }

      // Get records for this upload
      const records = await BulkUploadRecord.find({ uploadId })
        .sort({ rowNumber: 1 })
        .limit(100); // Limit to first 100 records for performance

      return {
        upload,
        records
      };
    } catch (error) {
      console.error('Error getting bulk upload by ID:', error.message);
      throw error;
    }
  }
}

module.exports = new BulkUploadService();
