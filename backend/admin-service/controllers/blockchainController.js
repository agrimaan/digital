const asyncHandler = require('express-async-handler');
const axios = require('axios');

const BLOCKCHAIN_SVC = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011';

// Helper function for HTTP requests
const http = axios.create({
  baseURL: BLOCKCHAIN_SVC,
  timeout: 8000,
});

function svcGet(path, { req, params = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.get(path, { params, headers });
}

function svcPost(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.post(path, data, { headers });
}

function svcPut(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.put(path, data, { headers });
}

function svcDelete(path, { req } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.delete(path, { headers });
}

// @desc    Get user's wallet
// @route   GET /api/admin/blockchain/wallet
// @access  Private/Admin
exports.getWallet = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet('/api/blockchain/wallet', { req });
    
    res.status(200).json({
      success: true,
      data: data?.data || data
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching wallet';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Create a new wallet for user
// @route   POST /api/admin/blockchain/wallet
// @access  Private/Admin
exports.createWallet = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/wallet', { req });
    
    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: data?.data || data
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating wallet';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get all blockchain transactions
// @route   GET /api/admin/blockchain/transactions
// @access  Private/Admin
exports.getTransactions = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet('/api/blockchain/transactions', { req, params: req.query });
    
    const transactions = data?.data?.transactions || data?.transactions || data?.data || data || [];
    const count = data?.data?.count || data?.count || transactions.length;
    
    res.status(200).json({
      success: true,
      transactions,
      count
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching transactions';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get transaction by ID
// @route   GET /api/admin/blockchain/transactions/:id
// @access  Private/Admin
exports.getTransactionById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/blockchain/transactions/${req.params.id}`, { req });
    
    const transaction = data?.data?.transaction || data?.transaction || data?.data || data;
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    const message = error.response?.data?.message || 'Error fetching transaction';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Create a new blockchain transaction
// @route   POST /api/admin/blockchain/transactions
// @access  Private/Admin
exports.createTransaction = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/transactions', { req, data: req.body });
    
    const transaction = data?.data?.transaction || data?.transaction || data?.data || data;
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating transaction';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Transfer AGM tokens
// @route   POST /api/admin/blockchain/transfer
// @access  Private/Admin
exports.transferTokens = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/transfer', { req, data: req.body });
    
    const transaction = data?.data?.transaction || data?.transaction || data?.data || data;
    
    res.status(200).json({
      success: true,
      message: 'Tokens transferred successfully',
      data: { transaction }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error transferring tokens';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get all smart contracts
// @route   GET /api/admin/blockchain/contracts
// @access  Private/Admin
exports.getContracts = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet('/api/blockchain/contracts', { req });
    
    const contracts = data?.data?.contracts || data?.contracts || data?.data || data || [];
    const count = data?.data?.count || data?.count || contracts.length;
    
    res.status(200).json({
      success: true,
      contracts,
      count
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching contracts';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get smart contract by ID
// @route   GET /api/admin/blockchain/contracts/:id
// @access  Private/Admin
exports.getContractById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/blockchain/contracts/${req.params.id}`, { req });
    
    const contract = data?.data?.contract || data?.contract || data?.data || data;
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Smart contract not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { contract }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Smart contract not found'
      });
    }
    const message = error.response?.data?.message || 'Error fetching contract';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Deploy a new smart contract
// @route   POST /api/admin/blockchain/contracts
// @access  Private/Admin
exports.createContract = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/contracts', { req, data: req.body });
    
    const contract = data?.data?.contract || data?.contract || data?.data || data;
    
    res.status(201).json({
      success: true,
      message: 'Smart contract deployed successfully',
      data: { contract }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error deploying contract';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get all land tokens
// @route   GET /api/admin/blockchain/land-tokens
// @access  Private/Admin
exports.getLandTokens = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet('/api/blockchain/land-tokens', { req, params: req.query });
    
    const tokens = data?.data?.tokens || data?.tokens || data?.data || data || [];
    const count = data?.data?.count || data?.count || tokens.length;
    
    res.status(200).json({
      success: true,
      tokens,
      count
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching land tokens';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get land token by ID
// @route   GET /api/admin/blockchain/land-tokens/:id
// @access  Private/Admin
exports.getLandTokenById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/blockchain/land-tokens/${req.params.id}`, { req });
    
    const token = data?.data?.token || data?.token || data?.data || data;
    
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Land token not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { token }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Land token not found'
      });
    }
    const message = error.response?.data?.message || 'Error fetching land token';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Create a Fields token
// @route   POST /api/admin/blockchain/tokens/Fields
// @access  Private/Admin
exports.createFieldsToken = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/tokens/Fields', { req, data: req.body });
    
    const token = data?.data?.token || data?.token || data?.data || data;
    
    res.status(201).json({
      success: true,
      message: 'Fields token created successfully',
      data: { token }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating Fields token';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Create a farmhouse token
// @route   POST /api/admin/blockchain/tokens/farmhouse
// @access  Private/Admin
exports.createFarmhouseToken = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcPost('/api/blockchain/tokens/farmhouse', { req, data: req.body });
    
    const token = data?.data?.token || data?.token || data?.data || data;
    
    res.status(201).json({
      success: true,
      message: 'Farmhouse token created successfully',
      data: { token }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating farmhouse token';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get marketplace data
// @route   GET /api/admin/blockchain/market
// @access  Private/Admin
exports.getMarketplaceData = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet('/api/blockchain/market', { req });
    
    const marketData = data?.data?.marketData || data?.marketData || data?.data || data;
    
    res.status(200).json({
      success: true,
      data: { marketData }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error fetching marketplace data';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});