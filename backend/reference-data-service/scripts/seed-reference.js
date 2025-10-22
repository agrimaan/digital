/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const RefCrop = require('../models/RefCrop');
const RefVariety = require('../models/RefVariety');
const CropType = require('../models/CropType'); // your existing model

const slugify = (s) =>
  s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const CROPS = [
  { commonName: 'Rice', scientificName: 'Oryza sativa', synonyms: ['paddy'], tags: ['cereal','food-grain'], source: 'AGROVOC/ICAR', category: 'cereal' },
  { commonName: 'Wheat', scientificName: 'Triticum aestivum', tags: ['cereal','food-grain'], source: 'AGROVOC/ICAR', category: 'cereal' },
  { commonName: 'Maize', scientificName: 'Zea mays', tags: ['cereal'], source: 'AGROVOC', category: 'cereal' },
  { commonName: 'Mustard', scientificName: 'Brassica juncea', synonyms: ['rapeseed–mustard'], tags: ['oilseed'], source: 'AGROVOC', category: 'oilseed' },
  { commonName: 'Chickpea', scientificName: 'Cicer arietinum', synonyms: ['gram'], tags: ['pulse'], source: 'AGROVOC', category: 'pulse' },
  { commonName: 'Cotton', scientificName: 'Gossypium hirsutum', tags: ['cash_crop','fiber'], source: 'AGROVOC', category: 'cash_crop' },
  { commonName: 'Sugarcane', scientificName: 'Saccharum officinarum', tags: ['cash_crop'], source: 'AGROVOC', category: 'cash_crop' },
  { commonName: 'Potato', scientificName: 'Solanum tuberosum', tags: ['vegetable'], source: 'AGROVOC', category: 'vegetable' },
  { commonName: 'Tomato', scientificName: 'Solanum lycopersicum', tags: ['vegetable'], source: 'AGROVOC', category: 'vegetable' },
  { commonName: 'Soybean', scientificName: 'Glycine max', tags: ['oilseed'], source: 'AGROVOC', category: 'oilseed' },
];

const VARIETIES = [
  // Rice
  { crop: 'rice', name: 'MTU-1010', season: 'Kharif', zone: 'Peninsular', type: 'Non-basmati', releasedBy: 'ANGRAU', notes: 'AP/Telangana', source: 'ICAR/IRRI' },
  { crop: 'rice', name: 'Swarna (MTU 7029)', season: 'Kharif', zone: 'East', type: 'Non-basmati', releasedBy: 'ANGRAU', source: 'ICAR' },
  { crop: 'rice', name: 'BPT 5204 (Samba Mahsuri)', season: 'Kharif', zone: 'South', type: 'Non-basmati', source: 'ICAR' },
  { crop: 'rice', name: 'Pusa Basmati 1121', season: 'Kharif', zone: 'NWPZ', type: 'Basmati', releasedBy: 'ICAR-IARI', source: 'ICAR' },
  { crop: 'rice', name: 'Pusa 44', season: 'Kharif', zone: 'NWPZ', type: 'Non-basmati', releasedBy: 'ICAR-IARI', source: 'ICAR' },

  // Wheat
  { crop: 'wheat', name: 'HD 2967', season: 'Rabi', zone: 'NWPZ', type: 'Bread wheat', releasedBy: 'ICAR-IARI', source: 'ICAR' },
  { crop: 'wheat', name: 'HD 3086', season: 'Rabi', zone: 'NWPZ', type: 'Bread wheat', releasedBy: 'ICAR-IARI', source: 'ICAR' },
  { crop: 'wheat', name: 'PBW 343', season: 'Rabi', zone: 'NWPZ', type: 'Bread wheat', releasedBy: 'PAU', source: 'ICAR' },
  { crop: 'wheat', name: 'PBW 550', season: 'Rabi', zone: 'NWPZ', type: 'Bread wheat', releasedBy: 'PAU', source: 'ICAR' },

  // Maize
  { crop: 'maize', name: 'HQPM-1', season: 'Kharif', zone: 'North/NE', type: 'Quality protein maize', releasedBy: 'ICAR', source: 'ICAR' },
  { crop: 'maize', name: 'DHM 117', season: 'Kharif', zone: 'CZ/South', type: 'Hybrid', releasedBy: 'DHM', source: 'ICAR' },

  // Mustard
  { crop: 'mustard', name: 'Pusa Bold', season: 'Rabi', zone: 'NWPZ', type: 'Bold seeded', releasedBy: 'ICAR-IARI', source: 'ICAR' },
  { crop: 'mustard', name: 'Varuna', season: 'Rabi', zone: 'NWPZ', type: 'Popular', releasedBy: 'ICAR', source: 'ICAR' },

  // Chickpea
  { crop: 'chickpea', name: 'JG 11', season: 'Rabi', zone: 'CZ/South', type: 'Desi', releasedBy: 'ICRISAT/ANGRAU', source: 'ICAR/ICRISAT' },
  { crop: 'chickpea', name: 'Pusa 372', season: 'Rabi', zone: 'NWPZ', type: 'Desi', releasedBy: 'ICAR-IARI', source: 'ICAR' },

  // Cotton
  { crop: 'cotton', name: 'RCH 134', zone: 'CZ', type: 'Hybrid', source: 'Public' },
  { crop: 'cotton', name: 'NHH 44', zone: 'CZ', type: 'Hybrid', source: 'Public' },

  // Sugarcane
  { crop: 'sugarcane', name: 'Co 0238', zone: 'North', type: 'Early maturing', source: 'ICAR' },
  { crop: 'sugarcane', name: 'Co 86032', zone: 'South', type: 'Popular', source: 'ICAR' },

  // Potato
  { crop: 'potato', name: 'Kufri Jyoti', season: 'Rabi', zone: 'Hills/Plains', type: 'Table', releasedBy: 'ICAR-CPRI', source: 'ICAR' },
  { crop: 'potato', name: 'Kufri Bahar', season: 'Rabi', zone: 'Plains', type: 'Table', releasedBy: 'ICAR-CPRI', source: 'ICAR' },

  // Tomato
  { crop: 'tomato', name: 'Arka Vikas', season: 'Multi', zone: 'All India', type: 'OPV', releasedBy: 'IIHR', source: 'IIHR' },
  { crop: 'tomato', name: 'Pusa Ruby', season: 'Multi', zone: 'All India', type: 'OPV', releasedBy: 'ICAR-IARI', source: 'ICAR' },

  // Soybean
  { crop: 'soybean', name: 'JS 335', season: 'Kharif', zone: 'CZ', type: 'Popular', source: 'ICAR' },
];

