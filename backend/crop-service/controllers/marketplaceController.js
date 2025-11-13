const cropService = require('../services/cropService');
const responseHandler = require('../utils/responseHandler');
const axios = require('axios');
const { validationResult } = require('express-validator');

const MARKETPLACE_SERVICE_URL = process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006';

// @desc    Publish crop to marketplace
// @route   POST /api/crops/:id/publish
// @access  Private (Farmer only)
exports.publishCropToMarketplace = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.badRequest(res, 'Validation error', errors.array());
  }

  try {
    const { id } = req.params;
    const crop = await cropService.getCropById({ _id: id, farmerId: req.user.id });

    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found');
    }

    // Check if crop is in harvested or maturity stage
    if (!['harvested', 'maturity'].includes(crop.growthStage)) {
      return responseHandler.badRequest(
        res,
        `Crop must be in 'harvested' or 'maturity' stage to publish. Current stage: ${crop.growthStage}`
      );
    }

    // Check if actualYield is set
    if (!crop.actualYield || crop.actualYield <= 0) {
      return responseHandler.badRequest(
        res,
        'Crop must have actual yield recorded before publishing to marketplace'
      );
    }

    // Prepare product data for marketplace
    const {
      pricePerUnit,
      quantity,
      description,
      images,
      isOrganic,
      certifications
    } = req.body;

    if (!pricePerUnit || pricePerUnit <= 0) {
      return responseHandler.badRequest(res, 'Price per unit is required and must be greater than 0');
    }

    if (!quantity || quantity <= 0) {
      return responseHandler.badRequest(res, 'Quantity is required and must be greater than 0');
    }

    if (quantity > crop.actualYield) {
      return responseHandler.badRequest(
        res,
        `Quantity cannot exceed actual yield (${crop.actualYield} ${crop.unit})`
      );
    }

    // Get user location from user-service (if available)
    let userLocation = null;
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
      const userResponse = await axios.get(`${userServiceUrl}/api/users/${req.user.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      userLocation = userResponse.data?.data?.location;
    } catch (error) {
      console.warn('Could not fetch user location:', error.message);
    }

    // Create product in marketplace
    const productData = {
      name: crop.name,
      description: description || `Fresh ${crop.name} - ${crop.variety}`,
      category: 'crop',
      price: {
        value: pricePerUnit,
        currency: 'INR',
        unit: crop.unit || 'kg'
      },
      quantity: {
        available: quantity,
        unit: crop.unit || 'kg',
        minimum: 1
      },
      images: images || [],
      seller: req.user.id,
      location: userLocation || {
        type: 'Point',
        coordinates: [0, 0], // Default coordinates
        address: {
          city: 'Unknown',
          state: 'Unknown',
          country: 'India'
        }
      },
      specifications: {
        variety: crop.variety,
        scientificName: crop.scientificName,
        soilType: crop.soilType,
        irrigationMethod: crop.irrigationMethod,
        healthStatus: crop.healthStatus,
        plantingDate: crop.plantingDate,
        harvestDate: crop.actualHarvestDate || new Date()
      },
      isOrganic: isOrganic || false,
      certifications: certifications || [],
      harvestDate: crop.actualHarvestDate || new Date(),
      isActive: true
    };

    // Call marketplace service to create product
    const marketplaceResponse = await axios.post(
      `${MARKETPLACE_SERVICE_URL}/api/marketplace/products`,
      productData,
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update crop with marketplace listing info
    await cropService.updateCrop(id, {
      marketplaceListing: {
        productId: marketplaceResponse.data.data._id,
        listedDate: new Date(),
        quantity: quantity,
        pricePerUnit: pricePerUnit,
        status: 'active'
      }
    });

    return responseHandler.success(
      res,
      201,
      {
        crop: crop,
        marketplaceProduct: marketplaceResponse.data.data
      },
      'Crop published to marketplace successfully'
    );
  } catch (error) {
    console.error('Error publishing crop to marketplace:', error);
    
    if (error.response) {
      return responseHandler.error(
        res,
        error.response.status,
        error.response.data.message || 'Error publishing to marketplace',
        error
      );
    }
    
    return responseHandler.error(res, 500, 'Error publishing crop to marketplace', error);
  }
};

// @desc    Get marketplace listings for farmer's crops
// @route   GET /api/crops/marketplace/listings
// @access  Private (Farmer only)
exports.getMarketplaceListings = async (req, res) => {
  try {
    const crops = await cropService.getAllCrops({ 
      farmerId: req.user.id,
      'marketplaceListing.status': 'active'
    });

    return responseHandler.success(
      res,
      200,
      crops,
      'Marketplace listings retrieved successfully'
    );
  } catch (error) {
    return responseHandler.error(res, 500, 'Error retrieving marketplace listings', error);
  }
};

// @desc    Unlist crop from marketplace
// @route   DELETE /api/crops/:id/marketplace
// @access  Private (Farmer only)
exports.unlistFromMarketplace = async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await cropService.getCropById({ _id: id, farmerId: req.user.id });

    if (!crop) {
      return responseHandler.notFound(res, 'Crop not found');
    }

    if (!crop.marketplaceListing || !crop.marketplaceListing.productId) {
      return responseHandler.badRequest(res, 'Crop is not listed on marketplace');
    }

    // Deactivate product in marketplace
    try {
      await axios.put(
        `${MARKETPLACE_SERVICE_URL}/api/marketplace/products/${crop.marketplaceListing.productId}`,
        { isActive: false },
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.warn('Could not deactivate marketplace product:', error.message);
    }

    // Update crop to remove marketplace listing
    await cropService.updateCrop(id, {
      'marketplaceListing.status': 'unlisted',
      'marketplaceListing.unlistedDate': new Date()
    });

    return responseHandler.success(res, 200, {}, 'Crop unlisted from marketplace successfully');
  } catch (error) {
    return responseHandler.error(res, 500, 'Error unlisting crop from marketplace', error);
  }
};

module.exports = exports;