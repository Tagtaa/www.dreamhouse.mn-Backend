const IdeaCategory = require('../models/IdeaCategory');

const ideaCategoryData = [
  {
    _id: 1,
    name: 'Concrete house',
    description: 'Concrete house designs and ideas',
    isActive: true
  },
  {
    _id: 2,
    name: 'Sandwich house',
    description: 'Sandwich panel house designs and ideas',
    isActive: true
  },
  {
    _id: 3,
    name: 'Canada House',
    description: 'Canadian style house designs and ideas',
    isActive: true
  },
  {
    _id: 4,
    name: 'Top',
    description: 'Top rated and featured house designs',
    isActive: true
  }
];

const seedIdeaCategories = async () => {
  try {
    // Clear existing data
    await IdeaCategory.deleteMany({});
    
    // Insert new data
    const result = await IdeaCategory.insertMany(ideaCategoryData);
    
    console.log(`${result.length} idea categories seeded successfully`);
    return result;
  } catch (error) {
    console.error('Error seeding idea categories:', error);
    throw error;
  }
};

module.exports = { seedIdeaCategories, ideaCategoryData };