function cropTypeDefaults(c) {
  // CropType has many required fields; provide sensible defaults
  return {
    name: c.commonName,
    code: slugify(c.commonName).toUpperCase(),        // e.g. RICE
    scientificName: c.scientificName,
    category: c.category || 'other',
    description: `Reference entry for ${c.commonName}.`,
    growthCharacteristics: {
      duration: { min: 80, max: 180 },
      seasons: ['year_round'],
      temperatureRange: { min: 10, max: 40 },
      rainfallRequirement: { min: 200, max: 2000 },
      soilPh: { min: 5.5, max: 8.0 }
    },
    suitableSoilTypes: ['loam'],
    irrigationRequirements: ['drip','sprinkler','flood','rainfed'],
    yieldEstimate: { min: 1000, max: 7000, unit: 'kg/hectare' },
    nutritionalValue: {},
    marketInfo: {},
    commonDiseases: [],
    commonPests: [],
    cultivationPractices: [],
    isActive: true,
    displayOrder: 0
  };
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrimaan_reference';
  console.log('[seed] connecting', uri);
  await mongoose.connect(uri);

  // 1) Upsert RefCrop and remember ids by slug
  const slugToId = {};
  for (const c of CROPS) {
    const slug = slugify(c.commonName);
    const update = {
      $set: {
        slug,
        commonName: c.commonName,
        scientificName: c.scientificName,
        synonyms: c.synonyms || [],
        tags: c.tags || [],
        source: c.source || 'seed'
      }
    };
    const doc = await RefCrop.findOneAndUpdate({ slug }, update, {
      new: true, upsert: true, setDefaultsOnInsert: true
    });
    slugToId[slug] = doc._id;
    console.log('RefCrop upsert:', slug, '->', String(doc._id));

    // 1b) Also ensure a minimal CropType row exists (so older code continues to work)
    const ctDefaults = cropTypeDefaults(c);
    // remove fields we also set in $set to avoid conflicts
    const { scientificName, category, ...onlyInsert } = ctDefaults; 
    await CropType.findOneAndUpdate(
        { code: ctDefaults.code },
        {
          $setOnInsert: onlyInsert,
          $set: {
            scientificName: c.scientificName,
            category: c.category || 'other',
          },
        },
        { new: true, upsert: true }
    );
  }

  // 2) Upsert RefVariety (unique per cropSlug+name)
  for (const v of VARIETIES) {
    const cropSlug = slugify(v.crop);
    const cropId = slugToId[cropSlug];
    if (!cropId) {
      console.warn(`skip variety ${v.name}: unknown crop ${v.crop}`);
      continue;
    }
    const filter = { cropSlug, name: v.name };
    const update = {
      $set: {
        cropId,
        cropSlug,
        name: v.name,
        season: v.season || undefined,
        zone: v.zone || undefined,
        maturityDays: v.maturityDays || undefined,
        type: v.type || undefined,
        releasedBy: v.releasedBy || undefined,
        yearOfRelease: v.yearOfRelease || undefined,
        notes: v.notes || undefined,
        source: v.source || 'seed'
      }
    };
    await RefVariety.findOneAndUpdate(filter, update, {
      new: true, upsert: true, setDefaultsOnInsert: true
    });
    console.log('RefVariety upsert:', cropSlug, '::', v.name);
  }

  console.log('[seed] done');
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
