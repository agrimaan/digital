/**
 * Seed Script for Admin Service
 * 
 * This script seeds initial data for the admin service including:
 * - System settings
 * - Initial admin user (if needed)
 * - Reference data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const SystemSettings = require('../models/SystemSettings');
const Admin = require('../models/Admin');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed system settings
const seedSystemSettings = async () => {
  try {
    console.log('🌱 Seeding system settings...');
    
    const existingSettings = await SystemSettings.findOne();
    if (existingSettings) {
      console.log('⚠️  System settings already exist, skipping...');
      return;
    }

    const defaultSettings = new SystemSettings({
      general: {
        siteName: 'Agrimaan Digital',
        siteDescription: 'Digital Agriculture Platform',
        contactEmail: 'admin@agrimaan.com',
        supportEmail: 'support@agrimaan.com',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD'
      },
      authentication: {
        enableOTP: true,
        otpExpiryMinutes: 10,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 30,
        sessionTimeoutMinutes: 60,
        enableTwoFactor: false,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true
      },
      email: {
        provider: 'smtp',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT) || 587,
        smtpSecure: false,
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@agrimaan.com',
        fromName: 'Agrimaan Digital'
      },
      sms: {
        provider: 'twilio',
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        enabled: false
      },
      notifications: {
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        enablePushNotifications: false,
        notifyOnNewUser: true,
        notifyOnNewOrder: true,
        notifyOnSystemError: true
      },
      features: {
        enableMarketplace: true,
        enableBlockchain: true,
        enableIoT: true,
        enableAnalytics: true,
        enableWeatherIntegration: true,
        enableBulkUpload: true,
        maintenanceMode: false
      },
      limits: {
        maxFileUploadSize: 10485760, // 10MB
        maxBulkUploadRecords: 10000,
        maxAPIRequestsPerMinute: 100,
        maxConcurrentSessions: 5
      }
    });

    await defaultSettings.save();
    console.log('✅ System settings seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding system settings:', error);
  }
};

// Seed initial admin user
const seedAdminUser = async () => {
  try {
    console.log('🌱 Seeding admin user...');
    
    const existingAdmin = await Admin.findOne({ email: 'admin@agrimaan.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const adminUser = new Admin({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@agrimaan.com',
      password: hashedPassword,
      role: 'super-admin',
      permissions: [
        'users.read', 'users.write', 'users.delete',
        'fields.read', 'fields.write', 'fields.delete',
        'crops.read', 'crops.write', 'crops.delete',
        'sensors.read', 'sensors.write', 'sensors.delete',
        'orders.read', 'orders.write', 'orders.delete',
        'settings.read', 'settings.write',
        'reports.read', 'reports.write',
        'analytics.read',
        'bulk-upload.read', 'bulk-upload.write'
      ],
      isActive: true,
      emailVerified: true,
      phoneVerified: false
    });

    await adminUser.save();
    console.log('✅ Admin user seeded successfully');
    console.log('📧 Email: admin@agrimaan.com');
    console.log('🔑 Password: Admin@123');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
};

// Main seed function
const seedData = async () => {
  try {
    console.log('🚀 Starting data seeding...\n');
    
    await connectDB();
    await seedSystemSettings();
    await seedAdminUser();
    
    console.log('\n✅ Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run seeding
seedData();