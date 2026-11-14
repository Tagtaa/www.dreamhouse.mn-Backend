const mongoose = require('mongoose');
const CalculationType = require('../models/CalculationType');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
const defaultCalculationTypes = [
  {
    calculationType: 'wall',
    key: 'wall',
    name: 'Wall',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Calculate wall materials and costs',
    isActive: true,
    sortOrder: 1
  },
  {
    calculationType: 'fundament',
    key: 'fundament',
    name: 'Foundation',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
    description: 'Calculate foundation materials and costs',
    isActive: true,
    sortOrder: 2
  },
  {
    calculationType: 'roof',
    key: 'roof',
    name: 'Roof',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
    description: 'Calculate roof materials and costs',
    isActive: true,
    sortOrder: 3
  },
  {
    calculationType: 'inner_wall',
    key: 'inner_wall',
    name: 'Inner Wall',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Calculate inner wall materials and costs',
    isActive: true,
    sortOrder: 4
  },
  {
    calculationType: 'underfloor',
    key: 'underfloor',
    name: 'Underfloor',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    description: 'Calculate underfloor materials and costs',
    isActive: true,
    sortOrder: 5
  },
  {
    calculationType: 'floor_tiles',
    key: 'floor_tiles',
    name: 'Floor Tiles',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Calculate floor tile materials and costs',
    isActive: true,
    sortOrder: 6
  },
  {
    calculationType: 'wall_decoration',
    key: 'wall_decoration',
    name: 'Wall Decoration',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Calculate wall decoration materials and costs',
    isActive: true,
    sortOrder: 7
  }
];

const seedCalculationTypes = async () => {
  try {
    await connectDB();
    
    console.log('Seeding calculation types...');
    
    await CalculationType.deleteMany({});
    console.log('Cleared existing calculation types');
    
    const insertedTypes = await CalculationType.insertMany(defaultCalculationTypes);
    console.log(`Inserted ${insertedTypes.length} calculation types`);
    
    console.log('Calculation types seeding completed!');
    
    console.log('\nInserted calculation types:');
    insertedTypes.forEach(type => {
      console.log(`- ${type.name} (${type.key})`);
    });
    
  } catch (error) {
    console.error('Error seeding calculation types:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

if (require.main === module) {
  seedCalculationTypes();
}

module.exports = seedCalculationTypes;