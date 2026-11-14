// src/seeds/ingredientNameSeedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const IngredientName = require('../models/IngredientName');

// Common ingredient names used in construction
const ingredientNames = [
  { name: "Cement", isActive: true },
  { name: "Sand", isActive: true },
  { name: "Gravel", isActive: true },
  { name: "Water", isActive: true },
  { name: "Steel Sheet", isActive: true },
  { name: "Galvanized Coating", isActive: true },
  { name: "Fasteners", isActive: true },
  { name: "Gypsum Powder", isActive: true },
  { name: "Paper Facing", isActive: true },
  { name: "Adhesive", isActive: true },
  { name: "Polyurethane Foam", isActive: true },
  { name: "Protective Film", isActive: true },
  { name: "Ceramic Body", isActive: true },
  { name: "Glazing", isActive: true },
  { name: "Tile Adhesive", isActive: true },
  { name: "Paint Base", isActive: true },
  { name: "Pigments", isActive: true },
  { name: "Binders", isActive: true },
  { name: "Additives", isActive: true },
  { name: "Fiberglass", isActive: true },
  { name: "Foam", isActive: true },
  { name: "Rockwool", isActive: true },
  { name: "Tile", isActive: true },
  { name: "Grout", isActive: true },
  { name: "Concrete Mix", isActive: true },
  { name: "Reinforcement Steel", isActive: true },
  { name: "Insulation Material", isActive: true },
  { name: "Vapor Barrier", isActive: true },
  { name: "Wood", isActive: true },
  { name: "Nails", isActive: true },
  { name: "Screws", isActive: true },
  { name: "Wire Mesh", isActive: true },
  { name: "Plasticizer", isActive: true },
  { name: "Lime", isActive: true },
  { name: "Clay", isActive: true }
];

// Function to seed ingredient names
const seedIngredientNames = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('🌱 Starting ingredient names seeding...');

    // Clear existing ingredient names
    await IngredientName.deleteMany({});
    console.log('🗑️  Cleared existing ingredient names');

    // Insert new ingredient names
    const createdIngredientNames = await IngredientName.insertMany(ingredientNames);
    
    console.log(`✅ Successfully seeded ${createdIngredientNames.length} ingredient names`);
    console.log(`📊 Ingredient names: ${ingredientNames.map(ing => ing.name).join(', ')}`);
    
    // Only disconnect if we connected in this function
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error seeding ingredient names:', error);
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
};

// Function to clear ingredient names
const clearIngredientNames = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    await IngredientName.deleteMany({});
    console.log('✅ Ingredient names cleared successfully');
    
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error clearing ingredient names:', error);
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
};

// Export functions
module.exports = {
  seedIngredientNames,
  clearIngredientNames,
  ingredientNames
};

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '--seed' || command === '-s') {
    seedIngredientNames();
  } else if (command === '--clear' || command === '-c') {
    clearIngredientNames();
  } else if (command === '--help' || command === '-h') {
    console.log('🌱 Ingredient Name Seed Script\n');
    console.log('Usage:');
    console.log('  node ingredientNameSeedData.js [command]\n');
    console.log('Commands:');
    console.log('  --seed, -s     Seed ingredient names (default)');
    console.log('  --clear, -c     Clear all ingredient names');
    console.log('  --help, -h      Show this help message\n');
    console.log('Examples:');
    console.log('  node ingredientNameSeedData.js          # Seed ingredient names');
    console.log('  node ingredientNameSeedData.js --seed   # Seed ingredient names');
    console.log('  node ingredientNameSeedData.js --clear  # Clear ingredient names');
  } else {
    // Default to seed
    seedIngredientNames();
  }
}

