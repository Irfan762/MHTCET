import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mhtcet_predictor';
    
    // Simplified connection options that work with current mongoose version
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Auto-seed in development if no colleges exist (after connection is established)
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Dynamic import to avoid circular dependency
        const { seedColleges } = await import('../seeders/collegeSeeder.js');
        const { default: College } = await import('../models/College.js');
        
        const collegeCount = await College.countDocuments();
        if (collegeCount === 0) {
          console.log('🌱 No colleges found, seeding database...');
          await seedColleges();
          console.log('✅ Database seeded successfully');
        } else {
          console.log(`📚 Found ${collegeCount} colleges in database`);
        }
      } catch (seedError) {
        console.error('❌ Auto-seeding failed:', seedError.message);
      }
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Check your internet connection and MongoDB URI');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB username and password');
    } else if (error.message.includes('IP whitelist')) {
      console.error('💡 Add your IP address to MongoDB Atlas whitelist');
    }
    
    // Don't exit in development, allow for reconnection attempts
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('🔄 Retrying connection in 10 seconds...');
      setTimeout(connectDB, 10000);
    }
  }
};

export default connectDB;