#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const { seedIdeas, clearIdeas } = require('../seeds/ideaSeedData');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function main() {
  try {
    console.log('🚀 Starting idea seeding process...\n');

    const command = process.argv[2];

    if (command === '--clear' || command === '-c') {
      await clearIdeas();
      console.log('\n✅ Ideas cleared successfully!');
    } else if (command === '--seed' || command === '-s' || !command) {
      await seedIdeas();
      console.log('\n✅ Ideas seeded successfully!');
    } else if (command === '--help' || command === '-h') {
      console.log(`
🌱 Idea Seed Script

Usage:
  node seedIdeas.js [command]

Commands:
  --seed, -s     Seed ideas (default)
  --clear, -c    Clear all ideas
  --help, -h     Show this help message

Examples:
  node seedIdeas.js          # Seed ideas
  node seedIdeas.js --seed   # Seed ideas
  node seedIdeas.js --clear  # Clear ideas
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
