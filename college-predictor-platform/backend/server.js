import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import puppeteer from 'puppeteer';

// Database and Models
import connectDB from './config/database.js';
import User from './models/User.js';
import College from './models/College.js';
import Prediction from './models/Prediction.js';
import ChatMessage from './models/ChatMessage.js';

// Middleware
import { authenticate, optionalAuth, generateToken } from './middleware/auth.js';

// Seeders
import { seedColleges } from './seeders/collegeSeeder.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true, // Enable credentials for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'MHT-CET Predictor API with MongoDB is running!',
    version: '2.0.0',
    database: 'MongoDB',
    endpoints: {
      health: '/health',
      colleges: '/api/colleges',
      predictions: '/api/predictions',
      auth: '/api/auth/*',
      chat: '/api/chat'
    }
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is reachable!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const collegeCount = await College.countDocuments();
    const userCount = await User.countDocuments();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      stats: {
        colleges: collegeCount,
        users: userCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Seed database route (for development)
app.post('/api/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding not allowed in production'
      });
    }

    await seedColleges();

    res.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: error.message
    });
  }
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { body: req.body, headers: req.headers.origin });
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      console.log('Validation failed: Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await user.save();
    console.log('User created successfully:', user.email);

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('Registration successful for:', user.email);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', { body: req.body, headers: req.headers.origin });
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('Validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('Login failed: Account deactivated for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('Login successful for:', user.email);
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get user profile
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('predictions');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        predictions: user.predictions,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Colleges endpoint with MongoDB
app.get('/api/colleges', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      type,
      city,
      course,
      minCutoff,
      maxCutoff,
      featured,
      limit = 500,
      page = 1,
      sort = 'featured'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (course) {
      query['courses.name'] = new RegExp(course, 'i');
    }

    if (minCutoff || maxCutoff) {
      query['cutoff.general'] = {};
      if (minCutoff) query['cutoff.general'].$gte = parseFloat(minCutoff);
      if (maxCutoff) query['cutoff.general'].$lte = parseFloat(maxCutoff);
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'cutoff':
        sortQuery = { 'cutoff.general': -1 };
        break;
      case 'fees':
        sortQuery = { 'fees.annual': 1 };
        break;
      case 'placement':
        sortQuery = { 'placements.averagePackage.amount': -1 };
        break;
      case 'name':
        sortQuery = { name: 1 };
        break;
      default:
        sortQuery = { featured: -1, 'cutoff.general': -1 };
    }

    // Execute query with pagination
    const colleges = await College.find(query)
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await College.countDocuments(query);

    // Transform data for frontend compatibility
    const transformedColleges = colleges.map(college => ({
      id: college._id,
      name: college.name,
      location: college.location,
      city: college.city,
      type: college.type,
      courses: college.courses.map(c => c.name),
      cutoff: college.cutoff,
      fees: college.fees.formatted,
      placements: {
        averagePackage: college.placements.averagePackage.formatted,
        highestPackage: college.placements.highestPackage.formatted,
        placementRate: `${college.placements.placementRate}%`,
        topRecruiters: college.placements.topRecruiters
      },
      ranking: college.ranking,
      featured: college.featured
    }));

    res.json({
      success: true,
      colleges: transformedColleges,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: colleges.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Colleges fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch colleges',
      error: error.message
    });
  }
});

// Get single college
app.get('/api/colleges/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.json({
      success: true,
      college
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college',
      error: error.message
    });
  }
});

