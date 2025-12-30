import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedColleges } from './seeders/collegeSeeder.js';

dotenv.config();

const runSeeder = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        await seedColleges();

        console.log('🏁 Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

runSeeder();
