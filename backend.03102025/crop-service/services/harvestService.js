const Harvest = require('../models/Harvest');
const Planting = require('../models/Planting');

/**
 * Get all harvests
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} Array of harvests
 */
exports.getAllHarvests = async (filter = {}) => {
  return await Harvest.find(filter)
    .populate('crop')
    .populate('planting');
};

/**
 * Get harvest by ID
 * @param {string} id - Harvest ID
 * @returns {Promise<Object>} Harvest object
 */
exports.getHarvestById = async (id) => {
  return await Harvest.findById(id)
    .populate('crop')
    .populate('planting');
};

/**
 * Create a new harvest
 * @param {Object} harvestData - Harvest data
 * @returns {Promise<Object>} Created harvest
 */
exports.createHarvest = async (harvestData) => {
  // Verify that the planting exists and is ready for harvest
  const planting = await Planting.findById(harvestData.planting);
  
  if (!planting) {
    throw new Error('Planting not found');
  }
  
  if (planting.status !== 'ready_for_harvest' && planting.status !== 'growing') {
    throw new Error('Planting is not ready for harvest');
  }
  
  // Set field and crop from planting if not provided
  if (!harvestData.field) {
    harvestData.field = planting.field;
  }
  
  if (!harvestData.crop) {
    harvestData.crop = planting.crop;
  }
  
  // Create the harvest record
  const harvest = await Harvest.create(harvestData);
  
  // Update the planting status to harvested
  planting.status = 'harvested';
  planting.actualHarvestDate = harvestData.harvestDate;
  planting.actualYield = harvestData.yield;
  await planting.save();
  
  return harvest;
};

/**
 * Update harvest
 * @param {string} id - Harvest ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated harvest
 */
exports.updateHarvest = async (id, updateData) => {
  const harvest = await Harvest.findById(id);
  
  if (!harvest) {
    throw new Error('Harvest not found');
  }
  
  // If yield is being updated, also update the planting's actual yield
  if (updateData.yield && updateData.yield.value) {
    const planting = await Planting.findById(harvest.planting);
    if (planting) {
      planting.actualYield = updateData.yield;
      await planting.save();
    }
  }
  
  return await Harvest.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  )
    .populate('crop')
    .populate('planting');
};

/**
 * Delete harvest
 * @param {string} id - Harvest ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteHarvest = async (id) => {
  const harvest = await Harvest.findById(id);
  
  if (!harvest) {
    return false;
  }
  
  // Update the planting status back to ready_for_harvest
  const planting = await Planting.findById(harvest.planting);
  if (planting) {
    planting.status = 'ready_for_harvest';
    planting.actualHarvestDate = null;
    planting.actualYield = null;
    await planting.save();
  }
  
  await harvest.remove();
  return true;
};

/**
 * Get harvests by field
 * @param {string} fieldId - Field ID
 * @returns {Promise<Array>} Array of harvests
 */
exports.getHarvestsByField = async (fieldId) => {
  return await Harvest.find({ field: fieldId })
    .populate('crop')
    .populate('planting');
};

/**
 * Get harvests by owner
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of harvests
 */
exports.getHarvestsByOwner = async (ownerId) => {
  return await Harvest.find({ owner: ownerId })
    .populate('crop')
    .populate('planting');
};

/**
 * Get harvests by crop
 * @param {string} cropId - Crop ID
 * @returns {Promise<Array>} Array of harvests
 */
exports.getHarvestsByCrop = async (cropId) => {
  return await Harvest.find({ crop: cropId })
    .populate('crop')
    .populate('planting');
};

/**
 * Get harvests by status
 * @param {string} status - Harvest status
 * @returns {Promise<Array>} Array of harvests
 */
exports.getHarvestsByStatus = async (status) => {
  return await Harvest.find({ status })
    .populate('crop')
    .populate('planting');
};

/**
 * Get harvests by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of harvests
 */
exports.getHarvestsByDateRange = async (startDate, endDate) => {
  return await Harvest.find({
    harvestDate: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate('crop')
    .populate('planting');
};

/**
 * Update harvest status
 * @param {string} id - Harvest ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated harvest
 */
exports.updateHarvestStatus = async (id, status) => {
  const harvest = await Harvest.findById(id);
  
  if (!harvest) {
    throw new Error('Harvest not found');
  }
  
  harvest.status = status;
  
  // If status is completed, set the completion date
  if (status === 'completed' && !harvest.completionDate) {
    harvest.completionDate = new Date();
  }
  
  return await harvest.save();
};

/**
 * Calculate harvest statistics
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Object>} Harvest statistics
 */
exports.getHarvestStatistics = async (ownerId) => {
  const harvests = await Harvest.find({ owner: ownerId });
  
  const totalYield = harvests.reduce((sum, harvest) => {
    if (harvest.yield && harvest.yield.value) {
      return sum + harvest.yield.value;
    }
    return sum;
  }, 0);
  
  const totalRevenue = harvests.reduce((sum, harvest) => {
    if (harvest.marketValue && harvest.marketValue.totalValue) {
      return sum + harvest.marketValue.totalValue;
    }
    return sum;
  }, 0);
  
  const totalCosts = harvests.reduce((sum, harvest) => {
    if (harvest.costs && harvest.costs.total) {
      return sum + harvest.costs.total;
    }
    return sum;
  }, 0);
  
  const totalProfit = harvests.reduce((sum, harvest) => {
    if (harvest.profit && harvest.profit.amount) {
      return sum + harvest.profit.amount;
    }
    return sum;
  }, 0);
  
  const statusCounts = harvests.reduce((counts, harvest) => {
    counts[harvest.status] = (counts[harvest.status] || 0) + 1;
    return counts;
  }, {});
  
  const cropYields = harvests.reduce((yields, harvest) => {
    if (harvest.crop && harvest.yield && harvest.yield.value) {
      yields[harvest.crop] = (yields[harvest.crop] || 0) + harvest.yield.value;
    }
    return yields;
  }, {});
  
  return {
    totalHarvests: harvests.length,
    totalYield,
    totalRevenue,
    totalCosts,
    totalProfit,
    statusCounts,
    cropYields
  };
};

/**
 * Get upcoming harvests
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of upcoming harvests
 */
exports.getUpcomingHarvests = async (ownerId) => {
  const today = new Date();
  
  return await Harvest.find({
    owner: ownerId,
    status: 'planned',
    harvestDate: { $gte: today }
  })
    .populate('crop')
    .populate('planting')
    .sort({ harvestDate: 1 });
};