// Enhanced Predictions endpoint with real MHT-CET data
app.post('/api/predictions', optionalAuth, async (req, res) => {
  try {
    const { percentile, category, courses, universityType, includeLadies, includeTFWS } = req.body;

    // Validation
    if (!percentile || !category || !courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide percentile, category, and at least one course'
      });
    }

    const userPercentile = parseFloat(percentile);
    if (userPercentile < 0 || userPercentile > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentile must be between 0 and 100'
      });
    }

    // Get all predictions for all selected courses
    const allPredictions = [];
    const courseResults = {};

    for (const course of courses) {
      // Enhanced course matching with flexible search
      const colleges = await College.find({
        isActive: true,
        $or: [
          { 'courses.name': new RegExp(course, 'i') },
          { 'courses.name': new RegExp(course.replace(/Engineering|Engg/, '(Engineering|Engg)'), 'i') },
          { 'courses.name': new RegExp(course.replace(/Computer Science/, 'Computer'), 'i') },
          { 'courses.name': new RegExp(course.replace(/Information Technology/, 'IT'), 'i') },
          { 'courses.name': new RegExp(course.split(' ')[0], 'i') } // Match the first word (e.g., "Computer")
        ]
      }).lean();

      if (colleges.length > 0) {
        // Generate enhanced predictions for this course using Expert rules
        const coursePredictions = colleges.map((college, index) => {
          // Find the specific course
          const specificCourse = college.courses.find(c =>
            c.name.toLowerCase().includes(course.toLowerCase()) ||
            course.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) ||
            (course.includes('Computer') && c.name.toLowerCase().includes('computer')) ||
            (course.includes('Information') && c.name.toLowerCase().includes('information'))
          );

          if (!specificCourse) return null;

          // MHT-CET Expert Rule: Use General/OPEN for this specific task
          const expertCategory = 'general';

          // Category mapping logic (Expert override for Category = OPEN)
          const getExpertCutoff = (college, course, isLadies, isTFWS) => {
            let cutoff = null;
            let seatType = 'HU';

            // Priority 1: TFWS (Strictly if selected)
            if (isTFWS) {
              cutoff = course.cutoff?.tfws || college.cutoff?.tfws;
              if (cutoff) seatType = 'TFWS';
            }

            // Priority 2: Ladies (Strictly if selected)
            if (!cutoff && isLadies) {
              cutoff = course.cutoff?.ladies?.general || college.cutoff?.ladies?.general;
              if (cutoff) seatType = 'Ladies';
            }

            // Priority 3: General/OPEN (Standard)
            if (!cutoff) {
              cutoff = course.cutoff?.[expertCategory] || college.cutoff?.[expertCategory];
              seatType = 'HU';
            }

            return { cutoff, seatType };
          };

          const { cutoff: cutoffValue, seatType } = getExpertCutoff(college, specificCourse, includeLadies, includeTFWS);

          if (!cutoffValue) return null;

          // MHT-CET Expert Rule: University Type = Home University only (Adjustment = 0)
          const adjustedCutoff = cutoffValue;
          const difference = parseFloat((userPercentile - adjustedCutoff).toFixed(2));

          // Filtering Rule: [ user_percentile → user_percentile + 3 ]
          // This means inclusion if current_cutoff >= user_percentile AND current_cutoff <= user_percentile + 3
          // Note: Higher cutoff means "Dream/Difficult" relative to user, but 
          // eligibility is usually userScore >= cutoff. 
          // However, the prompt says "Include colleges whose closing percentile lies in the range [user_percentile -> user_percentile + 3]"
          // In MHT-CET, "Closing Percentile" usually refers to the cutoff.
          // So we filter: cutoff >= userPercentile && cutoff <= userPercentile + 3
          if (adjustedCutoff < userPercentile || adjustedCutoff > userPercentile + 3) {
            return null;
          }

          // Advanced Probability Scoring for the [Marks, Marks + 3] range
          let admissionChance = 0;
          let probability = "Borderline";

          if (difference >= 0) {
            admissionChance = 85; // This case actually shouldn't happen much with the range filter being [0, +3] for cutoff
            probability = "Probable";
          } else if (difference >= -1.5) {
            admissionChance = 60;
            probability = "Probable";
          } else {
            admissionChance = 40;
            probability = "Borderline";
          }

          // Category labels for UI
          let riskLabel = "Risk";
          if (admissionChance >= 60) riskLabel = "Probable";
          else riskLabel = "Borderline";

          return {
            college: college._id,
            name: college.name,
            location: college.location,
            city: college.city || college.location.split(',')[0],
            type: college.type,
            branch: specificCourse.name, // For the requested format
            course: specificCourse.name,
            seatTypeLabel: seatType, // (HU / Ladies / TFWS)
            cutoffForCategory: cutoffValue,
            adjustedCutoff,
            difference,
            admissionChance,
            probability,
            riskLabel,
            fees: college.fees.formatted,
            placements: {
              averagePackage: college.placements.averagePackage.formatted,
              highestPackage: college.placements.highestPackage.formatted,
              placementRate: `${college.placements.placementRate}%`
            },
            ranking: college.ranking,
            featured: college.featured,
            establishedYear: college.establishedYear
          };
        }).filter(p => p !== null);

        if (coursePredictions.length > 0) {
          // Sorting Rule: Descending order of closing percentile (Highest cutoff first)
          coursePredictions.sort((a, b) => b.adjustedCutoff - a.adjustedCutoff);

          // Assign ranks within this selection
          coursePredictions.forEach((p, idx) => p.rank = idx + 1);

          courseResults[course] = coursePredictions;
          allPredictions.push(...coursePredictions);
        } else {
          courseResults[course] = [];
        }
      }
    }

    if (allPredictions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No colleges found between same and +3 percentile. Try another percentile.'
      });
    }

    // Sort combined results: Highest cutoffs first
    allPredictions.sort((a, b) => b.adjustedCutoff - a.adjustedCutoff);

    // Calculate metadata
    const metadata = {
      totalColleges: allPredictions.length,
      totalCourses: courses.length,
      highChance: allPredictions.filter(p => p.admissionChance >= 60).length,
      mediumChance: allPredictions.filter(p => p.admissionChance >= 40 && p.admissionChance < 60).length,
      lowChance: allPredictions.filter(p => p.admissionChance < 40).length,
      averageChance: allPredictions.length > 0 ? Math.round(allPredictions.reduce((sum, p) => sum + p.admissionChance, 0) / allPredictions.length) : 0,
      universityApplied: "Home University (Expert Rule)",
      algorithmVersion: '5.0 (MHT-CET Expert Pro)'
    };

    // Save history if user is logged in
    let predictionId = null;
    if (req.user) {
      const predictionDoc = new Prediction({
        user: req.user._id,
        inputData: {
          percentile: userPercentile,
          category,
          course: courses,
          universityType,
          includeLadies,
          includeTFWS,
          examType: 'MHT-CET',
          examYear: 2025
        },
        predictions: allPredictions.map(p => ({
          college: p.college,
          course: p.course,
          probability: p.probability,
          admissionChance: p.admissionChance,
          riskLabel: p.riskLabel,
          cutoffForCategory: p.cutoffForCategory,
          adjustedCutoff: p.adjustedCutoff,
          difference: p.difference,
          rank: p.rank,
          fees: p.fees,
          placements: p.placements
        })),
        metadata
      });
      await predictionDoc.save();
      predictionId = predictionDoc._id;
    }

    res.json({
      success: true,
      predictions: allPredictions,
      courseResults,
      metadata,
      predictionId,
      inputParams: { percentile, category, courses, universityType }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate accurate predictions',
      error: error.message
    });
  }
});


