const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB URI - Use environment variable or default to local
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamhouse';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 Connected to MongoDB: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 