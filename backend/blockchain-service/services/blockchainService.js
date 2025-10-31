const { Web3 } = require('web3');
const { BlockchainTransaction, SmartContract, Wallet, Token, FractionalOffering, Investment } = require('../models/Blockchain');
const User = require('../models/User'); // We'll need to create this reference properly

// Initialize Web3 with provider
const web3 = new Web3(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545');

/**
 * Get transaction history for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Transaction history
 */
exports.getTransactionHistory = async (userId, options = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const query = {
      $or: [
        { fromAddress: wallet.address },
        { toAddress: wallet.address }
      ]
    };

    if (options.status) {
      query.status = options.status;
    }

    if (options.tokenType) {
      query.tokenType = options.tokenType;
    }

    const transactions = await BlockchainTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 20)
      .skip(options.skip || 0);

    return transactions;
  } catch (error) {
    throw new Error(`Error fetching transaction history: ${error.message}`);
  }
};

/**
 * Transfer tokens between addresses
 * @param {String} userId - User ID
 * @param {String} toAddress - Recipient address
 * @param {Number} amount - Amount to transfer
 * @param {String} tokenType - Token type
 * @returns {Promise<Object>} Transaction details
 */
exports.transferTokens = async (userId, toAddress, amount, tokenType = 'AGM') => {
  try {
    const fromWallet = await Wallet.findOne({ user: userId });
    if (!fromWallet) {
      throw new Error('Wallet not found');
    }

    if (fromWallet.status !== 'active') {
      throw new Error('Wallet is not active');
    }

    // Check balance
    const tokenBalance = fromWallet.balances.find(b => b.tokenType === tokenType);
    if (!tokenBalance || tokenBalance.amount < amount) {
      throw new Error('Insufficient balance');
    }

    // In a real implementation, we would interact with the blockchain here
    // For now, we'll simulate a blockchain transaction

    // Create transaction record
    const transaction = new BlockchainTransaction({
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      fromAddress: fromWallet.address,
      toAddress,
      amount,
      tokenType,
      status: 'confirmed',
      network: fromWallet.network
    });

    await transaction.save();

    // Update wallet balances
    await Wallet.findOneAndUpdate(
      { address: fromWallet.address, 'balances.tokenType': tokenType },
      { $inc: { 'balances.$.amount': -amount } }
    );

    // Add to recipient if they have a wallet
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

    return transaction;
  } catch (error) {
    throw new Error(`Error transferring tokens: ${error.message}`);
  }
};

/**
 * Get user's wallet
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Wallet details
 */
exports.getWallet = async (userId) => {
  try {
    const wallet = await Wallet.findOne({ user: userId })
      .populate('user', 'name email');
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  } catch (error) {
    throw new Error(`Error fetching wallet: ${error.message}`);
  }
};

/**
 * Create a new wallet for user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} New wallet details
 */
