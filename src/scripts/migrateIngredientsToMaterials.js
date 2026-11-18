// Copies each material category's ingredients onto every material in it, so each
// material owns its ingredients. The server also runs this once on startup.
// Usage: node src/scripts/migrateIngredientsToMaterials.js [--force]
require('dotenv').config();
const mongoose = require('mongoose');
const { migrateIngredientsToMaterials } = require('../services/ingredientMigrationService');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('📦 Connected to MongoDB');
    const result = await migrateIngredientsToMaterials({ force: process.argv.includes('--force') });
    console.log(result.skipped ? 'ℹ️  Already migrated (use --force to run again)' : '✅ Done', result);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
