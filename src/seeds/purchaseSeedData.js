const Purchase = require('../models/Purchase');
const User = require('../models/User');

const purchaseSeedData = [
  {
    phone: '+97699887766',
    orderId: 'SNXtQL',
    item: '30 days subscription',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator1',
    status: 'completed',
    notes: 'Subscription purchased successfully'
  },
  {
    phone: '+97688112233',
    orderId: '47r7o1',
    item: '60 days subscription',
    amount: 20000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator2',
    status: 'completed',
    notes: 'Extended subscription purchased'
  },
  {
    phone: '+97694112233',
    orderId: '6thl12',
    item: '180 days subscription',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'User',
    status: 'pending',
    notes: 'Long-term subscription request'
  },
  {
    phone: '+97696557865',
    orderId: 'uFwYEP',
    item: '60 days subscription',
    amount: 20000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'User',
    status: 'processing',
    notes: 'Processing subscription payment'
  },
  {
    phone: '+97699887766',
    orderId: 'KgSXPG',
    item: '180 days subscription',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator1',
    status: 'completed',
    notes: 'Premium subscription activated'
  },
  {
    phone: '+97699887766',
    orderId: 'zP2Ewx',
    item: '180 days subscription',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator1',
    status: 'failed',
    notes: 'Payment failed due to insufficient funds'
  },
  {
    phone: '+97699887766',
    orderId: '5ce1Yi',
    item: '60 days subscription',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'User',
    status: 'cancelled',
    notes: 'User cancelled subscription'
  },
  {
    phone: '+97699887766',
    orderId: 'jEZe-k',
    item: '60 days subscription',
    amount: 20000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator2',
    status: 'completed',
    notes: 'Standard subscription renewed'
  },
  {
    phone: '+97699887766',
    orderId: 'c5w_B8',
    item: '60 days subscription',
    amount: 20000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator2',
    status: 'processing',
    notes: 'Processing renewal payment'
  }
];

const seedPurchases = async () => {
  try {
    console.log('🌱 Seeding purchases...');

    // Check if purchases already exist
    const existingPurchases = await Purchase.countDocuments();
    if (existingPurchases > 0) {
      console.log(`⚠️  ${existingPurchases} purchases already exist. Skipping...`);
      return;
    }

    // Create test users if they don't exist
    const testUsers = [
      { phone: '+97699887766', username: 'TestUser1', password: '1234', wallet: 50000 },
      { phone: '+97688112233', username: 'TestUser2', password: '1234', wallet: 75000 },
      { phone: '+97694112233', username: 'TestUser3', password: '1234', wallet: 30000 },
      { phone: '+97696557865', username: 'TestUser4', password: '1234', wallet: 45000 }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ phone: userData.phone });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created test user: ${userData.username} (${userData.phone})`);
      } else {
        // Update wallet balance for existing users
        existingUser.wallet = Math.max(existingUser.wallet, userData.wallet);
        await existingUser.save();
        console.log(`✅ Updated wallet for existing user: ${existingUser.username}`);
      }
    }

    // Insert purchases
    const createdPurchases = await Purchase.insertMany(purchaseSeedData);
    console.log(`✅ Successfully seeded ${createdPurchases.length} purchases`);

    // Log summary
    console.log('\n📊 Purchase Summary:');
    const statusCounts = {};
    purchaseSeedData.forEach(purchase => {
      statusCounts[purchase.status] = (statusCounts[purchase.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n💰 Total Amount:', purchaseSeedData.reduce((sum, p) => sum + p.amount, 0), 'MNT');
    console.log('📱 Unique Users:', new Set(purchaseSeedData.map(p => p.phone)).size);
    console.log('👨‍💼 Operators:', new Set(purchaseSeedData.map(p => p.processedBy)).size);
    console.log('🛍️  Unique Items:', new Set(purchaseSeedData.map(p => p.item)).size);

  } catch (error) {
    console.error('❌ Error seeding purchases:', error);
    throw error;
  }
};

const clearPurchases = async () => {
  try {
    console.log('🧹 Clearing purchases...');
    await Purchase.deleteMany({});
    console.log('✅ All purchases cleared');
  } catch (error) {
    console.error('❌ Error clearing purchases:', error);
    throw error;
  }
};

module.exports = {
  seedPurchases,
  clearPurchases,
  purchaseSeedData
};