// Get user's prediction history
app.get('/api/predictions/history', authenticate, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const predictions = await Prediction.find({ user: req.user._id })
      .populate('predictions.college', 'name location type')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Prediction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      predictions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: predictions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction history',
      error: error.message
    });
  }
});

// Delete a specific prediction
app.delete('/api/predictions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Remove prediction from user's predictions array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { predictions: id }
    });

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete prediction',
      error: error.message
    });
  }
});

// Delete all predictions for a user
app.delete('/api/predictions', authenticate, async (req, res) => {
  try {
    const result = await Prediction.deleteMany({ user: req.user._id });

    // Clear user's predictions array
    await User.findByIdAndUpdate(req.user._id, {
      $set: { predictions: [] }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} predictions deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete predictions',
      error: error.message
    });
  }
});



// Enhanced Chat endpoint with comprehensive college knowledge and MongoDB storage
app.post('/api/chat', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const lowerMessage = message.toLowerCase();
    let response = '';
    let intent = 'general';

    // Enhanced AI responses for comprehensive college information
    if (lowerMessage.includes('coep') || lowerMessage.includes('college of engineering pune')) {
      response = `🏛️ **College of Engineering Pune (COEP)**\n\n📍 **Location**: Pune, Maharashtra\n🏆 **Ranking**: #1 in Maharashtra for Engineering\n💰 **Fees**: ₹87,000/year (Government)\n📊 **Cutoff**: 99.5%+ for Computer Engineering\n💼 **Placements**: Average ₹12 LPA, Highest ₹45 LPA\n🏢 **Top Recruiters**: Microsoft, Google, Amazon, TCS\n📚 **Popular Branches**: Computer, IT, Mechanical, Civil\n\nWould you like specific information about any branch or placement details?`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('vjti') || lowerMessage.includes('veermata jijabai')) {
      response = `🏛️ **Veermata Jijabai Technological Institute (VJTI)**\n\n📍 **Location**: Mumbai, Maharashtra\n🏆 **Ranking**: #2 in Maharashtra for Engineering\n💰 **Fees**: ₹83,000/year (Government)\n📊 **Cutoff**: 99.3%+ for Computer Engineering\n💼 **Placements**: Average ₹11.5 LPA, Highest ₹42 LPA\n🏢 **Top Recruiters**: Google, Microsoft, Amazon, Infosys\n📚 **Popular Branches**: Computer, IT, Electronics, Mechanical\n\nNeed more details about admissions or specific branches?`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('cutoff') || lowerMessage.includes('percentile')) {
      response = `📊 **MHT-CET 2025 Cutoff Information**\n\n🎯 **Top Colleges Cutoffs (General Category)**:\n• COEP Pune: 99.5%+ (Computer Engineering)\n• VJTI Mumbai: 99.3%+ (Computer Engineering)\n• Government College Aurangabad: 97.5%+\n• Walchand Sangli: 96.8%+\n\n📈 **Category-wise Cutoffs Available**:\n• **General Categories**: General Open, OBC, SC, ST, EWS\n• **Tribal Categories**: VJNT, NT1, NT2, NT3\n• **Special Categories**: SEBC, TFWS\n• **Ladies Categories**: All above categories with ladies quota\n\n💡 **Cutoff Trends**:\n• General: Highest cutoffs\n• OBC: 3-8% lower than General\n• SC/ST: 10-20% lower than General\n• EWS: Similar to General\n• Ladies: Slightly lower than respective categories\n\nWhich specific college or branch cutoff would you like to know?`;
      intent = 'cutoff_inquiry';
    } else if (lowerMessage.includes('fees') || lowerMessage.includes('cost') || lowerMessage.includes('tuition')) {
      response = `💰 **Engineering College Fees in Maharashtra**\n\n🏛️ **Government Colleges**:\n• COEP, VJTI: ₹80,000 - ₹1,00,000/year\n• Other Govt Colleges: ₹60,000 - ₹90,000/year\n\n🏢 **Private Colleges**:\n• Tier 1 Private: ₹2-5 lakhs/year\n• Tier 2 Private: ₹1.5-3 lakhs/year\n• Deemed Universities: ₹5-15 lakhs/year\n\n💡 **Additional Costs**:\n• Hostel: ₹50,000-₹1,50,000/year\n• Books & Materials: ₹20,000-₹30,000/year\n\n🎓 **Scholarships Available**: Merit-based, Need-based, Category-based\n\nWant details about specific college fees or scholarship information?`;
      intent = 'fees_inquiry';
    } else if (lowerMessage.includes('placement') || lowerMessage.includes('job') || lowerMessage.includes('salary') || lowerMessage.includes('package')) {
      response = `💼 **Placement Statistics Maharashtra Engineering**\n\n🏆 **Top Performing Colleges**:\n• COEP: 98% placement, ₹12 LPA avg, ₹45 LPA highest\n• VJTI: 96% placement, ₹11.5 LPA avg, ₹42 LPA highest\n• Govt College Aurangabad: 92% placement, ₹8 LPA avg\n\n📊 **Branch-wise Average Packages**:\n• Computer Engineering: ₹12 LPA\n• Information Technology: ₹11 LPA\n• Electronics & Telecom: ₹8 LPA\n• Mechanical Engineering: ₹7 LPA\n\n🏢 **Top Recruiters**: Microsoft, Google, Amazon, TCS, Infosys, L&T, Bajaj Auto\n\nWant specific placement data for any college or branch?`;
      intent = 'placement_inquiry';
    } else if (lowerMessage.includes('course') || lowerMessage.includes('branch') || lowerMessage.includes('stream')) {
      response = `📚 **Engineering Branches in Maharashtra**\n\n🔥 **High Demand Branches**:\n• Computer Engineering - Best placements, highest packages\n• Information Technology - Similar to CSE, great opportunities\n• Electronics & Telecommunication - Good scope in tech\n\n⚙️ **Core Engineering Branches**:\n• Mechanical Engineering - Automotive, manufacturing\n• Civil Engineering - Infrastructure, construction\n• Electrical Engineering - Power, automation\n\n🧪 **Specialized Branches**:\n• Chemical Engineering - Process industries\n• Automobile Engineering - Automotive sector\n• Instrumentation Engineering - Automation, control\n\n💡 **Choosing Tips**: Consider your interests, placement trends, and future scope!\n\nNeed detailed information about any specific branch?`;
      intent = 'course_inquiry';
    } else if (lowerMessage.includes('admission') || lowerMessage.includes('counseling') || lowerMessage.includes('cap')) {
      response = `🎓 **MHT-CET 2025 Admission Process**\n\n📅 **Important Dates**:\n• Application: March 2025\n• Exam Date: May 2025\n• Results: June 2025\n• CAP Counseling: July-August 2025\n\n📋 **CAP Process**:\n1. Online Registration & Document Verification\n2. Choice Filling (College & Branch preferences)\n3. Seat Allotment (Multiple rounds)\n4. Reporting to Allotted College\n\n📄 **Required Documents**:\n• 10th & 12th Marksheets\n• MHT-CET Scorecard\n• Domicile Certificate\n• Caste Certificate (if applicable)\n• Income Certificate\n\n💡 **Pro Tips**: Keep multiple backup options, participate in all rounds!\n\nNeed help with any specific admission step?`;
      intent = 'admission_process';
    } else if (lowerMessage.includes('hostel') || lowerMessage.includes('accommodation') || lowerMessage.includes('campus')) {
      response = `🏠 **Campus & Hostel Information**\n\n🏛️ **Campus Facilities**:\n• Modern Labs & Workshops\n• Central Library with e-resources\n• Sports Complex & Gymnasium\n• Auditorium & Seminar Halls\n• Wi-Fi Campus\n\n🏠 **Hostel Facilities**:\n• Separate Boys & Girls Hostels\n• AC/Non-AC rooms available\n• Mess with quality food\n• 24/7 Security & Medical facility\n• Recreation rooms & study areas\n\n💰 **Hostel Fees**:\n• Government Colleges: ₹50,000-₹80,000/year\n• Private Colleges: ₹1,00,000-₹2,00,000/year\n\n📍 **Location Advantages**: Consider proximity to IT hubs, internship opportunities\n\nWant specific hostel details for any college?`;
      intent = 'campus_inquiry';
    } else if (lowerMessage.includes('scholarship') || lowerMessage.includes('financial aid')) {
      response = `🎓 **Scholarships for Engineering Students**\n\n🏆 **Merit-based Scholarships**:\n• Top 10% students: Up to ₹50,000/year\n• Academic Excellence Awards\n• Topper Scholarships\n\n👥 **Category-based Scholarships**:\n• SC/ST: Full fee waiver + stipend\n• OBC: 50% fee concession\n• EWS: Fee concession available\n\n💰 **Need-based Aid**:\n• Family income < ₹2.5 lakhs: Full support\n• Income ₹2.5-5 lakhs: Partial support\n\n🏢 **Corporate Scholarships**:\n• TCS, Infosys, Wipro student programs\n• Industry-specific scholarships\n\n📋 **Application**: Apply during admission process with income/caste certificates\n\nNeed help with scholarship applications?`;
      intent = 'scholarship_inquiry';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = `👋 Hello! I'm your comprehensive MHT-CET AI Assistant, ready to help with all your engineering college queries!\n\n🎯 **I can help you with**:\n• College information & rankings\n• Admission process & cutoffs\n• Fees & scholarships\n• Placement statistics\n• Course details & career prospects\n• Campus facilities & hostel info\n• Exam preparation tips\n\n💡 **Popular Questions**:\n"Tell me about COEP placements"\n"What are the fees for government colleges?"\n"Which branch has best placements?"\n"How is the admission process?"\n\nWhat would you like to know about Maharashtra engineering colleges?`;
      intent = 'greeting';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('difference')) {
      response = `⚖️ **College Comparison Guide**\n\n🏆 **COEP vs VJTI**:\n• COEP: Pune location, slightly higher cutoff, strong alumni network\n• VJTI: Mumbai location, better industry exposure, similar placements\n\n🎯 **Government vs Private**:\n• Government: Lower fees, better ROI, established reputation\n• Private: Modern infrastructure, industry partnerships, flexible curriculum\n\n📊 **Branch Comparison**:\n• CSE vs IT: Very similar, CSE slightly broader scope\n• CSE vs ECE: CSE better for software, ECE for hardware/telecom\n• Mechanical vs Civil: Mech for automotive, Civil for construction\n\n💡 **Comparison Factors**: Cutoff, fees, placements, location, faculty, infrastructure\n\nWhich specific colleges or branches would you like me to compare?`;
      intent = 'comparison';
    } else if (lowerMessage.includes('preparation') || lowerMessage.includes('study') || lowerMessage.includes('exam')) {
      response = `📚 **MHT-CET Preparation Strategy**\n\n📖 **Syllabus Coverage**:\n• Physics: 11th & 12th Maharashtra Board\n• Chemistry: 11th & 12th Maharashtra Board  \n• Mathematics: 11th & 12th Maharashtra Board\n\n⏰ **Time Management**:\n• Physics: 50 questions, 90 minutes\n• Chemistry: 50 questions, 90 minutes\n• Mathematics: 50 questions, 90 minutes\n\n📝 **Preparation Tips**:\n• Focus on NCERT + Maharashtra Board books\n• Practice previous year papers\n• Take regular mock tests\n• Strengthen weak areas\n\n🎯 **Target Strategy**: Aim for 95%+ for top colleges, 85%+ for good colleges\n\nNeed specific subject-wise preparation guidance?`;
      intent = 'preparation';
    } else if (lowerMessage.includes('history') || lowerMessage.includes('previous')) {
      response = `📚 **Chat History & Previous Conversations**\n\n✅ **Your chat history is automatically saved** when you're logged in!\n\n🔍 **How to access**:\n• Click the chat history sidebar (💬 icon)\n• Browse your previous sessions\n• Click any session to reload that conversation\n\n💾 **What's stored**:\n• All your questions and my responses\n• Session timestamps\n• Conversation topics\n\n🔒 **Privacy**: Only you can see your chat history when logged in\n\nIs there something specific from our previous chats you'd like to discuss?`;
      intent = 'history_inquiry';
    } else {
      response = `🤖 I'm your comprehensive MHT-CET AI Assistant! I can help with:\n\n🎓 **College Information**:\n• Rankings & comparisons\n• Admission cutoffs & process\n• Fees & scholarship details\n• Campus facilities & hostels\n\n💼 **Career Guidance**:\n• Placement statistics & trends\n• Branch-wise opportunities\n• Industry insights\n• Salary packages\n\n📚 **Academic Support**:\n• Course details & curriculum\n• Exam preparation tips\n• Study strategies\n\n💡 **Try asking**:\n"Which college is best for Computer Engineering?"\n"What are the placement statistics for COEP?"\n"How much are the fees for government colleges?"\n"Compare COEP vs VJTI"\n\nWhat would you like to know about Maharashtra engineering colleges?`;
      intent = 'general';
    }

    // Save chat message if user is authenticated and sessionId is provided
    if (req.user && sessionId) {
      try {
        let chatDoc = await ChatMessage.findOne({
          user: req.user._id,
          sessionId
        });

        if (!chatDoc) {
          chatDoc = new ChatMessage({
            user: req.user._id,
            sessionId,
            messages: [],
            context: {
              lastTopic: intent,
              userPreferences: {}
            }
          });
        }

        // Add user message
        chatDoc.messages.push({
          type: 'user',
          message: message.trim(),
          timestamp: new Date()
        });

        // Add bot response
        chatDoc.messages.push({
          type: 'bot',
          message: response,
          timestamp: new Date(),
          metadata: {
            intent,
            confidence: 0.8,
            responseTime: Date.now()
          }
        });

        // Update context
        chatDoc.context.lastTopic = intent;
        chatDoc.updatedAt = new Date();

        await chatDoc.save();
      } catch (chatError) {
        console.error('Chat save error:', chatError);
        // Continue without saving if there's an error
      }
    }

    res.json({
      success: true,
      response,
      intent,
      sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Chat service temporarily unavailable',
      error: error.message
    });
  }
});

