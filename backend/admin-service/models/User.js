// microservices/admin-service/src/models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    // Adjust the roles if your app has different ones
    role: {
      type: String,
      enum: ['admin', 'farmer', 'buyer'],
      default: 'farmer',
      index: true,
    },

    active: { type: Boolean, default: true },

    // Never return this in API responses
    passwordHash: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

// Clean output: hide passwordHash and __v in JSON
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

// Helpful compound index example (optional):
// UserSchema.index({ role: 1, active: 1, createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
