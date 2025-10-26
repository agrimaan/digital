const Crop = require('../models/Crop');

const basePopulate = [
  { path: 'fieldId', select: 'name location' },
  { path: 'farmerId', select: 'name email' }, // assumes Crop schema has a ref to User
];

/**
 * Get all crops
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of crops
 */

exports.getAllCrops = async (filter) => {
  return await Crop.find(filter)
    .populate(basePopulate)
    .sort({ createdAt: -1 });
};

/**
 * Get crop by ID
 * @param {string} data - Req body
 * @returns {Promise<Object>} Crop object
 */
exports.getCropById = async (data) => {
  const crop = await Crop.findOne(data).populate(basePopulate);
  return crop

};

/**
 * Create a new crop
 * @param {Object} body - Crop data
 * @returns {Promise<Object>} Created crop
 */
exports.createCrop = async (body) => {
  const crop = await Crop.create(body);
  return await Crop.findById(crop._id).populate(basePopulate);
};

/**
 * Update crop
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated crop
 */
exports.updateCrop = async (id, data) => {
  return await Crop.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate(basePopulate);
};

/**
 * Delete crop
 * @param {object} crop - Crop data
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteCrop = async (crop) => {
  return await crop.deleteOne();
};

/**
 * Get crops by category
 * @param {string} category - Crop category
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsByCategory = async (category) => {
  return await Crop.find({ category });
};

/**
 * Get crops by soil type
 * @param {string} soilType - Soil type
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsBySoilType = async (soilType) => {
  return await Crop.find({ idealSoilTypes: soilType });
};

/**
 * Get crops by season
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsBySeason = async (month) => {
  return await Crop.find({
    'plantingSeasons.startMonth': { $lte: month },
    'plantingSeasons.endMonth': { $gte: month }
  });
};

/**
 * Get crops by water requirement
 * @param {string} waterRequirement - Water requirement (low, medium, high)
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsByWaterRequirement = async (waterRequirement) => {
  return await Crop.find({ waterRequirement });
};

/**
 * Get crops by temperature range
 * @param {number} temperature - Temperature in Celsius
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsByTemperature = async (temperature) => {
  return await Crop.find({
    'idealTemperature.min': { $lte: temperature },
    'idealTemperature.max': { $gte: temperature }
  });
};

/**
 * Get crops by growth duration
 * @param {number} minDuration - Minimum duration in days
 * @param {number} maxDuration - Maximum duration in days
 * @returns {Promise<Array>} Array of crops
 */
exports.getCropsByGrowthDuration = async (minDuration, maxDuration) => {
  return await Crop.find({
    'growthDuration.min': { $gte: minDuration },
    'growthDuration.max': { $lte: maxDuration }
  });
};

/**
 * Search crops by name
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of crops
 */
exports.searchCropsByName = async (searchTerm) => {
  const regex = new RegExp(searchTerm, 'i');
  return await Crop.find({
    $or: [
      { name: regex },
      { scientificName: regex }
    ]
  });
};

/**
 * Get crop recommendations based on field conditions
 * @param {Object} conditions - Field conditions
 * @returns {Promise<Array>} Array of recommended crops
 */
exports.getCropRecommendations = async (conditions) => {
  const { soilType, temperature, waterAvailability, season } = conditions;
  
  let query = {};
  
  if (soilType) {
    query.idealSoilTypes = soilType;
  }
  
  if (temperature) {
    query['idealTemperature.min'] = { $lte: temperature };
    query['idealTemperature.max'] = { $gte: temperature };
  }
  
  if (waterAvailability) {
    // Map water availability to water requirement
    let waterRequirement;
    if (waterAvailability === 'high') {
      waterRequirement = ['medium', 'high'];
    } else if (waterAvailability === 'medium') {
      waterRequirement = ['low', 'medium'];
    } else {
      waterRequirement = ['low'];
    }
    
    query.waterRequirement = { $in: waterRequirement };
  }
  
  if (season) {
    const month = new Date().getMonth() + 1; // Current month (1-12)
    query['plantingSeasons.startMonth'] = { $lte: month };
    query['plantingSeasons.endMonth'] = { $gte: month };
  }
  
  return await Crop.find(query);
};