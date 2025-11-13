const express = require('express');
const { body } = require('express-validator');
const blockchainController = require('../controllers/blockchainController');
//const { protect, authorize } = require('../../user-service/middleware/auth');
const { protect, authorize } = require('@agrimaan/shared').middleware;



const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin', 'super-admin'));

// Blockchain wallet routes
router.get('/wallet', blockchainController.getWallet);
router.post('/wallet', blockchainController.createWallet);

// Blockchain transaction routes
router.get('/transactions', blockchainController.getTransactions);
router.get('/transactions/:id', blockchainController.getTransactionById);
router.post('/transactions', [
  body('toAddress', 'Recipient address is required').not().isEmpty(),
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.000001 }),
  body('tokenType', 'Token type is required').isIn(['AGM', 'Fields', 'FARMHOUSE', 'OTHER'])
], blockchainController.createTransaction);

// Token transfer route
router.post('/transfer', [
  body('toAddress', 'Recipient address is required').not().isEmpty(),
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.000001 })
], blockchainController.transferTokens);

// Smart contract routes
router.get('/contracts', blockchainController.getContracts);
router.get('/contracts/:id', blockchainController.getContractById);
router.post('/contracts', [
  body('contractName', 'Contract name is required').not().isEmpty(),
  body('contractType', 'Contract type is required').isIn(['token', 'marketplace', 'supply_chain', 'yield_sharing', 'Fields_ownership', 'other']),
  body('abi', 'Contract ABI is required').not().isEmpty(),
  body('network', 'Network is required').isIn(['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'])
], blockchainController.createContract);

// Token routes
router.get('/land-tokens', blockchainController.getLandTokens);
router.get('/land-tokens/:id', blockchainController.getLandTokenById);
router.post('/tokens/Fields', [
  body('name', 'Name is required').not().isEmpty(),
  body('location', 'Location is required').not().isEmpty(),
  body('area', 'Area must be a positive number').isFloat({ min: 0.01 }),
  body('coordinates', 'Coordinates are required').isArray()
], blockchainController.createFieldsToken);

router.post('/tokens/farmhouse', [
  body('name', 'Name is required').not().isEmpty(),
  body('location', 'Location is required').not().isEmpty(),
  body('area', 'Area must be a positive number').isFloat({ min: 0.01 }),
  body('valuation', 'Valuation must be a positive number').isFloat({ min: 0.01 })
], blockchainController.createFarmhouseToken);

// Marketplace data
router.get('/market', blockchainController.getMarketplaceData);

module.exports = router;