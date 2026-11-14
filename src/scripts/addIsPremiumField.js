const mongoose = require('mongoose');
const CalculationType = require('../models/CalculationType');
require('dotenv').config();

const addIsPremiumField = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get all calculation types
    const allTypes = await CalculationType.find({});
    console.log(`\n📊 Found ${allTypes.length} calculation types`);

    // Update all types to have isPremium field
    const result = await CalculationType.updateMany(
      { isPremium: { $exists: false } }, // Only update documents without isPremium field
      { $set: { isPremium: false } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} calculation types`);
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);

    // Show all types with their isPremium status
    const updatedTypes = await CalculationType.find({}).sort('sortOrder');
    console.log('\n📋 All Calculation Types:');
    console.log('═'.repeat(80));
    updatedTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name} (${type.key})`);
      console.log(`   - isPremium: ${type.isPremium}`);
      console.log(`   - isActive: ${type.isActive}`);
      console.log(`   - sortOrder: ${type.sortOrder}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

// Run the migration
addIsPremiumField();

