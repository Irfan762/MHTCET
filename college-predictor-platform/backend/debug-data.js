import mongoose from 'mongoose';
import College from './models/College.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mhtcet-predictor';

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const vjti = await College.findOne({ name: /Veermata Jijabai/i }).lean();
        if (vjti) {
            console.log('College Name:', vjti.name);
            console.log('Top-level Rounds count:', vjti.rounds?.length);
            if (vjti.rounds?.length > 0) {
                console.log('Round 1 Data:', JSON.stringify(vjti.rounds[0], null, 2));
            }

            console.log('Courses count:', vjti.courses?.length);
            if (vjti.courses?.length > 0) {
                const firstCourse = vjti.courses[0];
                console.log('First Course Name:', firstCourse.name);
                console.log('First Course Rounds count:', firstCourse.rounds?.length);
            }
        } else {
            console.log('VJTI not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
