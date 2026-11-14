#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const { seedWithdrawals, clearWithdrawals } = require('../seeds/withdrawSeedData');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function main() {
  try {
    console.log('🚀 Starting withdraw seeding process...\n');

    const command = process.argv[2];

    if (command === '--clear' || command === '-c') {
      await clearWithdrawals();
      console.log('\n✅ Withdrawals cleared successfully!');
    } else if (command === '--seed' || command === '-s' || !command) {
      await seedWithdrawals();
      console.log('\n✅ Withdrawals seeded successfully!');
    } else if (command === '--help' || command === '-h') {
      console.log(`
🌱 Withdraw Seed Script

Usage:
  node seedWithdrawals.js [command]

Commands:
  --seed, -s     Seed withdrawals (default)
  --clear, -c    Clear all withdrawals
  --help, -h     Show this help message

Examples:
  node seedWithdrawals.js          # Seed withdrawals
  node seedWithdrawals.js --seed   # Seed withdrawals
  node seedWithdrawals.js --clear  # Clear withdrawals
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
