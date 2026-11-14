const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse');
    console.log('Connected to MongoDB');

    // Update existing users to have role field
    const result = await User.updateMany(
      { role: { $exists: false } },
      { 
        $set: { 
          role: 'user',
          isBanned: false,
          bannedAt: null,
          banReason: null
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} users with default role and ban fields`);

    // Update existing admin users
    const adminUsers = await User.updateMany(
      { isAdmin: true, role: 'user' },
      { $set: { role: 'admin' } }
    );

    console.log(`Updated ${adminUsers.modifiedCount} admin users`);

    // Show current user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Current user role distribution:');
    userStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });

    console.log('Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsers();
}

module.exports = migrateUsers;
