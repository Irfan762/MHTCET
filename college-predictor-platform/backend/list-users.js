import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-predictor');
        console.log('MongoDB Connected');

        const users = await User.find({}, 'name email role');
        console.log('Total Users found:', users.length);
        console.table(users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
