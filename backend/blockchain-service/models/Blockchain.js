const mongoose = require('mongoose');

// Blockchain Transaction Schema
const blockchainTransactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  fromAddress: {
    type: String,
    required: true
  },
  toAddress: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  tokenType: {
    type: String,
    enum: ['AGM', 'Fields', 'FARMHOUSE', 'OTHER'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  gasUsed: Number,
  gasPrice: Number,
  blockNumber: Number,
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'],
    default: 'private'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Smart Contract Schema
const smartContractSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    required: true,
    unique: true
  },
  contractName: {
    type: String,
    required: true
  },
  contractType: {
    type: String,
    enum: ['token', 'marketplace', 'supply_chain', 'yield_sharing', 'Fields_ownership', 'other'],
    required: true
  },
  abi: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  bytecode: String,
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'],
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['deployed', 'active', 'inactive', 'deprecated'],
    default: 'deployed'
  },
  deploymentTransaction: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Wallet Schema
const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  privateKey: {
    type: String,
    required: true
  },
  balances: [{
    tokenType: {
      type: String,
      enum: ['AGM', 'Fields', 'FARMHOUSE', 'OTHER'],
      required: true
    },
    amount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'],
    default: 'private'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Token Schema
const tokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  tokenType: {
    type: String,
    enum: ['ERC20', 'ERC721', 'ERC1155'],
    required: true
  },
  contractAddress: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousOwners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferDate: Date,
    transactionHash: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  assetType: {
    type: String,
    enum: ['Fields', 'farmhouse', 'equipment', 'crop_yield', 'other'],
    required: true
  },
  assetDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  value: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    lastValuation: Date
  },
  fractionalOwnership: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    totalShares: Number,
    availableShares: Number,
    pricePerShare: Number,
    minInvestment: Number,
    maxInvestment: Number
  },
  yieldSharing: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    yieldPercentage: Number,
    distributionFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    lastDistribution: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'burned'],
    default: 'active'
  },
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'polygon', 'polygon_testnet', 'private'],
    default: 'private'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Fractional Offering Schema
const fractionalOfferingSchema = new mongoose.Schema({
  offeringId: {
    type: String,
    required: true,
    unique: true
  },
  parentToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalShares: {
    type: Number,
    required: true,
    min: 1
  },
  availableShares: {
    type: Number,
    required: true
  },
  pricePerShare: {
    type: Number,
    required: true,
    min: 0
  },
  minInvestment: {
    type: Number,
    required: true,
    min: 0
  },
  maxInvestment: {
    type: Number,
    min: 0
  },
  description: String,
  terms: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Investment Schema
const investmentSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offering: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FractionalOffering',
    required: true
  },
  shares: {
    type: Number,
    required: true,
    min: 1
  },
  investmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerShare: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  transactionHash: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const BlockchainTransaction = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);
const SmartContract = mongoose.model('SmartContract', smartContractSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const Token = mongoose.model('Token', tokenSchema);
const FractionalOffering = mongoose.model('FractionalOffering', fractionalOfferingSchema);
const Investment = mongoose.model('Investment', investmentSchema);

module.exports = {
  BlockchainTransaction,
  SmartContract,
  Wallet,
  Token,
  FractionalOffering,
  Investment
};
