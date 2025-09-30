// MongoDB data seeding script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sample data
const users = [
  {
    name: 'John Farmer',
    email: 'farmer@example.com',
    password: 'password123',
    role: 'farmer',
    phone: '+1234567890'
  },
  {
    name: 'Jane Buyer',
    email: 'buyer@example.com',
    password: 'password123',
    role: 'buyer',
    phone: '+0987654321'
  }
];

const crops = [
  {
    name: 'Organic Tomatoes',
    type: 'Vegetable',
    quantity: 100,
    price: 2.5,
    farmerId: null,
    location: 'Farm A'
  },
  {
    name: 'Fresh Lettuce',
    type: 'Vegetable',
    quantity: 50,
    price: 1.8,
    farmerId: null,
    location: 'Farm B'
  }
];

// Connect and seed
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/agrimaan')
  .then(() => {
    console.log('Connected to MongoDB');
    // Seed data here
  })
  .catch(err => console.error(err));
