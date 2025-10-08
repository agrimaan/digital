const mongoose = require('mongoose');
const SoilType = require('../models/SoilType');
const IrrigationType = require('../models/IrrigationType');
const CropType = require('../models/CropType');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📊 Connected to MongoDB for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const soilTypesData = [
  {
    name: 'Clay',
    code: 'CLAY',
    description: 'Fine-grained soil with excellent water retention but poor drainage',
    characteristics: {
      drainage: 'poor',
      fertility: 'high',
      phRange: { min: 6.0, max: 7.5 },
      organicMatter: 'high'
    },
    suitableCrops: ['Rice', 'Wheat', 'Cotton', 'Sugarcane'],
    recommendedPractices: [
      { practice: 'Deep plowing', description: 'Improves soil structure and drainage' },
      { practice: 'Organic matter addition', description: 'Enhances soil structure and fertility' }
    ],
    displayOrder: 1
  },
  {
    name: 'Sandy',
    code: 'SANDY',
    description: 'Coarse-grained soil with excellent drainage but low water retention',
    characteristics: {
      drainage: 'excellent',
      fertility: 'low',
      phRange: { min: 5.5, max: 7.0 },
      organicMatter: 'low'
    },
    suitableCrops: ['Groundnut', 'Millets', 'Watermelon', 'Carrots'],
    recommendedPractices: [
      { practice: 'Frequent irrigation', description: 'Compensates for low water retention' },
      { practice: 'Organic mulching', description: 'Improves water retention and fertility' }
    ],
    displayOrder: 2
  },
  {
    name: 'Loamy',
    code: 'LOAMY',
    description: 'Well-balanced soil with good drainage and water retention',
    characteristics: {
      drainage: 'good',
      fertility: 'high',
      phRange: { min: 6.0, max: 7.5 },
      organicMatter: 'moderate'
    },
    suitableCrops: ['Tomatoes', 'Corn', 'Soybeans', 'Potatoes', 'Most vegetables'],
    recommendedPractices: [
      { practice: 'Regular composting', description: 'Maintains soil fertility and structure' },
      { practice: 'Crop rotation', description: 'Prevents nutrient depletion' }
    ],
    displayOrder: 3
  },
  {
    name: 'Silty',
    code: 'SILTY',
    description: 'Fine particles with good fertility but moderate drainage',
    characteristics: {
      drainage: 'moderate',
      fertility: 'very_high',
      phRange: { min: 6.5, max: 7.8 },
      organicMatter: 'high'
    },
    suitableCrops: ['Wheat', 'Barley', 'Oats', 'Vegetables'],
    recommendedPractices: [
      { practice: 'Avoid overwatering', description: 'Prevents waterlogging and compaction' },
      { practice: 'Add organic matter', description: 'Improves soil structure' }
    ],
    displayOrder: 4
  },
  {
    name: 'Peaty',
    code: 'PEATY',
    description: 'Organic-rich soil with high water retention and acidity',
    characteristics: {
      drainage: 'poor',
      fertility: 'very_high',
      phRange: { min: 3.5, max: 5.5 },
      organicMatter: 'high'
    },
    suitableCrops: ['Blueberries', 'Cranberries', 'Potatoes', 'Brassicas'],
    recommendedPractices: [
      { practice: 'Lime application', description: 'Reduces acidity to suitable levels' },
      { practice: 'Drainage improvement', description: 'Prevents waterlogging' }
    ],
    displayOrder: 5
  },
  {
    name: 'Chalky',
    code: 'CHALKY',
    description: 'Alkaline soil with good drainage but can be nutrient-poor',
    characteristics: {
      drainage: 'good',
      fertility: 'moderate',
      phRange: { min: 7.5, max: 8.5 },
      organicMatter: 'low'
    },
    suitableCrops: ['Cabbage', 'Spinach', 'Beets', 'Asparagus'],
    recommendedPractices: [
      { practice: 'Organic matter addition', description: 'Improves fertility and structure' },
      { practice: 'Iron supplementation', description: 'Prevents iron deficiency in alkaline conditions' }
    ],
    displayOrder: 6
  }
];

