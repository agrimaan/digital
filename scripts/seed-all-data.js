/**
 * Master Seed Script
 * 
 * This script runs all seed scripts for different services
 */

const { spawn } = require('child_process');
const path = require('path');

const seedScripts = [
  {
    name: 'Reference Data Service',
    path: path.join(__dirname, '../backend/reference-data-service/scripts/seed-reference-data.js'),
    cwd: path.join(__dirname, '../backend/reference-data-service')
  },
  {
    name: 'Admin Service',
    path: path.join(__dirname, '../backend/admin-service/scripts/seed-data.js'),
    cwd: path.join(__dirname, '../backend/admin-service')
  }
];

const runSeedScript = (script) => {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌱 Running seed script: ${script.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const child = spawn('node', [script.path], {
      cwd: script.cwd,
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${script.name} seeding completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${script.name} seeding failed with code ${code}`);
        reject(new Error(`Seeding failed for ${script.name}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Error running ${script.name}:`, error);
      reject(error);
    });
  });
};

const seedAll = async () => {
  console.log('\n🚀 Starting master seed process...\n');
  
  try {
    for (const script of seedScripts) {
      await runSeedScript(script);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All seed scripts completed successfully!');
    console.log('='.repeat(60) + '\n');
    
    console.log('📝 Summary:');
    console.log('  - Reference data seeded');
    console.log('  - Admin user created (admin@agrimaan.com / Admin@123)');
    console.log('  - System settings configured');
    console.log('\n⚠️  Remember to change the default admin password!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Master seed process failed:', error.message);
    process.exit(1);
  }
};

// Run master seed
seedAll();