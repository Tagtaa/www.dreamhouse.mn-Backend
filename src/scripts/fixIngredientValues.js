require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const MaterialCategory = require('../models/MaterialCategory');
const ParentCategory = require('../models/ParentCategory');

async function fixIngredientValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('✅ Connected to MongoDB');

    // Get all ingredients
    const ingredients = await Ingredient.find({});
    console.log(`📦 Found ${ingredients.length} ingredients to check`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const ingredient of ingredients) {
      // Get category and parent category
      const category = await MaterialCategory.findById(ingredient.materialCategory).populate('parentCategory');
      
      if (!category || !category.parentCategory) {
        console.log(`⚠️  Skipping ingredient ${ingredient._id} - category or parent category not found`);
        skippedCount++;
        continue;
      }

      const ingredientType = category.parentCategory.ingredientType || 'percentage';
      const unit = String(ingredient.unit || '').trim().toLowerCase();

      // Check if ingredient needs fixing
      let needsFix = false;
      let updateData = {};

      if (ingredientType === 'percentage') {
        // For percentage type, should have requiredPercent and priceForPer1Percent
        if (unit !== 'm3' && unit !== 'm2') {
          if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
            needsFix = true;
            console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - percentage type, missing requiredPercent`);
            // Set default value (you may want to adjust this)
            updateData.requiredPercent = 0;
          }
          if (ingredient.priceForPer1Percent === undefined || ingredient.priceForPer1Percent === null) {
            needsFix = true;
            console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - percentage type, missing priceForPer1Percent`);
            // Set default value (you may want to adjust this)
            updateData.priceForPer1Percent = 0;
          }
        }
      } else if (ingredientType === 'm3') {
        // For m3 type, should have requiredPercent (as m3Amount) and pricePerM3
        if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
          needsFix = true;
          console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - m3 type, missing requiredPercent (m3Amount)`);
          // Set default value (you may want to adjust this)
          updateData.requiredPercent = 0;
        }
        if (ingredient.pricePerM3 === undefined || ingredient.pricePerM3 === null) {
          needsFix = true;
          console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - m3 type, missing pricePerM3`);
          // Set default value (you may want to adjust this)
          updateData.pricePerM3 = 0;
        }
      } else if (ingredientType === 'm2') {
        // For m2 type, should have requiredPercent (as m2Amount) and pricePerM2
        if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
          needsFix = true;
          console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - m2 type, missing requiredPercent (m2Amount)`);
          // Set default value (you may want to adjust this)
          updateData.requiredPercent = 0;
        }
        if (ingredient.pricePerM2 === undefined || ingredient.pricePerM2 === null) {
          needsFix = true;
          console.log(`🔧 Fixing ingredient ${ingredient._id} (${ingredient.name}) - m2 type, missing pricePerM2`);
          // Set default value (you may want to adjust this)
          updateData.pricePerM2 = 0;
        }
      }

      // Also check for unit mismatch
      if (ingredientType === 'm3' && unit !== 'm3') {
        console.log(`⚠️  Warning: Ingredient ${ingredient._id} (${ingredient.name}) has unit '${unit}' but parent category is m3 type`);
      } else if (ingredientType === 'm2' && unit !== 'm2') {
        console.log(`⚠️  Warning: Ingredient ${ingredient._id} (${ingredient.name}) has unit '${unit}' but parent category is m2 type`);
      } else if (ingredientType === 'percentage' && (unit === 'm3' || unit === 'm2')) {
        console.log(`⚠️  Warning: Ingredient ${ingredient._id} (${ingredient.name}) has unit '${unit}' but parent category is percentage type`);
      }

      if (needsFix) {
        await Ingredient.findByIdAndUpdate(ingredient._id, updateData);
        fixedCount++;
        console.log(`✅ Fixed ingredient ${ingredient._id} (${ingredient.name})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total ingredients: ${ingredients.length}`);
    console.log(`   - Fixed: ${fixedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Already correct: ${ingredients.length - fixedCount - skippedCount}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixIngredientValues();
}

module.exports = fixIngredientValues;

