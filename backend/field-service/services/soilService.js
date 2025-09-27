const Soil = require('../models/Soil');

/**
 * Get all soil types
 * @returns {Promise<Array>} Array of soil types
 */
exports.getAllSoilTypes = async () => {
  return await Soil.find();
};

/**
 * Get soil type by ID
 * @param {string} id - Soil type ID
 * @returns {Promise<Object>} Soil type object
 */
exports.getSoilTypeById = async (id) => {
  return await Soil.findById(id);
};

/**
 * Create a new soil type
 * @param {Object} soilData - Soil type data
 * @returns {Promise<Object>} Created soil type
 */
exports.createSoilType = async (soilData) => {
  return await Soil.create(soilData);
};

/**
 * Update soil type
 * @param {string} id - Soil type ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated soil type
 */
exports.updateSoilType = async (id, updateData) => {
  return await Soil.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

/**
 * Delete soil type
 * @param {string} id - Soil type ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteSoilType = async (id) => {
  const soilType = await Soil.findById(id);
  if (!soilType) {
    return false;
  }
  await soilType.remove();
  return true;
};

/**
 * Get soil types by texture
 * @param {string} texture - Soil texture
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByTexture = async (texture) => {
  return await Soil.find({ texture });
};

/**
 * Get soil types by drainage capacity
 * @param {string} drainageCapacity - Drainage capacity
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByDrainageCapacity = async (drainageCapacity) => {
  return await Soil.find({ drainageCapacity });
};

/**
 * Get soil types by water holding capacity
 * @param {string} waterHoldingCapacity - Water holding capacity
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByWaterHoldingCapacity = async (waterHoldingCapacity) => {
  return await Soil.find({ waterHoldingCapacity });
};

/**
 * Get soil types by organic matter content
 * @param {string} organicMatterContent - Organic matter content
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByOrganicMatterContent = async (organicMatterContent) => {
  return await Soil.find({ organicMatterContent });
};

/**
 * Get soil types by crop suitability
 * @param {string} cropId - Crop ID
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByCrop = async (cropId) => {
  return await Soil.find({ suitableCrops: cropId });
};

/**
 * Get soil types by pH range
 * @param {number} ph - pH value
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByPh = async (ph) => {
  return await Soil.find({
    'fertilityCriteria.ph.min': { $lte: ph },
    'fertilityCriteria.ph.max': { $gte: ph }
  });
};

/**
 * Get soil types by fertility criteria
 * @param {Object} criteria - Fertility criteria
 * @returns {Promise<Array>} Array of soil types
 */
exports.getSoilTypesByFertilityCriteria = async (criteria) => {
  const query = {};
  
  if (criteria.nitrogen) {
    query['fertilityCriteria.nitrogen'] = criteria.nitrogen;
  }
  
  if (criteria.phosphorus) {
    query['fertilityCriteria.phosphorus'] = criteria.phosphorus;
  }
  
  if (criteria.potassium) {
    query['fertilityCriteria.potassium'] = criteria.potassium;
  }
  
  return await Soil.find(query);
};