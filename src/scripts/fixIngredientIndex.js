const mongoose = require('mongoose');
require('dotenv').config();

const fixIngredientIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('📦 Connected to MongoDB');

    const Ingredient = mongoose.model('Ingredient', new mongoose.Schema({}, { strict: false }), 'ingredients');
    const collection = Ingredient.collection;

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // First, clean up old ingredients with null materialCategory
    const oldIngredients = await collection.countDocuments({ materialCategory: null });
    if (oldIngredients > 0) {
      console.log(`\n🧹 Found ${oldIngredients} old ingredients with null materialCategory`);
      const deleteResult = await collection.deleteMany({ materialCategory: null });
      console.log(`✅ Deleted ${deleteResult.deletedCount} old ingredients`);
    } else {
      console.log('\nℹ️  No old ingredients with null materialCategory found');
    }

    // Drop the old calculationType_1_name_1 index if it exists
    try {
      await collection.dropIndex('calculationType_1_name_1');
      console.log('\n✅ Successfully dropped old index: calculationType_1_name_1');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('\nℹ️  Old index calculationType_1_name_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // Ensure the new index exists
    try {
      await collection.createIndex({ materialCategory: 1, name: 1 }, { unique: true, name: 'materialCategory_1_name_1' });
      console.log('✅ Created/verified new index: materialCategory_1_name_1');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('ℹ️  New index already exists');
      } else {
        throw error;
      }
    }

    // List indexes again to confirm
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✨ Index migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

// Run the migration
fixIngredientIndex();

