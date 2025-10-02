const Boundary = require('../models/Boundary');

/**
 * Get all boundaries
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getAllBoundaries = async () => {
  return await Boundary.find().populate('field');
};

/**
 * Get boundary by ID
 * @param {string} id - Boundary ID
 * @returns {Promise<Object>} Boundary object
 */
exports.getBoundaryById = async (id) => {
  return await Boundary.findById(id).populate('field');
};

/**
 * Create a new boundary
 * @param {Object} boundaryData - Boundary data
 * @returns {Promise<Object>} Created boundary
 */
exports.createBoundary = async (boundaryData) => {
  return await Boundary.create(boundaryData);
};

/**
 * Update boundary
 * @param {string} id - Boundary ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated boundary
 */
exports.updateBoundary = async (id, updateData) => {
  return await Boundary.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('field');
};

/**
 * Delete boundary
 * @param {string} id - Boundary ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteBoundary = async (id) => {
  const boundary = await Boundary.findById(id);
  if (!boundary) {
    return false;
  }
  await boundary.remove();
  return true;
};

/**
 * Get boundaries by field
 * @param {string} fieldId - Field ID
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesByField = async (fieldId) => {
  return await Boundary.find({ field: fieldId });
};

/**
 * Get boundaries by source
 * @param {string} source - Boundary source
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesBySource = async (source) => {
  return await Boundary.find({ source }).populate('field');
};

/**
 * Get boundaries by accuracy range
 * @param {number} minAccuracy - Minimum accuracy
 * @param {number} maxAccuracy - Maximum accuracy
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesByAccuracyRange = async (minAccuracy, maxAccuracy) => {
  return await Boundary.find({
    accuracy: { $gte: minAccuracy, $lte: maxAccuracy }
  }).populate('field');
};

/**
 * Get boundaries by area range
 * @param {number} minArea - Minimum area
 * @param {number} maxArea - Maximum area
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesByAreaRange = async (minArea, maxArea) => {
  return await Boundary.find({
    area: { $gte: minArea, $lte: maxArea }
  }).populate('field');
};

/**
 * Get boundaries by perimeter range
 * @param {number} minPerimeter - Minimum perimeter
 * @param {number} maxPerimeter - Maximum perimeter
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesByPerimeterRange = async (minPerimeter, maxPerimeter) => {
  return await Boundary.find({
    perimeter: { $gte: minPerimeter, $lte: maxPerimeter }
  }).populate('field');
};

/**
 * Get boundaries within a polygon
 * @param {Array} polygon - GeoJSON polygon coordinates
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesWithinPolygon = async (polygon) => {
  return await Boundary.find({
    geometry: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: polygon
        }
      }
    }
  }).populate('field');
};

/**
 * Get boundaries that intersect with a polygon
 * @param {Array} polygon - GeoJSON polygon coordinates
 * @returns {Promise<Array>} Array of boundaries
 */
exports.getBoundariesIntersectingPolygon = async (polygon) => {
  return await Boundary.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: 'Polygon',
          coordinates: polygon
        }
      }
    }
  }).populate('field');
};