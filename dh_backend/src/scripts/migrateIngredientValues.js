require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const MaterialCategory = require('../models/MaterialCategory');

async function migrateIngredientValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('✅ Connected to MongoDB');

    // Get all ingredients
    const ingredients = await Ingredient.find({});
    console.log(`📦 Found ${ingredients.length} ingredients to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let needsManualUpdate = [];

    for (const ingredient of ingredients) {
      const unit = String(ingredient.unit || '').trim().toLowerCase();
      const isM3 = unit === 'm3';
      const isM2 = unit === 'm2';
      
      let needsFix = false;
      let updateData = {};
      let missingFields = [];

      if (isM3) {
        // For m3 type, should have requiredPercent (as m3Amount) and pricePerM3
        if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
          needsFix = true;
          missingFields.push('m3Amount (requiredPercent)');
          // Set default value of 0 - user should update manually
          updateData.requiredPercent = 0;
        }
        if (ingredient.pricePerM3 === undefined || ingredient.pricePerM3 === null) {
          needsFix = true;
          missingFields.push('pricePerM3');
          // Set default value of 0 - user should update manually
          updateData.pricePerM3 = 0;
        }
      } else if (isM2) {
        // For m2 type, should have requiredPercent (as m2Amount) and pricePerM2
        if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
          needsFix = true;
          missingFields.push('m2Amount (requiredPercent)');
          // Set default value of 0 - user should update manually
          updateData.requiredPercent = 0;
        }
        if (ingredient.pricePerM2 === undefined || ingredient.pricePerM2 === null) {
          needsFix = true;
          missingFields.push('pricePerM2');
          // Set default value of 0 - user should update manually
          updateData.pricePerM2 = 0;
        }
      } else {
        // For percentage type, should have requiredPercent and priceForPer1Percent
        if (ingredient.requiredPercent === undefined || ingredient.requiredPercent === null) {
          needsFix = true;
          missingFields.push('percentValue (requiredPercent)');
          // Set default value of 0 - user should update manually
          updateData.requiredPercent = 0;
        }
        if (ingredient.priceForPer1Percent === undefined || ingredient.priceForPer1Percent === null) {
          needsFix = true;
          missingFields.push('priceForPer1Percent');
          // Set default value of 0 - user should update manually
          updateData.priceForPer1Percent = 0;
        }
      }

      if (needsFix) {
        // Get category info for reporting
        const category = await MaterialCategory.findById(ingredient.materialCategory);
        const categoryName = category ? category.name : 'Unknown';
        
        console.log(`🔧 Fixing ingredient: ${ingredient.name}`);
        console.log(`   Category: ${categoryName}`);
        console.log(`   Unit: ${ingredient.unit || 'N/A'}`);
        console.log(`   Missing fields: ${missingFields.join(', ')}`);
        console.log(`   Setting default values to 0 (please update manually)`);
        
        await Ingredient.findByIdAndUpdate(ingredient._id, updateData);
        fixedCount++;
        
        needsManualUpdate.push({
          ingredientId: ingredient._id,
          name: ingredient.name,
          category: categoryName,
          unit: ingredient.unit,
          missingFields: missingFields
        });
        
        console.log(`   ✅ Updated\n`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Total ingredients: ${ingredients.length}`);
    console.log(`   - Fixed (set default values): ${fixedCount}`);
    console.log(`   - Already correct: ${skippedCount}`);
    
    if (needsManualUpdate.length > 0) {
      console.log(`\n⚠️  IMPORTANT: ${fixedCount} ingredients were set to default values (0).`);
      console.log(`   Please update these ingredients manually with correct values:\n`);
      
      needsManualUpdate.forEach(item => {
        console.log(`   - ${item.name} (ID: ${item.ingredientId})`);
        console.log(`     Category: ${item.category}, Unit: ${item.unit}`);
        console.log(`     Missing: ${item.missingFields.join(', ')}\n`);
      });
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
  migrateIngredientValues();
}

module.exports = migrateIngredientValues;

