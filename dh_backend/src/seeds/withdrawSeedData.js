const mongoose = require('mongoose');
const Withdraw = require('../models/Withdraw');
const User = require('../models/User');
require('dotenv').config();

const withdrawSeedData = [
  {
    phone: '+97699887766',
    orderId: 'gTLvw4',
    amount: 5000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator1',
    status: 'completed',
    notes: 'Test withdrawal completed'
  },
  {
    phone: '+97688112233',
    orderId: 'DArniA',
    amount: 20000,
    date: new Date('2023-11-10T13:30:00.000Z'),
    processedBy: 'Operator2',
    status: 'completed',
    notes: 'Large withdrawal processed'
  },
  {
    phone: '+97694112233',
    orderId: 'DpyoDC',
    amount: 5000,
    date: new Date('2023-11-10T14:15:00.000Z'),
    processedBy: 'Operator1',
    status: 'pending',
    notes: 'Pending withdrawal request'
  },
  {
    phone: '+97696557865',
    orderId: 'DKK3nC',
    amount: 20000,
    date: new Date('2023-11-10T15:45:00.000Z'),
    processedBy: 'Operator2',
    status: 'processing',
    notes: 'Processing withdrawal'
  },
  {
    phone: '+97699887766',
    orderId: 'U0D7bQ',
    amount: 10000,
    date: new Date('2023-11-10T16:20:00.000Z'),
    processedBy: 'Operator1',
    status: 'completed',
    notes: 'Second withdrawal for same user'
  },
  {
    phone: '+97688112233',
    orderId: 'RBUIsL',
    amount: 15000,
    date: new Date('2023-11-10T17:10:00.000Z'),
    processedBy: 'Operator2',
    status: 'failed',
    notes: 'Withdrawal failed due to insufficient balance'
  },
  {
    phone: '+97694112233',
    orderId: 'tkPrzC',
    amount: 8000,
    date: new Date('2023-11-10T18:05:00.000Z'),
    processedBy: 'Operator1',
    status: 'cancelled',
    notes: 'User cancelled withdrawal'
  },
  {
    phone: '+97696557865',
    orderId: '7RpaXs',
    amount: 12000,
    date: new Date('2023-11-10T19:30:00.000Z'),
    processedBy: 'Operator2',
    status: 'completed',
    notes: 'Successful withdrawal'
  },
  {
    phone: '+97699887766',
    orderId: 'vZne5W',
    amount: 3000,
    date: new Date('2023-11-10T20:15:00.000Z'),
    processedBy: 'Operator1',
    status: 'pending',
    notes: 'Small withdrawal request'
  },
  {
    phone: '+97688112233',
    orderId: 'ABC123',
    amount: 25000,
    date: new Date('2023-11-10T21:00:00.000Z'),
    processedBy: 'Operator2',
    status: 'processing',
    notes: 'High amount withdrawal in process'
  }
];

const seedWithdrawals = async () => {
  try {
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dreamhouse', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('🌱 Seeding withdrawals...');

    // Check if withdrawals already exist
    const existingWithdrawals = await Withdraw.countDocuments();
    if (existingWithdrawals > 0) {
      console.log(`⚠️  ${existingWithdrawals} withdrawals already exist. Skipping...`);
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

    // Insert withdrawals
    const createdWithdrawals = await Withdraw.insertMany(withdrawSeedData);
    console.log(`✅ Successfully seeded ${createdWithdrawals.length} withdrawals`);

    // Log summary
    console.log('\n📊 Withdrawal Summary:');
    const statusCounts = {};
    withdrawSeedData.forEach(withdrawal => {
      statusCounts[withdrawal.status] = (statusCounts[withdrawal.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n💰 Total Amount:', withdrawSeedData.reduce((sum, w) => sum + w.amount, 0), 'MNT');
    console.log('📱 Unique Users:', new Set(withdrawSeedData.map(w => w.phone)).size);
    console.log('👨‍💼 Operators:', new Set(withdrawSeedData.map(w => w.processedBy)).size);

    // Only disconnect if we connected in this function and it's called directly
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
    }

  } catch (error) {
    console.error('❌ Error seeding withdrawals:', error);
    if (mongoose.connection.readyState === 1 && require.main === module) {
      await mongoose.disconnect();
    }
    throw error;
  }
};

const clearWithdrawals = async () => {
  try {
    console.log('🧹 Clearing withdrawals...');
    await Withdraw.deleteMany({});
    console.log('✅ All withdrawals cleared');
  } catch (error) {
    console.error('❌ Error clearing withdrawals:', error);
    throw error;
  }
};

module.exports = {
  seedWithdrawals,
  clearWithdrawals,
  withdrawSeedData
};
