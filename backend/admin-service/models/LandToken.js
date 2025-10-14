const mongoose = require('mongoose');

const landTokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  tokenValue: {
    type: Number,
    required: true,
    min: 0
  },
  tokenType: {
    type: String,
    default: 'Fields'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred'],
    default: 'active'
  },
  createdDate: {
    type: Date,
    default: Date.now
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

module.exports = mongoose.model('LandToken', landTokenSchema);
