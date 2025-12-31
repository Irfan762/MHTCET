import mongoose from 'mongoose';
import checkDB from './config/database.js'; // Assuming connectDB works or I can copy it
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-predictor');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const testLogin = async () => {
    await connectDB();

    const email = 'admin@mhtcet.com';
    const password = 'Irfan@808080';

    console.log(`Testing login for ${email} with password: ${password}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        console.log('User not found!');
        process.exit(1);
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    process.exit(0);
};

testLogin();
