const mongoose = require('mongoose');

const RefCropSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true }, // e.g. 'rice'
  commonName: { type: String, required: true },                       // 'Rice'
  scientificName: { type: String, required: true },                   // 'Oryza sativa'
  synonyms: [{ type: String }],                                       // ['paddy']
  tags: [{ type: String }],
  source: { type: String }
}, { timestamps: true, collection: 'ref_crops' });

module.exports = mongoose.model('RefCrop', RefCropSchema);
