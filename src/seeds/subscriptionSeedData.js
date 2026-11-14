const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
require('dotenv').config();

const subscriptionSeedData = [
  {
    name: '30 days subscription',
    plan: '1_month',
    day: 30,
    price: 20000,
    isActive: true
  },
  {
    name: '60 days subscription',
    plan: '2_months',
    day: 60,
    price: 40000,
    isActive: true
  },
  {
    name: '90 days subscription',
    plan: '3_months',
    day: 90,
    price: 55000,
    isActive: true
  },
  {
    name: '180 days subscription',
    plan: '6_months',
    day: 180,
    price: 100000,
    isActive: true
  },
  {
    name: '360 days subscription',
    plan: '1_year',
    day: 360,
    price: 180000,
    isActive: true
  }
];

const seedSubscriptions = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    console.log('Connected to MongoDB');
    }
    
    // Clear existing subscriptions
    await Subscription.deleteMany({});
    console.log('Cleared existing subscriptions');
    
    // Insert new subscriptions
    const subscriptions = await Subscription.insertMany(subscriptionSeedData);
    
    console.log(`✅ ${subscriptions.length} subscriptions seeded successfully!`);
    
    // Show seeded data in the exact format requested
    console.log('\n📊 Subscription Data:');
    subscriptions.forEach(sub => {
      console.log(`${sub.day}: ${sub.price}`);
    });
    
    // Only disconnect if we connected in this function and it's called directly
    if (mongoose.connection.readyState === 1 && require.main === module) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    }
    
    return subscriptions;
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
    }
    throw error;
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedSubscriptions()
    .then(() => {
      console.log('Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

module.exports = {
  subscriptionSeedData,
  seedSubscriptions
};
