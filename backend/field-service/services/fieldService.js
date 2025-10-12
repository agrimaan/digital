const Field = require('../models/Field');

/**
 * Get all fields
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of fields
 */
exports.getAllFields = async (filter = {}) => {
  return await Field.find(filter)
    .populate('soilType')
    .populate('boundary');
};

/**
 * Get field by ID
 * @param {string} id - Field ID
 * @returns {Promise<Object>} Field object
 */
exports.getFieldById = async (id) => {
  return await Field.findById(id)
    .populate('soilType')
    .populate('boundary');
};

/**
 * Create a new field
 * @param {Object} fieldData - Field data
 * @returns {Promise<Object>} Created field
 */
exports.createField = async (fieldData) => {
  return await Field.create(fieldData);
};

/**
 * Update field
 * @param {string} id - Field ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated field
 */
exports.updateField = async (id, updateData) => {
  return await Field.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  )
    .populate('soilType')
    .populate('boundary');
};

/**
 * Delete field
 * @param {string} id - Field ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteField = async (id) => {
  const field = await Field.findById(id);
  if (!field) {
    return false;
  }
  await field.deleteOne();
  return true;
};

/**
 * Get fields by owner
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of fields
 */
exports.getFieldsByOwner = async (ownerId) => {
  return await Field.find({ owner: ownerId })
    .populate('soilType')
    .populate('boundary');
};

/**
 * Get fields by crop
 * @param {string} cropId - Crop ID
 * @returns {Promise<Array>} Array of fields
 */
exports.getFieldsByCrop = async (cropId) => {
  return await Field.find({ crops: cropId })
    .populate('soilType')
    .populate('boundary');
};

/**
 * Get fields by soil type
 * @param {string} soilTypeId - Soil type ID
 * @returns {Promise<Array>} Array of fields
 */
exports.getFieldsBySoilType = async (soilTypeId) => {
  return await Field.find({ soilType: soilTypeId })
    .populate('soilType')
    .populate('boundary');
};

/**
 * Get nearby fields
 * @param {number} longitude - Longitude
 * @param {number} latitude - Latitude
 * @param {number} distance - Distance in meters
 * @param {string} ownerId - Owner ID (optional)
 * @returns {Promise<Array>} Array of fields
 */
exports.getNearbyFields = async (longitude, latitude, distance, ownerId = null) => {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: distance
      }
    }
  };

  // Add owner filter if provided
  if (ownerId) {
    query.owner = ownerId;
  }

  return await Field.find(query)
    .populate('soilType')
    .populate('boundary');
};

/**
 * Get total area of fields by owner
 * @param {string} ownerId - Owner ID
 * @returns {Promise<number>} Total area
 */
exports.getTotalAreaByOwner = async (ownerId) => {
  const result = await Field.aggregate([
    { $match: { owner: ownerId } },
    { $group: { _id: null, totalArea: { $sum: '$area' } } }
  ]);

  return result.length > 0 ? result[0].totalArea : 0;
};

/**
 * Get fields by status
 * @param {string} status - Field status
 * @param {string} ownerId - Owner ID (optional)
 * @returns {Promise<Array>} Array of fields
 */
exports.getFieldsByStatus = async (status, ownerId = null) => {
  const query = { status };

  // Add owner filter if provided
  if (ownerId) {
    query.owner = ownerId;
  }

  return await Field.find(query)
    .populate('soilType')
    .populate('boundary');
};