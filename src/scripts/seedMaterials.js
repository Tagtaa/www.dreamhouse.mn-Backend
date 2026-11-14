#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');
const { materials } = require('../seeds/materialSeedData');

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedMaterials() {
  try {
    console.log('🌱 Starting materials seeding...');
    
    // Find Brick category
    const brickCategory = await MaterialCategory.findOne({ name: 'Brick' });
    if (!brickCategory) {
      console.error('❌ Brick category not found. Please seed categories first.');
      return;
    }
    
    // Update materials with category ID
    const materialsWithCategory = materials.map(material => ({
      ...material,
      category: brickCategory._id
    }));
    
    // Insert materials
    const insertedMaterials = await Material.insertMany(materialsWithCategory);
    console.log(`✅ Successfully seeded ${insertedMaterials.length} materials`);
    
  } catch (error) {
    console.error('❌ Error seeding materials:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function clearMaterials() {
  try {
    console.log('🧹 Clearing materials...');
    const result = await Material.deleteMany({});
    console.log(`✅ Cleared ${result.deletedCount} materials`);
  } catch (error) {
    console.error('❌ Error clearing materials:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--seed')) {
  seedMaterials();
} else if (args.includes('--clear')) {
  clearMaterials();
} else {
  console.log(`
Usage: node seedMaterials.js [options]

Options:
  --seed    Seed materials data
  --clear   Clear all materials data
  --help    Show this help message

Examples:
  node seedMaterials.js --seed
  node seedMaterials.js --clear
  `);
}
