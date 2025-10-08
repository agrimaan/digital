const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📊 Reference Data Service MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit the process, just log the error and continue
    console.log('⚠️  Continuing without database connection - using in-memory mode');
  }
};

module.exports = connectDB;