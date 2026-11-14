const mongoose = require('mongoose');
require('dotenv').config();

const BankTransaction = require('../models/BankTransaction');

async function migrateBankTransactionStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find all transactions with null status
    const transactions = await BankTransaction.find({ status: null });

    console.log(`📊 Found ${transactions.length} transactions with null status`);

    let validCount = 0;
    let wrongCount = 0;

    // Update each transaction
    for (const transaction of transactions) {
      if (transaction.userId) {
        // User exists, so status should be 'valid'
        transaction.status = 'valid';
        validCount++;
      } else {
        // No user, so status should be 'wrong'
        transaction.status = 'wrong';
        wrongCount++;
      }
      
      await transaction.save();
    }

    console.log(`✅ Migration completed:`);
    console.log(`   - ${validCount} transactions set to 'valid'`);
    console.log(`   - ${wrongCount} transactions set to 'wrong'`);
    console.log(`   - Total: ${transactions.length} transactions updated`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateBankTransactionStatus();
