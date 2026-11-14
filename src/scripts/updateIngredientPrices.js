require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');

/**
 * Update ingredient prices (pricePerM2 and pricePerM3) that are 0
 * Sets random realistic values based on unit type
 */
async function updateIngredientPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('✅ Connected to MongoDB');

    // Find all ingredients with pricePerM2 = 0 or pricePerM3 = 0
    const ingredientsWithZeroPrices = await Ingredient.find({
      $or: [
        { pricePerM2: 0 },
        { pricePerM3: 0 }
      ]
    });

    console.log(`📦 Found ${ingredientsWithZeroPrices.length} ingredients with zero prices`);

    if (ingredientsWithZeroPrices.length === 0) {
      console.log('✅ No ingredients with zero prices found');
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    // Price ranges for different unit types (in Mongolian Tugrik - ₮)
    // You can customize these ranges based on your needs
    const priceRanges = {
      m2: {
        min: 10000,   // 10,000 ₮ per m2 (minimum)
        max: 150000   // 150,000 ₮ per m2 (maximum)
      },
      m3: {
        min: 80000,   // 80,000 ₮ per m3 (minimum)
        max: 800000    // 800,000 ₮ per m3 (maximum)
      }
    };

    // Specific prices for common ingredient names (optional - more realistic)
    const ingredientPrices = {
      // m2 ingredients
      'tile': { m2: 50000 },
      'tile adhesive': { m2: 15000 },
      'grout': { m2: 12000 },
      'steel sheet': { m2: 60000 },
      'fasteners': { m2: 8000 },
      'base material': { m2: 45000 },
      'adhesive': { m2: 18000 },
      // m3 ingredients
      'concrete mix': { m3: 200000 },
      'reinforcement steel': { m3: 350000 },
      'steel sheet': { m3: 400000 },
      'galvanized coating': { m3: 150000 },
      'fasteners': { m3: 50000 }
    };

    // Helper function to generate random price in range
    const getRandomPrice = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    for (const ingredient of ingredientsWithZeroPrices) {
      const unit = String(ingredient.unit || '').trim().toLowerCase();
      const updateData = {};
      let needsUpdate = false;

      // Check if ingredient has specific price in ingredientPrices
      const ingredientNameLower = String(ingredient.name || '').trim().toLowerCase();
      const specificPrice = ingredientPrices[ingredientNameLower];

      // Update pricePerM2 if it's 0 and unit is m2
      if (ingredient.pricePerM2 === 0 && unit === 'm2') {
        let newPrice;
        if (specificPrice && specificPrice.m2) {
          newPrice = specificPrice.m2;
          console.log(`💰 Using specific price for ${ingredient.name}: ${newPrice.toLocaleString()} ₮`);
        } else {
          newPrice = getRandomPrice(priceRanges.m2.min, priceRanges.m2.max);
        }
        updateData.pricePerM2 = newPrice;
        needsUpdate = true;
        console.log(`🔧 Updating ingredient ${ingredient._id} (${ingredient.name}) - pricePerM2: 0 → ${newPrice.toLocaleString()} ₮`);
      }

      // Update pricePerM3 if it's 0 and unit is m3
      if (ingredient.pricePerM3 === 0 && unit === 'm3') {
        let newPrice;
        if (specificPrice && specificPrice.m3) {
          newPrice = specificPrice.m3;
          console.log(`💰 Using specific price for ${ingredient.name}: ${newPrice.toLocaleString()} ₮`);
        } else {
          newPrice = getRandomPrice(priceRanges.m3.min, priceRanges.m3.max);
        }
        updateData.pricePerM3 = newPrice;
        needsUpdate = true;
        console.log(`🔧 Updating ingredient ${ingredient._id} (${ingredient.name}) - pricePerM3: 0 → ${newPrice.toLocaleString()} ₮`);
      }

      // Also update if unit doesn't match but price is 0 (edge case)
      if (ingredient.pricePerM2 === 0 && unit !== 'm2' && unit !== 'kg' && unit !== 'percentage') {
        // If it's m3 unit but pricePerM2 is 0, we might want to set a default
        // But this is less common, so we'll skip it
        console.log(`⚠️  Skipping ingredient ${ingredient._id} (${ingredient.name}) - unit is '${unit}', pricePerM2 is 0 but unit doesn't match m2`);
        skippedCount++;
        continue;
      }

      if (ingredient.pricePerM3 === 0 && unit !== 'm3' && unit !== 'kg' && unit !== 'percentage') {
        console.log(`⚠️  Skipping ingredient ${ingredient._id} (${ingredient.name}) - unit is '${unit}', pricePerM3 is 0 but unit doesn't match m3`);
        skippedCount++;
        continue;
      }

      if (needsUpdate) {
        await Ingredient.findByIdAndUpdate(ingredient._id, updateData);
        updatedCount++;
        console.log(`✅ Updated ingredient ${ingredient._id} (${ingredient.name})`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total ingredients with zero prices: ${ingredientsWithZeroPrices.length}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateIngredientPrices();
}

module.exports = updateIngredientPrices;