const irrigationTypesData = [
  {
    name: 'Drip Irrigation',
    code: 'DRIP',
    description: 'Water-efficient system delivering water directly to plant roots',
    characteristics: {
      efficiency: 'very_high',
      waterUsage: 'low',
      costLevel: 'high',
      maintenanceLevel: 'moderate'
    },
    suitableFor: {
      soilTypes: ['Sandy', 'Loamy', 'Clay'],
      cropTypes: ['Vegetables', 'Fruits', 'Cash crops'],
      fieldSizes: ['small', 'medium', 'large']
    },
    advantages: [
      'Water conservation (90-95% efficiency)',
      'Reduced weed growth',
      'Precise nutrient delivery',
      'Suitable for uneven terrain'
    ],
    disadvantages: [
      'High initial investment',
      'Requires regular maintenance',
      'Clogging issues with poor water quality',
      'Technical expertise needed'
    ],
    installationRequirements: [
      { requirement: 'Water source', description: 'Clean, filtered water supply' },
      { requirement: 'Pressure system', description: 'Pump or elevated tank for water pressure' },
      { requirement: 'Filtration', description: 'Screen and disc filters to prevent clogging' }
    ],
    displayOrder: 1
  },
  {
    name: 'Sprinkler',
    code: 'SPRINKLER',
    description: 'Overhead irrigation system mimicking natural rainfall',
    characteristics: {
      efficiency: 'high',
      waterUsage: 'moderate',
      costLevel: 'moderate',
      maintenanceLevel: 'low'
    },
    suitableFor: {
      soilTypes: ['Sandy', 'Loamy', 'Silty'],
      cropTypes: ['Cereals', 'Vegetables', 'Fodder'],
      fieldSizes: ['medium', 'large', 'very_large']
    },
    advantages: [
      'Good coverage for large areas',
      'Suitable for most crops',
      'Can be automated',
      'Moderate water efficiency (75-85%)'
    ],
    disadvantages: [
      'Water loss due to evaporation',
      'Wind can affect distribution',
      'Not suitable for tall crops',
      'Higher water consumption than drip'
    ],
    installationRequirements: [
      { requirement: 'Pressure system', description: 'Adequate water pressure for sprinkler operation' },
      { requirement: 'Sprinkler heads', description: 'Quality sprinkler heads for uniform distribution' },
      { requirement: 'Timer system', description: 'Automated timing for efficient operation' }
    ],
    displayOrder: 2
  },
  {
    name: 'Surface Irrigation',
    code: 'SURFACE',
    description: 'Traditional flood irrigation method using gravity flow',
    characteristics: {
      efficiency: 'low',
      waterUsage: 'high',
      costLevel: 'low',
      maintenanceLevel: 'low'
    },
    suitableFor: {
      soilTypes: ['Clay', 'Silty'],
      cropTypes: ['Rice', 'Wheat', 'Sugarcane'],
      fieldSizes: ['large', 'very_large']
    },
    advantages: [
      'Low initial cost',
      'Simple operation',
      'No energy requirements',
      'Suitable for level fields'
    ],
    disadvantages: [
      'High water consumption',
      'Uneven water distribution',
      'Soil erosion risk',
      'Waterlogging potential'
    ],
    installationRequirements: [
      { requirement: 'Level fields', description: 'Proper field leveling for uniform water distribution' },
      { requirement: 'Water channels', description: 'Main and field channels for water distribution' },
      { requirement: 'Drainage system', description: 'Proper drainage to prevent waterlogging' }
    ],
    displayOrder: 3
  },
  {
    name: 'Subsurface Irrigation',
    code: 'SUBSURFACE',
    description: 'Underground irrigation system for deep root watering',
    characteristics: {
      efficiency: 'very_high',
      waterUsage: 'low',
      costLevel: 'very_high',
      maintenanceLevel: 'high'
    },
    suitableFor: {
      soilTypes: ['Sandy', 'Loamy'],
      cropTypes: ['Perennial crops', 'Orchards', 'Vineyards'],
      fieldSizes: ['small', 'medium']
    },
    advantages: [
      'Maximum water efficiency',
      'No surface evaporation',
      'Reduced weed growth',
      'No interference with field operations'
    ],
    disadvantages: [
      'Very high installation cost',
      'Difficult to repair',
      'Root intrusion issues',
      'Requires expert installation'
    ],
    installationRequirements: [
      { requirement: 'Soil analysis', description: 'Detailed soil profile analysis' },
      { requirement: 'Professional installation', description: 'Expert installation required' },
      { requirement: 'Monitoring system', description: 'Soil moisture monitoring system' }
    ],
    displayOrder: 4
  },
  {
    name: 'None',
    code: 'NONE',
    description: 'Rain-fed agriculture without artificial irrigation',
    characteristics: {
      efficiency: 'moderate',
      waterUsage: 'low',
      costLevel: 'low',
      maintenanceLevel: 'low'
    },
    suitableFor: {
      soilTypes: ['Clay', 'Loamy', 'Silty'],
      cropTypes: ['Rain-fed crops', 'Drought-resistant varieties'],
      fieldSizes: ['small', 'medium', 'large', 'very_large']
    },
    advantages: [
      'No irrigation costs',
      'Natural water source',
      'Environmentally sustainable',
      'Low maintenance'
    ],
    disadvantages: [
      'Weather dependent',
      'Seasonal limitations',
      'Yield uncertainty',
      'Drought risk'
    ],
    installationRequirements: [
      { requirement: 'Rainfall analysis', description: 'Study of local rainfall patterns' },
      { requirement: 'Drought-resistant varieties', description: 'Selection of appropriate crop varieties' },
      { requirement: 'Water conservation', description: 'Soil moisture conservation techniques' }
    ],
    displayOrder: 5
  }
];

