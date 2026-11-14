require('dotenv').config();
const mongoose = require('mongoose');
const ParentCategory = require('../models/ParentCategory');

async function removeIngredientType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('✅ Connected to MongoDB');

    // Remove ingredientType field from all ParentCategory documents
    const result = await ParentCategory.updateMany(
      {},
      { $unset: { ingredientType: "" } }
    );

    console.log(`✅ Removed ingredientType field from ${result.modifiedCount} parent categories`);

    // Verify removal
    const categoriesWithIngredientType = await ParentCategory.countDocuments({
      ingredientType: { $exists: true }
    });
    
    if (categoriesWithIngredientType === 0) {
      console.log('✅ All ingredientType fields successfully removed');
    } else {
      console.log(`⚠️  Warning: ${categoriesWithIngredientType} categories still have ingredientType field`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  removeIngredientType();
}

module.exports = removeIngredientType;

