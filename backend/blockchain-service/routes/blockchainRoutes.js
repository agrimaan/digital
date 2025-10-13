const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /blockchain/transactions
 * @desc    Get all blockchain transactions for a user
 * @access  Private
 */
router.get('/transactions', blockchainController.getTransactions);

/**
 * @route   GET /blockchain/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/transactions/:id', blockchainController.getTransactionById);

/**
 * @route   POST /blockchain/transactions
 * @desc    Create a new blockchain transaction
 * @access  Private
 */
router.post(
  '/transactions',
  [
    body('toAddress', 'Recipient address is required').not().isEmpty(),
    body('amount', 'Amount must be a positive number').isFloat({ min: 0.000001 }),
    body('tokenType', 'Token type is required').isIn(['AGM', 'Fields', 'FARMHOUSE', 'OTHER'])
  ],
  blockchainController.createTransaction
);

/**
 * @route   POST /blockchain/transfer
 * @desc    Transfer AGM tokens
 * @access  Private
 */
router.post(
  '/transfer',
  [
    body('toAddress', 'Recipient address is required').not().isEmpty(),
    body('amount', 'Amount must be a positive number').isFloat({ min: 0.000001 })
  ],
  blockchainController.transferTokens
);

/**
 * @route   GET /blockchain/contracts
 * @desc    Get all smart contracts
 * @access  Private/Admin
 */
router.get('/contracts', blockchainController.getContracts);

/**
 * @route   GET /blockchain/contracts/:id
 * @desc    Get smart contract by ID
 * @access  Private
 */
router.get('/contracts/:id', blockchainController.getContractById);

/**
 * @route   POST /blockchain/contracts
 * @desc    Deploy a new smart contract
 * @access  Private/Admin
 */
router.post(
  '/contracts',
  [
    body('contractName', 'Contract name is required').not().isEmpty(),
    body('contractType', 'Contract type is required').isIn(['token', 'marketplace', 'supply_chain', 'yield_sharing', 'Fields_ownership', 'other']),
    body('abi', 'Contract ABI is required').not().isEmpty(),
    body('network', 'Network is required').isIn(['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'])
  ],
  blockchainController.createContract
);

/**
 * @route   GET /blockchain/wallet
 * @desc    Get user's wallet
 * @access  Private
 */
router.get('/wallet', blockchainController.getWallet);

/**
 * @route   POST /blockchain/wallet
 * @desc    Create a new wallet for user
 * @access  Private
 */
router.post('/wallet', blockchainController.createWallet);

/**
 * @route   GET /blockchain/tokens
 * @desc    Get all tokens owned by user
 * @access  Private
 */
router.get('/land-tokens', blockchainController.getTokens);

/**
 * @route   GET /blockchain/tokens/:id
 * @desc    Get token by ID
 * @access  Private
 */
router.get('/land-tokens/:id', blockchainController.getTokenById);

/**
 * @route   POST /blockchain/tokens/Fields
 * @desc    Create a Fields token
 * @access  Private
 */
router.post(
  '/tokens/Fields',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('location', 'Location is required').not().isEmpty(),
    body('area', 'Area must be a positive number').isFloat({ min: 0.01 }),
    body('coordinates', 'Coordinates are required').isArray()
  ],
  blockchainController.createFieldsToken
);

/**
 * @route   POST /blockchain/tokens/farmhouse
 * @desc    Create a farmhouse token
 * @access  Private
 */
router.post(
  '/tokens/farmhouse',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('location', 'Location is required').not().isEmpty(),
    body('area', 'Area must be a positive number').isFloat({ min: 0.01 }),
    body('valuation', 'Valuation must be a positive number').isFloat({ min: 0.01 })
  ],
  blockchainController.createFarmhouseToken
);

/**
 * @route   GET /blockchain/market
 * @desc    Get marketplace data
 * @access  Private
 */
router.get('/market', blockchainController.getMarketplaceData);

module.exports = router;
