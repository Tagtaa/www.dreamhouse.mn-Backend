const Deposit = require('../models/Deposit');
const User = require('../models/User');

const depositSeedData = [
  {
    phone: '+97699887766',
    orderId: 'ABC123',
    amount: 10000,
    date: new Date('2023-11-10T12:25:00.000Z'),
    processedBy: 'Operator1',
    status: 'confirmed',
    notes: 'Initial deposit confirmed'
  },
  {
    phone: '+97688112233',
    orderId: 'DEF456',
    amount: 25000,
    date: new Date('2023-11-10T13:30:00.000Z'),
    processedBy: 'Operator2',
    status: 'confirmed',
    notes: 'Large deposit confirmed'
  },
  {
    phone: '+97694112233',
    orderId: 'GHI789',
    amount: 15000,
    date: new Date('2023-11-10T14:15:00.000Z'),
    processedBy: 'User',
    status: 'wrong',
    notes: 'Deposit needs verification'
  },
  {
    phone: '+97696557865',
    orderId: 'JKL012',
    amount: 30000,
    date: new Date('2023-11-10T15:45:00.000Z'),
    processedBy: 'Operator2',
    status: 'rejected',
    notes: 'Deposit rejected due to invalid source'
  },
  {
    phone: '+97699887766',
    orderId: 'MNO345',
    amount: 20000,
    date: new Date('2023-11-10T16:20:00.000Z'),
    processedBy: 'Operator1',
    status: 'confirmed',
    notes: 'Second deposit confirmed'
  },
  {
    phone: '+97688112233',
    orderId: 'PQR678',
    amount: 12000,
    date: new Date('2023-11-10T17:10:00.000Z'),
    processedBy: 'Operator2',
    status: 'wrong',
    notes: 'Amount mismatch detected'
  },
  {
    phone: '+97694112233',
    orderId: 'STU901',
    amount: 18000,
    date: new Date('2023-11-10T18:05:00.000Z'),
    processedBy: 'User',
    status: 'confirmed',
    notes: 'Deposit verified and confirmed'
  },
  {
    phone: '+97696557865',
    orderId: 'VWX234',
    amount: 22000,
    date: new Date('2023-11-10T19:30:00.000Z'),
    processedBy: 'Operator1',
    status: 'rejected',
    notes: 'Suspicious transaction rejected'
  },
  {
    phone: '+97699887766',
    orderId: 'YZA567',
    amount: 8000,
    date: new Date('2023-11-10T20:15:00.000Z'),
    processedBy: 'Operator2',
    status: 'wrong',
    notes: 'Phone number verification needed'
  },
  {
    phone: '+97688112233',
    orderId: 'BCD890',
    amount: 35000,
    date: new Date('2023-11-10T21:00:00.000Z'),
    processedBy: 'Operator1',
    status: 'confirmed',
    notes: 'Premium deposit confirmed'
  }
];

const seedDeposits = async () => {
  try {
    console.log('🌱 Seeding deposits...');

    // Check if deposits already exist
    const existingDeposits = await Deposit.countDocuments();
    if (existingDeposits > 0) {
      console.log(`⚠️  ${existingDeposits} deposits already exist. Skipping...`);
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

    // Insert deposits
    const createdDeposits = await Deposit.insertMany(depositSeedData);
    console.log(`✅ Successfully seeded ${createdDeposits.length} deposits`);

    // Log summary
    console.log('\n📊 Deposit Summary:');
    const statusCounts = {};
    depositSeedData.forEach(deposit => {
      statusCounts[deposit.status] = (statusCounts[deposit.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n💰 Total Amount:', depositSeedData.reduce((sum, d) => sum + d.amount, 0), 'MNT');
    console.log('📱 Unique Users:', new Set(depositSeedData.map(d => d.phone)).size);
    console.log('👨‍💼 Operators:', new Set(depositSeedData.map(d => d.processedBy)).size);

  } catch (error) {
    console.error('❌ Error seeding deposits:', error);
    throw error;
  }
};

const clearDeposits = async () => {
  try {
    console.log('🧹 Clearing deposits...');
    await Deposit.deleteMany({});
    console.log('✅ All deposits cleared');
  } catch (error) {
    console.error('❌ Error clearing deposits:', error);
    throw error;
  }
};

module.exports = {
  seedDeposits,
  clearDeposits,
  depositSeedData
};
