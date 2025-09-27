const Planting = require('../models/Planting');
const Crop = require('../models/Crop');
const axios = require('axios');

/**
 * Get all plantings
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of plantings
 */
exports.getAllPlantings = async (filter = {}) => {
  return await Planting.find(filter).populate('crop');
};

/**
 * Get planting by ID
 * @param {string} id - Planting ID
 * @returns {Promise<Object>} Planting object
 */
exports.getPlantingById = async (id) => {
  return await Planting.findById(id).populate('crop');
};

/**
 * Create a new planting
 * @param {Object} plantingData - Planting data
 * @returns {Promise<Object>} Created planting
 */
exports.createPlanting = async (plantingData) => {
  // Verify that the crop exists
  const crop = await Crop.findById(plantingData.crop);
  if (!crop) {
    throw new Error('Crop not found');
  }
  
  // Verify that the field exists by calling the field service
  try {
    await axios.get(`${process.env.FIELD_SERVICE_URL}/api/fields/${plantingData.field}`, {
      headers: {
        Authorization: `Bearer ${plantingData.token}`
      }
    });
  } catch (error) {
    throw new Error('Field not found or not accessible');
  }
  
  // Calculate expected harvest date based on crop growth duration
  if (!plantingData.expectedHarvestDate && plantingData.plantingDate && crop.growthDuration) {
    const plantingDate = new Date(plantingData.plantingDate);
    const avgGrowthDuration = (crop.growthDuration.min + crop.growthDuration.max) / 2;
    const expectedHarvestDate = new Date(plantingDate);
    expectedHarvestDate.setDate(plantingDate.getDate() + avgGrowthDuration);
    plantingData.expectedHarvestDate = expectedHarvestDate;
  }
  
  // Set expected yield based on crop yield estimate and planting area
  if (!plantingData.expectedYield && plantingData.area && crop.yieldEstimate) {
    const avgYield = (crop.yieldEstimate.min + crop.yieldEstimate.max) / 2;
    plantingData.expectedYield = {
      value: avgYield * plantingData.area,
      unit: 'kg'
    };
  }
  
  return await Planting.create(plantingData);
};

/**
 * Update planting
 * @param {string} id - Planting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated planting
 */
exports.updatePlanting = async (id, updateData) => {
  return await Planting.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('crop');
};

/**
 * Delete planting
 * @param {string} id - Planting ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deletePlanting = async (id) => {
  const planting = await Planting.findById(id);
  if (!planting) {
    return false;
  }
  await planting.remove();
  return true;
};

/**
 * Get plantings by field
 * @param {string} fieldId - Field ID
 * @returns {Promise<Array>} Array of plantings
 */
exports.getPlantingsByField = async (fieldId) => {
  return await Planting.find({ field: fieldId }).populate('crop');
};

/**
 * Get plantings by owner
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of plantings
 */
exports.getPlantingsByOwner = async (ownerId) => {
  return await Planting.find({ owner: ownerId }).populate('crop');
};

/**
 * Get plantings by crop
 * @param {string} cropId - Crop ID
 * @returns {Promise<Array>} Array of plantings
 */
exports.getPlantingsByCrop = async (cropId) => {
  return await Planting.find({ crop: cropId }).populate('crop');
};

/**
 * Get plantings by status
 * @param {string} status - Planting status
 * @returns {Promise<Array>} Array of plantings
 */
exports.getPlantingsByStatus = async (status) => {
  return await Planting.find({ status }).populate('crop');
};

/**
 * Get plantings by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of plantings
 */
exports.getPlantingsByDateRange = async (startDate, endDate) => {
  return await Planting.find({
    plantingDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('crop');
};

/**
 * Add growth observation to planting
 * @param {string} id - Planting ID
 * @param {Object} observation - Growth observation data
 * @returns {Promise<Object>} Updated planting
 */
exports.addGrowthObservation = async (id, observation) => {
  const planting = await Planting.findById(id);
  
  if (!planting) {
    throw new Error('Planting not found');
  }
  
  planting.growthObservations.push(observation);
  
  // Update planting status based on growth stage if applicable
  if (observation.stage === 'ready_for_harvest') {
    planting.status = 'ready_for_harvest';
  }
  
  return await planting.save();
};

/**
 * Update planting status
 * @param {string} id - Planting ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated planting
 */
exports.updatePlantingStatus = async (id, status) => {
  const planting = await Planting.findById(id);
  
  if (!planting) {
    throw new Error('Planting not found');
  }
  
  planting.status = status;
  
  // If status is harvested, set the actual harvest date
  if (status === 'harvested' && !planting.actualHarvestDate) {
    planting.actualHarvestDate = new Date();
  }
  
  return await planting.save();
};

/**
 * Get upcoming plantings
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of upcoming plantings
 */
exports.getUpcomingPlantings = async (ownerId) => {
  const today = new Date();
  
  return await Planting.find({
    owner: ownerId,
    status: 'planned',
    plantingDate: { $gte: today }
  }).populate('crop').sort({ plantingDate: 1 });
};

/**
 * Get plantings ready for harvest
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of plantings ready for harvest
 */
exports.getPlantingsReadyForHarvest = async (ownerId) => {
  return await Planting.find({
    owner: ownerId,
    status: 'ready_for_harvest'
  }).populate('crop');
};

/**
 * Calculate planting statistics
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Object>} Planting statistics
 */
exports.getPlantingStatistics = async (ownerId) => {
  const plantings = await Planting.find({ owner: ownerId });
  
  const totalArea = plantings.reduce((sum, planting) => sum + planting.area, 0);
  const totalExpectedYield = plantings.reduce((sum, planting) => {
    if (planting.expectedYield && planting.expectedYield.value) {
      return sum + planting.expectedYield.value;
    }
    return sum;
  }, 0);
  const totalActualYield = plantings.reduce((sum, planting) => {
    if (planting.actualYield && planting.actualYield.value) {
      return sum + planting.actualYield.value;
    }
    return sum;
  }, 0);
  
  const statusCounts = plantings.reduce((counts, planting) => {
    counts[planting.status] = (counts[planting.status] || 0) + 1;
    return counts;
  }, {});
  
  const cropCounts = plantings.reduce((counts, planting) => {
    counts[planting.crop] = (counts[planting.crop] || 0) + 1;
    return counts;
  }, {});
  
  return {
    totalPlantings: plantings.length,
    totalArea,
    totalExpectedYield,
    totalActualYield,
    statusCounts,
    cropCounts
  };
};