exports.createWallet = async (userId) => {
  try {
    const existingWallet = await Wallet.findOne({ user: userId });
    if (existingWallet) {
      throw new Error('User already has a wallet');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate wallet address and private key (simplified for demo)
    const account = web3.eth.accounts.create();
    
    const wallet = new Wallet({
      user: userId,
      address: account.address,
      privateKey: account.privateKey,
      balances: [
        { tokenType: 'AGM', amount: 1000 }, // Starting balance for demo
        { tokenType: 'Fields', amount: 0 },
        { tokenType: 'FARMHOUSE', amount: 0 }
      ]
    });

    await wallet.save();
    return wallet;
  } catch (error) {
    throw new Error(`Error creating wallet: ${error.message}`);
  }
};

/**
 * Get user's tokenswallet
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} User tokens
 */
exports.getUserTokens = async (userId, options = {}) => {
  try {
    const query = { owner: userId };
    
    if (options.tokenType) {
      query.tokenType = options.tokenType;
    }
    
    if (options.status) {
      query.status = options.status;
    }

    const tokens = await Token.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    return tokens;
  } catch (error) {
    throw new Error(`Error fetching user tokens: ${error.message}`);
  }
};

/**
 * Create a Fields token
 * @param {String} userId - User ID
 * @param {Object} FieldsData - Fields data
 * @returns {Promise<Object>} New token
 */
exports.createFieldsToken = async (userId, FieldsData) => {
  try {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const token = new Token({
      tokenId: Math.floor(Math.random() * 1000000).toString(),
      tokenType: 'ERC721',
      contractAddress: '0x' + Math.random().toString(16).substr(2, 40), // Simulated
      owner: userId,
      metadata: {
        name: FieldsData.name,
        description: FieldsData.description,
        location: FieldsData.location,
        coordinates: FieldsData.coordinates,
        propertyType: FieldsData.propertyType,
        soilType: FieldsData.soilType
      },
      assetType: 'Fields',
      assetDetails: FieldsData,
      network: wallet.network
    });

    await token.save();
    return token;
  } catch (error) {
    throw new Error(`Error creating Fields token: ${error.message}`);
  }
};

/**
 * Create a farmhouse token
 * @param {String} userId - User ID
 * @param {Object} farmhouseData - Farmhouse data
 * @returns {Promise<Object>} New token
 */
exports.createFarmhouseToken = async (userId, farmhouseData) => {
  try {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const token = new Token({
      tokenId: Math.floor(Math.random() * 1000000).toString(),
      tokenType: 'ERC721',
      contractAddress: '0x' + Math.random().toString(16).substr(2, 40), // Simulated
      owner: userId,
      metadata: {
        name: farmhouseData.name,
        description: farmhouseData.description,
        location: farmhouseData.location,
        buildingType: farmhouseData.buildingType,
        facilities: farmhouseData.facilities,
        yearBuilt: farmhouseData.yearBuilt
      },
      assetType: 'farmhouse',
      assetDetails: farmhouseData,
      value: {
        amount: farmhouseData.valuation,
        currency: 'USD',
        lastValuation: new Date()
      },
      network: wallet.network
    });

    await token.save();
    return token;
  } catch (error) {
    throw new Error(`Error creating farmhouse token: ${error.message}`);
  }
};

/**
 * Create a fractional offering
 * @param {String} userId - User ID
 * @param {String} tokenId - Token ID
 * @param {Object} offeringData - Offering data
 * @returns {Promise<Object>} New offering
 */
exports.createFractionalOffering = async (userId, tokenId, offeringData) => {
  try {
    const token = await Token.findOne({ tokenId });
    if (!token) {
      throw new Error('Token not found');
    }

    if (token.owner.toString() !== userId) {
      throw new Error('You do not own this token');
    }

    if (token.fractionalOwnership.isEnabled) {
      throw new Error('Token is already fractionalized');
    }

    const offering = new FractionalOffering({
      offeringId: Math.floor(Math.random() * 1000000).toString(),
      parentToken: token._id,
      creator: userId,
      totalShares: offeringData.totalShares,
      availableShares: offeringData.totalShares,
      pricePerShare: offeringData.pricePerShare,
      minInvestment: offeringData.minInvestment,
      maxInvestment: offeringData.maxInvestment,
      description: offeringData.description,
      terms: offeringData.terms
    });

    // Update token to enable fractional ownership
    token.fractionalOwnership = {
      isEnabled: true,
      totalShares: offeringData.totalShares,
      availableShares: offeringData.totalShares,
      pricePerShare: offeringData.pricePerShare,
      minInvestment: offeringData.minInvestment,
      maxInvestment: offeringData.maxInvestment
    };

    await offering.save();
    await token.save();

    return offering;
  } catch (error) {
    throw new Error(`Error creating fractional offering: ${error.message}`);
  }
};

/**
 * Get total invested shares for an offering
 * @param {String} offeringId - Offering ID
 * @returns {Promise<Number>} Total invested shares
 */
exports.getTotalInvestedShares = async (offeringId) => {
  try {
    const result = await Investment.aggregate([
      { $match: { offering: mongoose.Types.ObjectId(offeringId), status: 'confirmed' } },
      { $group: { _id: null, totalShares: { $sum: '$shares' } } }
    ]);

    return result.length > 0 ? result[0].totalShares : 0;
  } catch (error) {
    throw new Error(`Error calculating invested shares: ${error.message}`);
  }
};

/**
 * Invest in a fractional offering
 * @param {String} userId - User ID
 * @param {String} offeringId - Offering ID
 * @param {Number} shares - Number of shares to invest
 * @returns {Promise<Object>} Investment details
 */
exports.investInOffering = async (userId, offeringId, shares) => {
  try {
    const offering = await FractionalOffering.findById(offeringId)
      .populate('parentToken');
    
    if (!offering) {
      throw new Error('Offering not found');
    }

    if (offering.status !== 'active') {
      throw new Error('Offering is not active');
    }

    const investorWallet = await Wallet.findOne({ user: userId });
    if (!investorWallet) {
      throw new Error('Wallet not found');
    }

    const investmentAmount = shares * offering.pricePerShare;
    const agmBalance = investorWallet.balances.find(b => b.tokenType === 'AGM');

    if (!agmBalance || agmBalance.amount < investmentAmount) {
      throw new Error('Insufficient balance');
    }

    const totalInvestedShares = await this.getTotalInvestedShares(offeringId);
    const availableShares = offering.totalShares - totalInvestedShares;

    if (shares > availableShares) {
      throw new Error(`Only ${availableShares} shares available`);
    }

    if (investmentAmount < offering.minInvestment) {
      throw new Error(`Minimum investment is ${offering.minInvestment} AGM`);
    }

    if (offering.maxInvestment && investmentAmount > offering.maxInvestment) {
      throw new Error(`Maximum investment is ${offering.maxInvestment} AGM`);
    }

    const investment = new Investment({
      investor: userId,
      offering: offeringId,
      shares,
      investmentAmount,
      pricePerShare: offering.pricePerShare,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'confirmed'
    });

    // Update wallet balance
    await Wallet.findOneAndUpdate(
      { user: userId, 'balances.tokenType': 'AGM' },
      { $inc: { 'balances.$.amount': -investmentAmount } }
    );

    // Update offering available shares
    offering.availableShares -= shares;
    await offering.save();

    await investment.save();
    return investment;
  } catch (error) {
    throw new Error(`Error investing in offering: ${error.message}`);
  }
};

/**
 * Get user investments
 * @param {String} userId - User ID
 * @returns {Promise<Array>} User investments
 */
exports.getUserInvestments = async (userId) => {
  try {
    const investments = await Investment.find({ investor: userId })
      .populate('offering')
      .populate('offering.parentToken')
      .sort({ createdAt: -1 });

    return investments;
  } catch (error) {
    throw new Error(`Error fetching user investments: ${error.message}`);
  }
};

/**
 * Get marketplace data
 * @returns {Promise<Object>} Marketplace statistics
 */
exports.getMarketplaceData = async () => {
  try {
    // Get active offerings
    const offerings = await FractionalOffering.find({ status: 'active' })
      .populate('parentToken')
      .populate('creator', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent transactions
    const transactions = await BlockchainTransaction.find({
      status: 'confirmed'
    })
      .sort({ completedAt: -1 })
      .limit(10);

    // Get token stats
    const fieldsTokens = await Token.countDocuments({ assetType: 'Fields' });
    const farmhouseTokens = await Token.countDocuments({ assetType: 'farmhouse' });
    const fractionalizedTokens = await Token.countDocuments({ 'fractionalOwnership.isEnabled': true });

    // Get total AGM in circulation
    const totalAGM = await Wallet.aggregate([
      { $unwind: '$balances' },
      { $match: { 'balances.tokenType': 'AGM' } },
      { $group: { _id: null, total: { $sum: '$balances.amount' } } }
    ]);

    return {
      activeOfferings: offerings.map(offering => ({
        offeringId: offering.offeringId,
        tokenType: offering.parentToken.tokenType,
        name: offering.parentToken.metadata.name,
        creator: offering.creator.name,
        pricePerShare: offering.pricePerShare,
        totalShares: offering.totalShares,
        createdAt: offering.createdAt
      })),
      recentTransactions: transactions.map(tx => ({
        transactionHash: tx.transactionHash,
        amount: tx.amount,
        tokenType: tx.tokenType,
        timestamp: tx.completedAt || tx.createdAt
      })),
      stats: {
        fieldsTokens,
        farmhouseTokens,
        fractionalizedTokens,
        totalAGM: totalAGM.length > 0 ? totalAGM[0].total : 0
      }
    };
  } catch (error) {
    throw new Error(`Error fetching marketplace data: ${error.message}`);
  }
};
