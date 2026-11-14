#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const { seedDeposits, clearDeposits } = require('../seeds/depositSeedData');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function main() {
  try {
    console.log('🚀 Starting deposit seeding process...\n');

    const command = process.argv[2];

    if (command === '--clear' || command === '-c') {
      await clearDeposits();
      console.log('\n✅ Deposits cleared successfully!');
    } else if (command === '--seed' || command === '-s' || !command) {
      await seedDeposits();
      console.log('\n✅ Deposits seeded successfully!');
    } else if (command === '--help' || command === '-h') {
      console.log(`
🌱 Deposit Seed Script

Usage:
  node seedDeposits.js [command]

Commands:
  --seed, -s     Seed deposits (default)
  --clear, -c    Clear all deposits
  --help, -h     Show this help message

Examples:
  node seedDeposits.js          # Seed deposits
  node seedDeposits.js --seed   # Seed deposits
  node seedDeposits.js --clear  # Clear deposits
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
