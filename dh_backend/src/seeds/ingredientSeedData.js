// src/seeds/ingredientSeedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const Ingredient = require('../models/Ingredient');
const MaterialCategory = require('../models/MaterialCategory');
const ParentCategory = require('../models/ParentCategory');

// Function to seed ingredients for material categories
const seedIngredients = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('🌱 Starting ingredients seeding...');

    // Get all material categories with their parent categories
    const categories = await MaterialCategory.find({ isActive: true })
      .populate('parentCategory', 'ingredientType');

    if (categories.length === 0) {
      console.log('⚠️  No material categories found. Please seed categories first.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Clear existing ingredients
    await Ingredient.deleteMany({});
    console.log('🗑️  Cleared existing ingredients');

    let totalIngredients = 0;

    // Seed ingredients for each category based on ingredientType
    for (const category of categories) {
      const ingredientType = category.parentCategory?.ingredientType || 'percentage';
      const ingredients = [];

      if (ingredientType === 'percentage') {
        // Percentage-based ingredients (must sum to 100%)
        if (category.name === 'Brick' || category.name === 'Block with hole') {
          ingredients.push(
            { name: 'Cement', requiredPercent: 30, unit: 'kg', priceForPer1Percent: 50000, sortOrder: 0 },
            { name: 'Sand', requiredPercent: 40, unit: 'kg', priceForPer1Percent: 30000, sortOrder: 1 },
            { name: 'Gravel', requiredPercent: 20, unit: 'kg', priceForPer1Percent: 20000, sortOrder: 2 },
            { name: 'Water', requiredPercent: 10, unit: 'L', priceForPer1Percent: 5000, sortOrder: 3 }
          );
        } else if (category.name === 'Concrete block') {
          ingredients.push(
            { name: 'Cement', requiredPercent: 15, unit: 'kg', priceForPer1Percent: 60000, sortOrder: 0 },
            { name: 'Gravel', requiredPercent: 50, unit: 'kg', priceForPer1Percent: 25000, sortOrder: 1 },
            { name: 'Sand', requiredPercent: 25, unit: 'kg', priceForPer1Percent: 12000, sortOrder: 2 },
            { name: 'Water', requiredPercent: 10, unit: 'L', priceForPer1Percent: 3000, sortOrder: 3 }
          );
        } else if (category.name === 'Gypsum') {
          ingredients.push(
            { name: 'Gypsum Powder', requiredPercent: 70, unit: 'kg', priceForPer1Percent: 35000, sortOrder: 0 },
            { name: 'Paper Facing', requiredPercent: 20, unit: 'm2', priceForPer1Percent: 15000, sortOrder: 1 },
            { name: 'Adhesive', requiredPercent: 10, unit: 'kg', priceForPer1Percent: 5000, sortOrder: 2 }
          );
        } else if (category.name === 'Ceramic') {
          ingredients.push(
            { name: 'Ceramic Body', requiredPercent: 85, unit: 'kg', priceForPer1Percent: 40000, sortOrder: 0 },
            { name: 'Glazing', requiredPercent: 10, unit: 'kg', priceForPer1Percent: 50000, sortOrder: 1 },
            { name: 'Tile Adhesive', requiredPercent: 5, unit: 'kg', priceForPer1Percent: 10000, sortOrder: 2 }
          );
        } else {
          // Default percentage ingredients
          ingredients.push(
            { name: 'Cement', requiredPercent: 30, unit: 'kg', priceForPer1Percent: 50000, sortOrder: 0 },
            { name: 'Sand', requiredPercent: 40, unit: 'kg', priceForPer1Percent: 30000, sortOrder: 1 },
            { name: 'Gravel', requiredPercent: 30, unit: 'kg', priceForPer1Percent: 20000, sortOrder: 2 }
          );
        }
      } else if (ingredientType === 'm3') {
        // m3-based ingredients
        if (category.name === 'Metal sheet') {
          ingredients.push(
            { name: 'Steel Sheet', unit: 'm3', pricePerM3: 150000, sortOrder: 0 },
            { name: 'Galvanized Coating', unit: 'm3', pricePerM3: 50000, sortOrder: 1 },
            { name: 'Fasteners', unit: 'm3', pricePerM3: 10000, sortOrder: 2 }
          );
        } else {
          // Default m3 ingredients
          ingredients.push(
            { name: 'Concrete Mix', unit: 'm3', pricePerM3: 120000, sortOrder: 0 },
            { name: 'Reinforcement Steel', unit: 'm3', pricePerM3: 80000, sortOrder: 1 }
          );
        }
      } else if (ingredientType === 'm2') {
        // m2-based ingredients
        if (category.name === 'Ceramic') {
          ingredients.push(
            { name: 'Tile', unit: 'm2', pricePerM2: 50000, sortOrder: 0 },
            { name: 'Tile Adhesive', unit: 'm2', pricePerM2: 10000, sortOrder: 1 },
            { name: 'Grout', unit: 'm2', pricePerM2: 8000, sortOrder: 2 }
          );
        } else if (category.name === 'Metal sheet') {
          ingredients.push(
            { name: 'Steel Sheet', unit: 'm2', pricePerM2: 45000, sortOrder: 0 },
            { name: 'Fasteners', unit: 'm2', pricePerM2: 5000, sortOrder: 1 }
          );
        } else {
          // Default m2 ingredients
          ingredients.push(
            { name: 'Base Material', unit: 'm2', pricePerM2: 40000, sortOrder: 0 },
            { name: 'Adhesive', unit: 'm2', pricePerM2: 10000, sortOrder: 1 }
          );
        }
      }

      // Create ingredients for this category
      if (ingredients.length > 0) {
        const categoryIngredients = ingredients.map(ing => ({
          ...ing,
          materialCategory: category._id,
          isActive: true
        }));

        const created = await Ingredient.insertMany(categoryIngredients);
        totalIngredients += created.length;
        console.log(`  ✅ Created ${created.length} ingredients for "${category.name}" (${ingredientType})`);
      }
    }

    console.log(`\n✅ Successfully seeded ${totalIngredients} ingredients across ${categories.length} categories`);
    
    // Only disconnect if we connected in this function
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error seeding ingredients:', error);
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
};

// Function to clear ingredients
const clearIngredients = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    await Ingredient.deleteMany({});
    console.log('✅ Ingredients cleared successfully');
    
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error clearing ingredients:', error);
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
};

// Export functions
module.exports = {
  seedIngredients,
  clearIngredients
};

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '--seed' || command === '-s') {
    seedIngredients();
  } else if (command === '--clear' || command === '-c') {
    clearIngredients();
  } else if (command === '--help' || command === '-h') {
    console.log('🌱 Ingredient Seed Script\n');
    console.log('Usage:');
    console.log('  node ingredientSeedData.js [command]\n');
    console.log('Commands:');
    console.log('  --seed, -s     Seed ingredients for all material categories (default)');
    console.log('  --clear, -c    Clear all ingredients');
    console.log('  --help, -h     Show this help message\n');
    console.log('Examples:');
    console.log('  node ingredientSeedData.js          # Seed ingredients');
    console.log('  node ingredientSeedData.js --seed   # Seed ingredients');
    console.log('  node ingredientSeedData.js --clear  # Clear ingredients\n');
    console.log('Note: Material categories must be seeded first!');
  } else {
    // Default to seed
    seedIngredients();
  }
}

