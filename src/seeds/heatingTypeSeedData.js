const HeatingType = require('../models/HeatingType');

const heatingTypeData = [
  {
    _id: 1,
    name: 'Underfloor heating',
    description: 'Floor heating system for comfortable indoor climate',
    isActive: true
  },
  {
    _id: 2,
    name: 'Furnace heating',
    description: 'Traditional furnace heating system',
    isActive: true
  },
  {
    _id: 3,
    name: 'Stove heating',
    description: 'Stove-based heating system',
    isActive: true
  },
  {
    _id: 4,
    name: 'Electric heating',
    description: 'Electric heating system',
    isActive: true
  },
  {
    _id: 5,
    name: 'Heat pump',
    description: 'Energy efficient heat pump system',
    isActive: true
  },
  {
    _id: 6,
    name: 'Solar energy',
    description: 'Solar-powered heating system',
    isActive: true
  },
  {
    _id: 7,
    name: 'Water heating',
    description: 'Water-based heating system',
    isActive: true
  },
  {
    _id: 8,
    name: 'No heating',
    description: 'No heating system installed',
    isActive: true
  }
];

const seedHeatingTypes = async () => {
  try {
    // Clear existing data
    await HeatingType.deleteMany({});
    
    // Insert new data
    const result = await HeatingType.insertMany(heatingTypeData);
    
    console.log(`${result.length} heating types seeded successfully`);
    return result;
  } catch (error) {
    console.error('Error seeding heating types:', error);
    throw error;
  }
};

module.exports = { seedHeatingTypes, heatingTypeData };
