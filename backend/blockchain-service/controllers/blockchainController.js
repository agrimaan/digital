const { validationResult } = require('express-validator');
const { BlockchainTransaction, SmartContract, Wallet, Token, FractionalOffering, Investment } = require('../models/Blockchain');
const blockchainService = require('../services/blockchainService');
const User = require('../models/User'); // We'll need to import this properly

/**
 * @desc    Get all blockchain transactions for a user
 * @route   GET /blockchain/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      tokenType: req.query.tokenType,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };
    
    const transactions = await blockchainService.getTransactionHistory(req.user.id, options);
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get transaction by ID
 * @route   GET /blockchain/transactions/:id
 * @access  Private
 */
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await BlockchainTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if user is involved in the transaction
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    if (transaction.fromAddress !== wallet.address && 
        transaction.toAddress !== wallet.address && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error('Error fetching transaction:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create a new blockchain transaction
 * @route   POST /blockchain/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    const { toAddress, amount, tokenType, metadata } = req.body;
    
    // Get user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check if wallet is active
    if (wallet.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Wallet is not active'
      });
    }
    
    // Check balance
    const tokenBalance = wallet.balances.find(b => b.tokenType === tokenType);
    if (!tokenBalance || tokenBalance.amount < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // In a real implementation, we would interact with the blockchain here
    // For now, we'll simulate a blockchain transaction
    
    // Create transaction record
    const newTransaction = new BlockchainTransaction({
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Simulated hash
      fromAddress: wallet.address,
      toAddress,
      amount,
      tokenType,
      status: 'pending',
      metadata
    });
    
    const transaction = await newTransaction.save();
    
    // Update wallet balances (in a real implementation, this would happen after blockchain confirmation)
    // Deduct from sender
    await Wallet.findOneAndUpdate(
      { address: wallet.address, 'balances.tokenType': tokenType },
      { $inc: { 'balances.$.amount': -amount } }
    );
    
    // Add to recipient (if they have a wallet in our system)
    const recipientWallet = await Wallet.findOne({ address: toAddress });
    if (recipientWallet) {
      const hasToken = recipientWallet.balances.some(b => b.tokenType === tokenType);
      
      if (hasToken) {
        await Wallet.findOneAndUpdate(
          { address: toAddress, 'balances.tokenType': tokenType },
          { $inc: { 'balances.$.amount': amount } }
        );
      } else {
        await Wallet.findOneAndUpdate(
          { address: toAddress },
          { $push: { balances: { tokenType, amount } } }
        );
      }
    }
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (err) {
    console.error('Error creating transaction:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Transfer AGM tokens
 * @route   POST /blockchain/transfer
 * @access  Private
 */
exports.transferTokens = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    const { toAddress, amount } = req.body;
    
    const transaction = await blockchainService.transferTokens(
      req.user.id,
      toAddress,
      parseFloat(amount)
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Transfer completed successfully'
    });
  } catch (err) {
    console.error('Error transferring tokens:', err.message);
    if (err.message === 'Wallet not found' || err.message === 'Insufficient balance') {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get all smart contracts
 * @route   GET /blockchain/contracts
 * @access  Private/Admin
 */
exports.getContracts = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const contracts = await SmartContract.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: contracts,
      count: contracts.length
    });
  } catch (err) {
    console.error('Error fetching contracts:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get smart contract by ID
 * @route   GET /blockchain/contracts/:id
 * @access  Private
 */
exports.getContractById = async (req, res) => {
  try {
    const contract = await SmartContract.findById(req.params.id)
      .populate('owner', 'name email');
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Smart contract not found'
      });
    }
    
    res.json({
      success: true,
      data: contract
    });
  } catch (err) {
    console.error('Error fetching contract:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Smart contract not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Deploy a new smart contract
 * @route   POST /blockchain/contracts
 * @access  Private/Admin
 */
exports.createContract = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { contractName, contractType, abi, bytecode, network } = req.body;
    
    // In a real implementation, we would deploy the contract to the blockchain here
    // For now, we'll simulate a contract deployment
    
    const newContract = new SmartContract({
      contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Simulated address
      contractName,
      contractType,
      abi,
      bytecode,
      network,
      owner: req.user.id,
      deploymentTransaction: `0x${Math.random().toString(16).substr(2, 64)}` // Simulated transaction hash
    });
    
    const contract = await newContract.save();
    
    res.status(201).json({
      success: true,
      data: contract,
      message: 'Smart contract deployed successfully'
    });
  } catch (err) {
    console.error('Error deploying contract:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get user's wallet
 * @route   GET /blockchain/wallet
 * @access  Private
 */
exports.getWallet = async (req, res) => {
  try {
    const wallet = await blockchainService.getWallet(req.user.id);
    
    res.json({
      success: true,
      data: wallet
    });
  } catch (err) {
    console.error('Error fetching wallet:', err.message);
    if (err.message === 'Wallet not found') {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create a new wallet for user
 * @route   POST /blockchain/wallet
 * @access  Private
 */
exports.createWallet = async (req, res) => {
  try {
    const wallet = await blockchainService.createWallet(req.user.id);
    
    res.status(201).json({
      success: true,
      data: wallet,
      message: 'Wallet created successfully'
    });
  } catch (err) {
    console.error('Error creating wallet:', err.message);
    if (err.message === 'User already has a wallet') {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get all tokens owned by user
 * @route   GET /blockchain/tokens
 * @access  Private
 */
exports.getTokens = async (req, res) => {
  try {
    const options = {
      tokenType: req.query.tokenType,
      status: req.query.status
    };
    
    const tokens = await blockchainService.getUserTokens(req.user.id, options);
    
    res.json({
      success: true,
      data: tokens,
      count: tokens.length
    });
  } catch (err) {
    console.error('Error fetching tokens:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get token by ID
 * @route   GET /blockchain/tokens/:id
 * @access  Private
 */
exports.getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('previousOwners.user', 'name email');
    
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }
    
    // Check if user is the owner or admin
    if (token.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: token
    });
  } catch (err) {
    console.error('Error fetching token:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create a Fields token
 * @route   POST /blockchain/tokens/Fields
 * @access  Private
 */
exports.createFieldsToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    const FieldsData = req.body;
    
    const token = await blockchainService.createFieldsToken(req.user.id, FieldsData);
    
    res.status(201).json({
      success: true,
      data: token,
      message: 'Fields token created successfully'
    });
  } catch (err) {
    console.error('Error creating Fields token:', err.message);
    if (err.message === 'Wallet not found') {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Create a farmhouse token
 * @route   POST /blockchain/tokens/farmhouse
 * @access  Private
 */
exports.createFarmhouseToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  try {
    const farmhouseData = req.body;
    
    const token = await blockchainService.createFarmhouseToken(req.user.id, farmhouseData);
    
    res.status(201).json({
      success: true,
      data: token,
      message: 'Farmhouse token created successfully'
    });
  } catch (err) {
    console.error('Error creating farmhouse token:', err.message);
    if (err.message === 'Wallet not found') {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};

/**
 * @desc    Get marketplace data
 * @route   GET /blockchain/market
 * @access  Private
 */
exports.getMarketplaceData = async (req, res) => {
  try {
    const marketData = await blockchainService.getMarketplaceData();
    
    res.json({
      success: true,
      data: marketData
    });
  } catch (err) {
    console.error('Error fetching marketplace data:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
};