const cropTypesData = [
  {
    name: 'Rice',
    code: 'RICE',
    scientificName: 'Oryza sativa',
    category: 'cereal',
    description: 'Staple cereal crop requiring flooded conditions',
    growthCharacteristics: {
      duration: { min: 90, max: 150 },
      seasons: ['monsoon', 'summer'],
      temperatureRange: { min: 20, max: 35 },
      rainfallRequirement: { min: 1000, max: 2000 },
      soilPh: { min: 5.5, max: 7.0 }
    },
    suitableSoilTypes: ['Clay', 'Silty'],
    irrigationRequirements: ['Surface Irrigation', 'Flood'],
    yieldEstimate: { min: 3000, max: 6000, unit: 'kg/hectare' },
    nutritionalValue: {
      protein: 7.1,
      carbohydrates: 78.9,
      fat: 0.7,
      fiber: 1.3,
      vitamins: [
        { name: 'Thiamine (B1)', amount: 0.07, unit: 'mg/100g' },
        { name: 'Niacin (B3)', amount: 1.6, unit: 'mg/100g' }
      ],
      minerals: [
        { name: 'Iron', amount: 0.8, unit: 'mg/100g' },
        { name: 'Magnesium', amount: 25, unit: 'mg/100g' }
      ]
    },
    marketInfo: {
      averagePrice: 25,
      priceUnit: 'INR/kg',
      marketDemand: 'very_high',
      exportPotential: 'high'
    },
    displayOrder: 1
  },
  {
    name: 'Wheat',
    code: 'WHEAT',
    scientificName: 'Triticum aestivum',
    category: 'cereal',
    description: 'Major cereal crop for bread and food products',
    growthCharacteristics: {
      duration: { min: 120, max: 150 },
      seasons: ['winter', 'spring'],
      temperatureRange: { min: 12, max: 25 },
      rainfallRequirement: { min: 300, max: 1000 },
      soilPh: { min: 6.0, max: 7.5 }
    },
    suitableSoilTypes: ['Loamy', 'Clay', 'Silty'],
    irrigationRequirements: ['Sprinkler', 'Surface Irrigation'],
    yieldEstimate: { min: 2500, max: 5000, unit: 'kg/hectare' },
    nutritionalValue: {
      protein: 11.8,
      carbohydrates: 71.2,
      fat: 2.5,
      fiber: 12.2,
      vitamins: [
        { name: 'Thiamine (B1)', amount: 0.38, unit: 'mg/100g' },
        { name: 'Folate', amount: 38, unit: 'mcg/100g' }
      ],
      minerals: [
        { name: 'Iron', amount: 3.2, unit: 'mg/100g' },
        { name: 'Zinc', amount: 2.6, unit: 'mg/100g' }
      ]
    },
    marketInfo: {
      averagePrice: 22,
      priceUnit: 'INR/kg',
      marketDemand: 'very_high',
      exportPotential: 'moderate'
    },
    displayOrder: 2
  },
  {
    name: 'Tomato',
    code: 'TOMATO',
    scientificName: 'Solanum lycopersicum',
    category: 'vegetable',
    description: 'Popular vegetable crop with high nutritional value',
    growthCharacteristics: {
      duration: { min: 60, max: 90 },
      seasons: ['summer', 'winter'],
      temperatureRange: { min: 18, max: 29 },
      rainfallRequirement: { min: 600, max: 1200 },
      soilPh: { min: 6.0, max: 6.8 }
    },
    suitableSoilTypes: ['Loamy', 'Sandy'],
    irrigationRequirements: ['Drip Irrigation', 'Sprinkler'],
    yieldEstimate: { min: 25000, max: 60000, unit: 'kg/hectare' },
    nutritionalValue: {
      protein: 0.9,
      carbohydrates: 3.9,
      fat: 0.2,
      fiber: 1.2,
      vitamins: [
        { name: 'Vitamin C', amount: 14, unit: 'mg/100g' },
        { name: 'Vitamin K', amount: 7.9, unit: 'mcg/100g' }
      ],
      minerals: [
        { name: 'Potassium', amount: 237, unit: 'mg/100g' },
        { name: 'Folate', amount: 15, unit: 'mcg/100g' }
      ]
    },
    marketInfo: {
      averagePrice: 30,
      priceUnit: 'INR/kg',
      marketDemand: 'high',
      exportPotential: 'moderate'
    },
    displayOrder: 3
  },
  {
    name: 'Corn',
    code: 'CORN',
    scientificName: 'Zea mays',
    category: 'cereal',
    description: 'Versatile cereal crop for food, feed, and industrial use',
    growthCharacteristics: {
      duration: { min: 90, max: 120 },
      seasons: ['summer', 'monsoon'],
      temperatureRange: { min: 21, max: 30 },
      rainfallRequirement: { min: 500, max: 800 },
      soilPh: { min: 5.8, max: 6.8 }
    },
    suitableSoilTypes: ['Loamy', 'Sandy', 'Silty'],
    irrigationRequirements: ['Sprinkler', 'Surface Irrigation'],
    yieldEstimate: { min: 4000, max: 8000, unit: 'kg/hectare' },
    nutritionalValue: {
      protein: 9.4,
      carbohydrates: 74.3,
      fat: 4.7,
      fiber: 7.3,
      vitamins: [
        { name: 'Thiamine (B1)', amount: 0.39, unit: 'mg/100g' },
        { name: 'Vitamin C', amount: 6.8, unit: 'mg/100g' }
      ],
      minerals: [
        { name: 'Magnesium', amount: 127, unit: 'mg/100g' },
        { name: 'Phosphorus', amount: 210, unit: 'mg/100g' }
      ]
    },
    marketInfo: {
      averagePrice: 18,
      priceUnit: 'INR/kg',
      marketDemand: 'high',
      exportPotential: 'moderate'
    },
    displayOrder: 4
  },
  {
    name: 'Soybean',
    code: 'SOYBEAN',
    scientificName: 'Glycine max',
    category: 'pulse',
    description: 'High-protein legume crop with nitrogen-fixing properties',
    growthCharacteristics: {
      duration: { min: 90, max: 120 },
      seasons: ['monsoon', 'summer'],
      temperatureRange: { min: 20, max: 30 },
      rainfallRequirement: { min: 450, max: 700 },
      soilPh: { min: 6.0, max: 7.0 }
    },
    suitableSoilTypes: ['Loamy', 'Clay', 'Silty'],
    irrigationRequirements: ['Sprinkler', 'Surface Irrigation'],
    yieldEstimate: { min: 1500, max: 3000, unit: 'kg/hectare' },
    nutritionalValue: {
      protein: 36.5,
      carbohydrates: 30.2,
      fat: 19.9,
      fiber: 9.3,
      vitamins: [
        { name: 'Folate', amount: 375, unit: 'mcg/100g' },
        { name: 'Vitamin K', amount: 47, unit: 'mcg/100g' }
      ],
      minerals: [
        { name: 'Iron', amount: 15.7, unit: 'mg/100g' },
        { name: 'Calcium', amount: 277, unit: 'mg/100g' }
      ]
    },
    marketInfo: {
      averagePrice: 45,
      priceUnit: 'INR/kg',
      marketDemand: 'high',
      exportPotential: 'high'
    },
    displayOrder: 5
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await SoilType.deleteMany({});
    await IrrigationType.deleteMany({});
    await CropType.deleteMany({});

    console.log('🗑️  Cleared existing reference data');

    // Seed soil types
    const soilTypes = await SoilType.insertMany(soilTypesData);
    console.log(`✅ Seeded ${soilTypes.length} soil types`);

    // Seed irrigation types
    const irrigationTypes = await IrrigationType.insertMany(irrigationTypesData);
    console.log(`✅ Seeded ${irrigationTypes.length} irrigation types`);

    // Seed crop types
    const cropTypes = await CropType.insertMany(cropTypesData);
    console.log(`✅ Seeded ${cropTypes.length} crop types`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeded Data Summary:');
    console.log(`   • Soil Types: ${soilTypes.length}`);
    console.log(`   • Irrigation Types: ${irrigationTypes.length}`);
    console.log(`   • Crop Types: ${cropTypes.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log('📊 Database connection closed');
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedDatabase, soilTypesData, irrigationTypesData, cropTypesData };