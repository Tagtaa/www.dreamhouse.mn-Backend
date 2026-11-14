#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const { seedPurchases, clearPurchases } = require('../seeds/purchaseSeedData');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function main() {
  try {
    console.log('🚀 Starting purchase seeding process...\n');

    const command = process.argv[2];

    if (command === '--clear' || command === '-c') {
      await clearPurchases();
      console.log('\n✅ Purchases cleared successfully!');
    } else if (command === '--seed' || command === '-s' || !command) {
      await seedPurchases();
      console.log('\n✅ Purchases seeded successfully!');
    } else if (command === '--help' || command === '-h') {
      console.log(`
🌱 Purchase Seed Script

Usage:
  node seedPurchases.js [command]

Commands:
  --seed, -s     Seed purchases (default)
  --clear, -c    Clear all purchases
  --help, -h     Show this help message

Examples:
  node seedPurchases.js          # Seed purchases
  node seedPurchases.js --seed   # Seed purchases
  node seedPurchases.js --clear  # Clear purchases
      `);
    } else {
      console.log(`❌ Unknown command: ${command}`);
      console.log('Use --help for usage information');
      process.exit(1);
    }

    console.log('\n🎉 Process completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Process terminated. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run main function
main();
