const mongoose = require('mongoose');

const RefVarietySchema = new mongoose.Schema({
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'RefCrop', required: true, index: true },
  cropSlug: { type: String, required: true, index: true }, // denormalized
  name: { type: String, required: true },                  // e.g., 'MTU-1010'
  season: { type: String },                                // 'Kharif' | 'Rabi' | 'Zaid' | 'Multi'
  zone: { type: String },                                  // 'NWPZ', 'CZ', etc.
  maturityDays: { type: Number },
  type: { type: String },                                  // 'Basmati', 'Hybrid', 'OPV', ...
  releasedBy: { type: String },                            // 'ICAR-IARI', ...
  yearOfRelease: { type: Number },
  notes: { type: String },
  source: { type: String }
}, { timestamps: true, collection: 'ref_varieties' });

//RefVarietySchema.index({ cropSlug: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('RefVariety', RefVarietySchema);