// Get chat history for authenticated users
app.get('/api/chat/history', authenticate, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const chatSessions = await ChatMessage.find({
      user: req.user._id,
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('sessionId messages updatedAt context')
      .lean();

    // Transform sessions for frontend
    const sessions = chatSessions.map(session => {
      const lastMessage = session.messages[session.messages.length - 1];
      const firstUserMessage = session.messages.find(msg => msg.type === 'user');

      return {
        sessionId: session.sessionId,
        lastMessage: session.updatedAt,
        messageCount: session.messages.length,
        preview: firstUserMessage ? firstUserMessage.message.substring(0, 50) + '...' : 'New conversation',
        lastTopic: session.context?.lastTopic || 'general'
      };
    });

    const total = await ChatMessage.countDocuments({
      user: req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: sessions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// Get chat history
app.get('/api/chat/history/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatDoc = await ChatMessage.findOne({
      user: req.user._id,
      sessionId
    });

    if (!chatDoc) {
      return res.json({
        success: true,
        messages: []
      });
    }

    res.json({
      success: true,
      messages: chatDoc.messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// Delete a specific chat session
app.delete('/api/chat/history/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await ChatMessage.findOneAndDelete({
      user: req.user._id,
      sessionId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
      error: error.message
    });
  }
});

// Delete all chat history for a user
app.delete('/api/chat/history', authenticate, async (req, res) => {
  try {
    const result = await ChatMessage.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: `${result.deletedCount} chat sessions deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat history',
      error: error.message
    });
  }
});

// PDF generation endpoint
app.post('/api/generate-pdf', optionalAuth, async (req, res) => {
  try {
    const { predictions, studentInfo, predictionId } = req.body;

    // Update download count if predictionId is provided and user is authenticated
    if (predictionId && req.user) {
      await Prediction.findByIdAndUpdate(predictionId, {
        $inc: { downloadCount: 1 },
        status: 'downloaded'
      });
    }

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MHT-CET College Prediction Report</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #fff;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { 
            text-align: center; 
            color: #2563eb; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .header p { font-size: 14px; color: #666; }
          .student-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            border: 1px solid #e2e8f0; 
          }
          .student-info h3 { color: #2563eb; margin-bottom: 15px; }
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
          }
          .info-card { 
            background: #fff; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
            text-align: center; 
          }
          .info-card strong { display: block; margin-bottom: 5px; color: #374151; }
          .college { 
            border: 1px solid #d1d5db; 
            margin: 15px 0; 
            padding: 20px; 
            border-radius: 8px; 
            page-break-inside: avoid;
          }
          .college.high { border-left: 5px solid #10b981; background: #f0fdf4; }
          .college.medium { border-left: 5px solid #f59e0b; background: #fffbeb; }
          .college.low { border-left: 5px solid #ef4444; background: #fef2f2; }
          .college h4 { color: #1f2937; margin-bottom: 10px; font-size: 18px; }
          .college-info { margin-bottom: 15px; }
          .college-info p { margin-bottom: 5px; }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px; 
            margin: 15px 0; 
          }
          .stat-card { 
            background: #fff; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
            text-align: center; 
            font-size: 12px;
          }
          .stat-card strong { display: block; margin-bottom: 5px; }
          .placement-info { 
            background: #f1f5f9; 
            padding: 15px; 
            margin-top: 15px; 
            border-radius: 6px; 
          }
          .placement-info h5 { color: #374151; margin-bottom: 10px; }
          .footer { 
            margin-top: 40px; 
            padding: 20px; 
            background: #fef3c7; 
            border-radius: 8px; 
            page-break-inside: avoid;
          }
          .footer h4 { color: #92400e; margin-bottom: 15px; }
          .footer ul { margin-left: 20px; }
          .footer li { margin-bottom: 8px; font-size: 14px; }
          .probability-high { color: #10b981; font-weight: bold; }
          .probability-medium { color: #f59e0b; font-weight: bold; }
          .probability-low { color: #ef4444; font-weight: bold; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .college { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 MHT-CET 2025 College Prediction Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
            <p><strong>Report ID:</strong> ${predictionId || 'Guest User'}</p>
          </div>
          
          <div class="student-info">
            <h3>📋 Student Information</h3>
            <div class="info-grid">
              <div class="info-card">
                <strong>Percentile</strong>
                ${studentInfo.percentile}%
              </div>
              <div class="info-card">
                <strong>Category</strong>
                ${studentInfo.category.toUpperCase()}
              </div>
              <div class="info-card">
                <strong>Preferred Course</strong>
                ${studentInfo.course || studentInfo.courses?.[0] || 'N/A'}
              </div>
              <div class="info-card">
                <strong>Student Name</strong>
                ${studentInfo.name || 'Guest User'}
              </div>
            </div>
          </div>
          
          <h3 style="color: #2563eb; margin-bottom: 20px;">🏛️ College Predictions (${predictions.length} Results)</h3>
          
          ${predictions.map((college, index) => `
            <div class="college ${college.riskLabel.toLowerCase()}">
              <h4>${index + 1}. ${college.name}</h4>
              <div class="college-info">
                <p><strong>📍 City:</strong> ${college.city || college.location.split(',')[0]}</p>
                <p><strong>� Branch:</strong> ${college.branch || college.course}</p>
                <p><strong>🪑 Seat Type:</strong> ${college.seatTypeLabel || 'HU'}</p>
                <p><strong>🎲 Admission Chance:</strong> 
                  <span class="probability-${college.riskLabel.toLowerCase()}">
                    ${college.riskLabel} (${college.admissionChance}%)
                  </span>
                </p>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <strong>Closing Percentile</strong>
                  ${college.cutoffForCategory}%
                </div>
                <div class="stat-card">
                  <strong>State Rank Approx</strong>
                  ${college.rank || 'N/A'}
                </div>
                <div class="stat-card">
                  <strong>Annual Fees</strong>
                  ${college.fees}
                </div>
              </div>
            </div>
          `).join('')}
          
          ${predictions.length > 20 ? `
            <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
              <p><strong>Note:</strong> Showing top 20 results out of ${predictions.length} total predictions.</p>
              <p>Login to access complete results and save your predictions.</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <h4>⚠️ Important Disclaimer & Notes</h4>
            <ul>
              <li><strong>Prediction Accuracy:</strong> Based on MHT-CET 2025 official data and previous year trends. Actual cutoffs may vary.</li>
              <li><strong>Admission Process:</strong> Final admission depends on seat availability, counseling process, and document verification.</li>
              <li><strong>Strategy:</strong> Apply to colleges across different probability ranges for better chances.</li>
              <li><strong>Official Verification:</strong> Always verify information from official MHT-CET and college websites.</li>
              <li><strong>Counseling:</strong> Participate in all counseling rounds with required documents ready.</li>
              <li><strong>Support:</strong> Contact college admission offices directly for specific queries.</li>
            </ul>
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #d1d5db;">
              <p><strong>🌟 Best of luck with your admissions!</strong></p>
              <p style="font-size: 12px; color: #666;">Generated by MHT-CET Predictor Pro | Visit: localhost:5173</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MHT-CET-Prediction-Report-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
});

// Get placement statistics
app.get('/api/placements', async (req, res) => {
  try {
    const { college, branch } = req.query;

    // Mock placement data - in real implementation, this would come from database
    const placementData = {
      overall: {
        highestPackage: '₹45 LPA',
        averagePackage: '₹8.5 LPA',
        placementRate: '95%',
        totalCompanies: 500
      },
      colleges: [
        {
          name: 'College of Engineering Pune (COEP)',
          location: 'Pune',
          placements: {
            averagePackage: '₹12 LPA',
            highestPackage: '₹45 LPA',
            placementRate: '98%',
            totalStudents: 550,
            studentsPlaced: 539
          },
          companies: [
            { name: 'Microsoft', package: '₹45 LPA', type: 'Product', selected: 12 },
            { name: 'Google', package: '₹42 LPA', type: 'Product', selected: 8 },
            { name: 'Amazon', package: '₹38 LPA', type: 'Product', selected: 15 },
            { name: 'TCS', package: '₹7 LPA', type: 'Service', selected: 85 },
            { name: 'Infosys', package: '₹6.5 LPA', type: 'Service', selected: 72 }
          ],
          branchWise: [
            {
              branch: 'Computer Engineering',
              students: 120,
              placed: 118,
              averagePackage: '₹14 LPA',
              highestPackage: '₹45 LPA',
              placementRate: '98%',
              topRecruiters: ['Microsoft', 'Google', 'Amazon', 'TCS']
            },
            {
              branch: 'Information Technology',
              students: 90,
              placed: 87,
              averagePackage: '₹13 LPA',
              highestPackage: '₹42 LPA',
              placementRate: '97%',
              topRecruiters: ['Google', 'Amazon', 'Infosys', 'Wipro']
            },
            {
              branch: 'Electronics & Telecommunication',
              students: 80,
              placed: 74,
              averagePackage: '₹9 LPA',
              highestPackage: '₹35 LPA',
              placementRate: '93%',
              topRecruiters: ['Qualcomm', 'Intel', 'TCS', 'L&T']
            },
            {
              branch: 'Mechanical Engineering',
              students: 100,
              placed: 88,
              averagePackage: '₹8 LPA',
              highestPackage: '₹28 LPA',
              placementRate: '88%',
              topRecruiters: ['L&T', 'Bajaj Auto', 'Mahindra', 'Tata Motors']
            }
          ]
        },
        {
          name: 'Veermata Jijabai Technological Institute (VJTI)',
          location: 'Mumbai',
          placements: {
            averagePackage: '₹11.5 LPA',
            highestPackage: '₹42 LPA',
            placementRate: '96%',
            totalStudents: 480,
            studentsPlaced: 461
          },
          companies: [
            { name: 'Google', package: '₹42 LPA', type: 'Product', selected: 10 },
            { name: 'Microsoft', package: '₹40 LPA', type: 'Product', selected: 8 },
            { name: 'Amazon', package: '₹35 LPA', type: 'Product', selected: 12 },
            { name: 'Infosys', package: '₹7 LPA', type: 'Service', selected: 78 },
            { name: 'TCS', package: '₹6.8 LPA', type: 'Service', selected: 82 }
          ],
          branchWise: [
            {
              branch: 'Computer Engineering',
              students: 100,
              placed: 98,
              averagePackage: '₹13 LPA',
              highestPackage: '₹42 LPA',
              placementRate: '98%',
              topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Infosys']
            },
            {
              branch: 'Information Technology',
              students: 80,
              placed: 77,
              averagePackage: '₹12 LPA',
              highestPackage: '₹40 LPA',
              placementRate: '96%',
              topRecruiters: ['Microsoft', 'Amazon', 'TCS', 'Wipro']
            }
          ]
        }
      ],
      branchWiseOverall: [
        {
          branch: 'Computer Engineering',
          averagePackage: '₹12 LPA',
          highestPackage: '₹45 LPA',
          placementRate: '98%',
          totalStudents: 2500,
          studentsPlaced: 2450
        },
        {
          branch: 'Information Technology',
          averagePackage: '₹11 LPA',
          highestPackage: '₹42 LPA',
          placementRate: '97%',
          totalStudents: 2000,
          studentsPlaced: 1940
        },
        {
          branch: 'Electronics & Telecommunication',
          averagePackage: '₹8 LPA',
          highestPackage: '₹35 LPA',
          placementRate: '92%',
          totalStudents: 1800,
          studentsPlaced: 1656
        },
        {
          branch: 'Mechanical Engineering',
          averagePackage: '₹7 LPA',
          highestPackage: '₹28 LPA',
          placementRate: '88%',
          totalStudents: 2200,
          studentsPlaced: 1936
        },
        {
          branch: 'Civil Engineering',
          averagePackage: '₹6 LPA',
          highestPackage: '₹22 LPA',
          placementRate: '85%',
          totalStudents: 1900,
          studentsPlaced: 1615
        },
        {
          branch: 'Electrical Engineering',
          averagePackage: '₹7.5 LPA',
          highestPackage: '₹30 LPA',
          placementRate: '90%',
          totalStudents: 1600,
          studentsPlaced: 1440
        }
      ],
      topRecruiters: [
        'Microsoft', 'Google', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM',
        'Cognizant', 'Capgemini', 'L&T', 'Bajaj Auto', 'Mahindra', 'Tata Motors',
        'Reliance', 'HDFC Bank', 'Deloitte', 'PwC', 'EY', 'KPMG'
      ]
    };

    // Filter data based on query parameters
    let responseData = placementData;

    if (college) {
      const collegeData = placementData.colleges.find(c =>
        c.name.toLowerCase().includes(college.toLowerCase())
      );
      if (collegeData) {
        responseData = {
          college: collegeData,
          overall: placementData.overall
        };
      }
    }

    if (branch) {
      const branchData = placementData.branchWiseOverall.find(b =>
        b.branch.toLowerCase().includes(branch.toLowerCase())
      );
      if (branchData) {
        responseData = {
          branch: branchData,
          overall: placementData.overall
        };
      }
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Placement data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch placement data',
      error: error.message
    });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      College.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Prediction.countDocuments(),
      College.countDocuments({ type: 'Government' }),
      College.countDocuments({ type: 'Private' })
    ]);

    const [totalColleges, totalUsers, totalPredictions, govColleges, privateColleges] = stats;

    // Get average placement data
    const placementStats = await College.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          avgPackage: { $avg: '$placements.averagePackage.amount' },
          maxPackage: { $max: '$placements.highestPackage.amount' },
          avgPlacementRate: { $avg: '$placements.placementRate' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        colleges: {
          total: totalColleges,
          government: govColleges,
          private: privateColleges
        },
        users: totalUsers,
        predictions: totalPredictions,
        placements: placementStats[0] || {
          avgPackage: 0,
          maxPackage: 0,
          avgPlacementRate: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Seed colleges endpoint (for development)
app.post('/api/seed-colleges', async (req, res) => {
  try {
    console.log('🔄 Starting college seeding via API...');

    // Import the seeder
    const { seedColleges } = await import('./seeders/collegeSeeder.js');

    // Run the seeder
    const colleges = await seedColleges();

    res.json({
      success: true,
      message: `Successfully seeded ${colleges.length} colleges`,
      count: colleges.length
    });
  } catch (error) {
    console.error('❌ Seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed colleges',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/seed',
      'POST /api/seed-colleges',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'GET /api/colleges',
      'GET /api/colleges/:id',
      'POST /api/predictions',
      'GET /api/predictions/history',
      'POST /api/chat',
      'GET /api/chat/history',
      'GET /api/chat/history/:sessionId',
      'POST /api/generate-pdf',
      'GET /api/placements',
      'GET /api/stats'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🍃 Database: MongoDB`);
  console.log(`🔗 Backend accessible at: http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});