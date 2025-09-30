/**
 * Script to create the default admin user
 * 
 * Usage:
 * node create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@agrimaan.io' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.disconnect();
      return;
    }
    
    // Create admin user
    const adminUser = new Admin({
      name: 'Agrimaan Admin',
      email: 'admin@agrimaan.io',
      password: 'uu4491nj', // Will be hashed by the pre-save hook
      phone: '+911234567890',
      role: 'admin',
      isSystemAdmin: true,
      address: {
        street: 'Admin Office',
        city: 'Agrimaan HQ',
        state: 'Lucknow',
        country: 'India',
        zipCode: '226001'
      }
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error creating admin user:', err);
    mongoose.disconnect();
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});