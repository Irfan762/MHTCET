import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Database and Models
import connectDB from './config/database.js';
import User from './models/User.js';
import College from './models/College.js';
import Prediction from './models/Prediction.js';
import ChatMessage from './models/ChatMessage.js';

// Middleware
import { authenticate, optionalAuth, generateToken, authorize } from './middleware/auth.js';

// Seeders
import { seedColleges } from './seeders/collegeSeeder.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeLookupText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
const canonicalizeCollegeLookup = (value = '') => {
  let normalized = normalizeLookupText(value);
  normalized = normalized.replace(/chhatrapatisambhajinagar/g, 'aurangabad');
  normalized = normalized.replace(/sambhajinagar/g, 'aurangabad');
  normalized = normalized.replace(/govt/g, 'government');
  return normalized;
};

// Branch name aliases for matching similar branches
const branchAliases = {
  'computerengineering': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'computerscienceandengineering': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'computerscienceengg': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'cse': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'cs': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'electricalengineering': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'electricalengg': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'ee': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'electronicsengg': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'electronicsandtelecommunicationengg': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'electronics': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'ece': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'etc': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'mechanicalengineering': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'mechanicalengg': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'me': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'civilengineering': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'civilengg': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'ce': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'instrumentationengineering': ['instrumentationengineering', 'instrumentationengg', 'ie'],
  'informationtechnology': ['informationtechnology', 'it'],
  'it': ['informationtechnology', 'it']
};

const canonicalizeBranchName = (branchName = '') => {
  const normalized = normalizeLookupText(branchName);
  // Return all matching aliases
  for (const [key, aliases] of Object.entries(branchAliases)) {
    if (aliases.includes(normalized)) {
      return aliases; // Return all aliases for this branch
    }
  }
  return [normalized]; // Return the normalized name if no alias found
};

const parseCsvLine = (line = '') => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

const loadCsvCutoffData = () => {
  try {
    const csvPath = path.join(__dirname, '../../MHTCET_Cutoff_All_4_Rounds.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn('[CSV] Cutoff file not found:', csvPath);
      return [];
    }

    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const idx = headers.reduce((acc, header, i) => {
      acc[header] = i;
      return acc;
    }, {});

    const getValue = (parts, key) => {
      const colIdx = idx[key];
      if (typeof colIdx === 'undefined') return '';
      return (parts[colIdx] || '').trim().replace(/^"|"$/g, '');
    };

    const getNumber = (parts, key) => {
      const value = getValue(parts, key);
      if (!value) return null;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i]);
      const collegeName = getValue(parts, 'college_name');
      const branchName = getValue(parts, 'branch_name');
      if (!collegeName || !branchName) continue;

      const rounds = [];
      for (let round = 1; round <= 4; round++) {
        const cutoffByCategory = {
          general: getNumber(parts, `general_percentage_r${round}`),
          obc: getNumber(parts, `obc_percentage_r${round}`),
          sc: getNumber(parts, `sc_percentage_r${round}`),
          st: getNumber(parts, `st_percentage_r${round}`),
          ews: getNumber(parts, `ews_percentage_r${round}`),
          vjnt: getNumber(parts, `vjnt_percentage_r${round}`),
          nt1: null,
          nt2: null,
          nt3: null,
          sebc: getNumber(parts, `sbc_percentage_r${round}`),
          tfws: null
        };

        const hasCutoff = Object.values(cutoffByCategory).some((value) => value !== null && value !== undefined);
        if (!hasCutoff) continue;

        const isTfws = getValue(parts, 'is_tfws') === 'Yes' || getValue(parts, 'is_tfws') === 'TRUE';
        const seatLevel = getValue(parts, 'seat_level') || 'General';
        
        rounds.push({
          round,
          cutoffByCategory,
          cutoff: cutoffByCategory.general,
          seatType: seatLevel,
          isTfws: isTfws,
          seatTypeLabel: isTfws ? `${seatLevel} (TFWS)` : seatLevel
        });
      }

      records.push({
        collegeName,
        collegeNameNormalized: normalizeLookupText(collegeName),
        branchName,
        branchNameNormalized: normalizeLookupText(branchName),
        collegeCode: getValue(parts, 'college_code'),
        branchCode: getValue(parts, 'branch_code'),
        location: getValue(parts, 'location'),
        collegeType: getValue(parts, 'college_type'),
        rounds
      });
    }

    console.log(`[CSV] Loaded ${records.length} cutoff rows from CSV`);
    return records;
  } catch (error) {
    console.error('[CSV] Failed to load cutoff data:', error.message);
    return [];
  }
};

const csvCutoffRows = loadCsvCutoffData();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());

// CORS configuration - allow frontend origin from environment or use local defaults
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: allowedOrigins,
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

// ---------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------

// SEED ADMIN (Dev only - create admin with custom credentials)
app.post('/api/admin/seed', async (req, res) => {
  try {
    const adminEmail = 'admin@mhtcet.com';
    const adminPass = 'Irfan@808080'; // Updated as per user request

    // Check if exists
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      // Update password if admin exists
      admin.password = adminPass; // schema pre-save will hash it
      admin.role = 'admin';
      await admin.save();
      return res.json({ success: true, message: 'Admin updated successfully', email: adminEmail });
    }

    // Create
    admin = new User({
      name: 'System Admin',
      email: adminEmail,
      password: adminPass,
      role: 'admin',
      isActive: true,
      profile: {
        city: 'Mumbai',
        category: 'General'
      }
    });

    await admin.save();

    res.json({
      success: true,
      message: 'Admin user created successfully',
      email: adminEmail,
      hint: 'Password is Irfan@808080'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET ALL USERS (Admin Only)
app.get('/api/admin/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password
      .populate('predictions', 'createdAt inputData predictions') // Include prediction data
      .sort({ createdAt: -1 }); // Newest first

    // Enhance user data with statistics
    const enhancedUsers = users.map(user => {
      const userObj = user.toObject();
      
      // Calculate prediction statistics
      const predictions = userObj.predictions || [];
      const totalPredictions = predictions.length;
      const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1].createdAt : null;
      
      // Calculate total colleges predicted
      let totalColleges = 0;
      predictions.forEach(pred => {
        if (pred.predictions && Array.isArray(pred.predictions)) {
          totalColleges += pred.predictions.length;
        }
      });

      return {
        ...userObj,
        stats: {
          totalPredictions,
          totalColleges,
          lastPrediction,
          isActive: user.isActive,
          daysSinceJoined: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        }
      };
    });

    res.json({
      success: true,
      users: enhancedUsers,
      totalUsers: enhancedUsers.length,
      activeUsers: enhancedUsers.filter(u => u.isActive).length,
      studentsCount: enhancedUsers.filter(u => u.role === 'student').length,
      adminsCount: enhancedUsers.filter(u => u.role === 'admin').length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// DELETE USER (Admin Only)
app.delete('/api/admin/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting self (current logged in admin)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Also delete related data? (Optional: Predictions, ChatHistory)
    // For now, simple user deletion is sufficient.

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
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
      _id: college._id,
      name: college.name,
      location: college.location,
      city: college.city,
      type: college.type,
      autonomous: college.type === 'Autonomous',
      establishedYear: college.establishedYear,
      courses: college.courses.map(c => ({
        name: c.name,
        intake: c.intake,
        rounds: c.rounds.map(r => ({
          round: r.number,
          cutoff: r.cutoff?.general || r.cutoff?.tfws || 0,
          cutoffByCategory: {
            general: r.cutoff?.general,
            obc: r.cutoff?.obc,
            sc: r.cutoff?.sc,
            st: r.cutoff?.st,
            ews: r.cutoff?.ews,
            vjnt: r.cutoff?.vjnt,
            nt1: r.cutoff?.nt1,
            nt2: r.cutoff?.nt2,
            nt3: r.cutoff?.nt3,
            sebc: r.cutoff?.sebc,
            tfws: r.cutoff?.tfws
          },
          seatType: r.cutoff?.tfws ? 'TFWS' : 'General'
        }))
      })),
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

// Get round-wise data for a college
app.get('/api/colleges/:id/rounds', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    res.json({
      success: true,
      collegeName: college.name,
      rounds: college.rounds,
      courses: college.courses.map(c => ({
        name: c.name,
        rounds: c.rounds
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced Predictions endpoint with real MHT-CET data
app.post('/api/predictions', optionalAuth, async (req, res) => {
  try {
    const { percentile, category, courses, universityType, includeLadies, includeTFWS } = req.body;
    console.log('[ML Prediction] Request received:', { percentile, category, courses, universityType, includeLadies, includeTFWS });

    // Validation
    if (!percentile || !category || !courses || !Array.isArray(courses) || courses.length === 0) {
      console.log('[ML Prediction] Validation failed: Missing fields');
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

    // --- ML MODEL PREDICTION (90%+ ACCURACY) ---
    // Call Python Flask ML API for enhanced predictions
    let predictions = [];
    try {
      console.log('[ML Prediction] Calling Flask ML API with percentile:', userPercentile);
      const mlResponse = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentile: userPercentile,
          category: category,
          preferredCourse: courses[0],  // Primary course
          includeLadies,
          includeTFWS
        })
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        throw new Error(`ML API returned ${mlResponse.status}: ${errorText}`);
      }

      const mlData = await mlResponse.json();
      console.log('[ML Prediction] Flask response:', mlData);
      
      if (mlData.status === 'success' && mlData.predictions) {
        predictions = mlData.predictions;
        console.log(`[ML Prediction] Got ${predictions.length} predictions from ML model`);
      } else if (mlData.status === 'error') {
        throw new Error(mlData.message || 'Flask API returned error');
      }
    } catch (mlError) {
      console.error('[ML Prediction] ML API error:', mlError.message);
      return res.status(503).json({
        success: false,
        message: 'ML prediction service unavailable. Please ensure Flask API is running on port 5000',
        error: mlError.message,
        debug: {
          percentile: userPercentile,
          category: category,
          courses: courses
        }
      });
    }

    // If no predictions from ML model
    if (!predictions || predictions.length === 0) {
      console.log('[ML Prediction] No predictions returned from Flask API');
      return res.status(400).json({
        success: false,
        message: 'No suitable colleges found matching your criteria. Please check your percentile or category selection.',
        debug: {
          percentile: userPercentile,
          category: category,
          courses: courses
        }
      });
    }
    const normalizeText = normalizeLookupText;
    const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mapCategoryToKey = (inputCategory = '') => {
      const normalized = inputCategory.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.includes('general') || normalized.includes('open')) return 'general';
      if (normalized.includes('obc')) return 'obc';
      if (normalized === 'sc' || normalized.includes('scheduledcaste')) return 'sc';
      if (normalized === 'st' || normalized.includes('scheduledtribe')) return 'st';
      if (normalized.includes('ews')) return 'ews';
      if (normalized.includes('vj')) return 'vjnt';
      if (normalized.includes('nta') || normalized.includes('nt1')) return 'nt1';
      if (normalized.includes('ntb') || normalized.includes('nt2')) return 'nt2';
      if (normalized.includes('ntc') || normalized.includes('nt3')) return 'nt3';
      if (normalized.includes('sbc') || normalized.includes('sebc')) return 'sebc';
      if (normalized.includes('tfws')) return 'tfws';
      return 'general';
    };

    const categoryKey = mapCategoryToKey(category);
    
    // Try to load from MongoDB, fallback to empty if unavailable
    let allColleges = [];
    try {
      allColleges = await College.find({}, {
        name: 1,
        location: 1,
        city: 1,
        type: 1,
        establishedYear: 1,
        courses: 1,
        rounds: 1
      }).lean().maxTimeMS(5000);
    } catch (mongoError) {
      console.warn('[ML Prediction] MongoDB unavailable, using CSV data only:', mongoError.message);
      allColleges = [];
    }

    const allCollegesWithNormalizedName = allColleges.map((collegeDoc) => ({
      ...collegeDoc,
      _normalizedName: normalizeText(collegeDoc.name)
    }));

    const findBestCollegeMatch = (predictionCollegeName) => {
      const normalizedPredictionName = normalizeText(predictionCollegeName);
      if (!normalizedPredictionName) return null;

      let exact = allCollegesWithNormalizedName.find(
        (collegeDoc) => collegeDoc._normalizedName === normalizedPredictionName
      );
      if (exact) return exact;

      // Fuzzy fallback for names like "Veermata Jijabai Technological Institute"
      // matching CSV names like "Veermata Jijabai Technological Institute(VJTI), Matunga, Mumbai".
      const inclusionMatches = allCollegesWithNormalizedName.filter((collegeDoc) =>
        collegeDoc._normalizedName.includes(normalizedPredictionName) ||
        normalizedPredictionName.includes(collegeDoc._normalizedName)
      );

      if (inclusionMatches.length > 0) {
        return inclusionMatches.sort((a, b) => b._normalizedName.length - a._normalizedName.length)[0];
      }

      const meaningfulTokens = predictionCollegeName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 3)
        .filter((token) => !['college', 'engineering', 'institute', 'technology', 'technological', 'university', 'management'].includes(token));

      if (meaningfulTokens.length === 0) return null;

      const tokenScoredMatches = allCollegesWithNormalizedName
        .map((collegeDoc) => {
          const loweredCollegeName = collegeDoc.name.toLowerCase();
          const tokenHits = meaningfulTokens.filter((token) => loweredCollegeName.includes(token)).length;
          return { collegeDoc, tokenHits };
        })
        .filter((item) => item.tokenHits > 0)
        .sort((a, b) => b.tokenHits - a.tokenHits || b.collegeDoc._normalizedName.length - a.collegeDoc._normalizedName.length);

      return tokenScoredMatches[0]?.collegeDoc || null;
    };

    const getMeaningfulTokens = (input = '') => input
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => (token === 'sambhajinagar' ? 'aurangabad' : token))
      .filter((token) => token.length > 3)
      .filter((token) => !['college', 'engineering', 'institute', 'technology', 'technological', 'university', 'autonomous', 'government'].includes(token));

    const findBestCsvMatch = (predictionCollegeName, predictionBranchName) => {
      const normalizedCollege = canonicalizeCollegeLookup(predictionCollegeName);
      const normalizedBranch = normalizeText(predictionBranchName);
      const branchAliasSet = new Set(canonicalizeBranchName(predictionBranchName)); // Get all aliases
      if (!normalizedCollege || !normalizedBranch) return null;

      let exact = csvCutoffRows.find((row) =>
        canonicalizeCollegeLookup(row.collegeNameNormalized) === normalizedCollege &&
        (row.branchNameNormalized === normalizedBranch || branchAliasSet.has(row.branchNameNormalized))
      );
      if (exact) return exact;

      const predictionTokens = getMeaningfulTokens(predictionCollegeName);

      const candidates = csvCutoffRows.filter((row) => {
        const canonicalRowCollege = canonicalizeCollegeLookup(row.collegeNameNormalized);
        // Check if branch matches using aliases
        const hasBranchSignal = branchAliasSet.has(row.branchNameNormalized) || 
                               row.branchNameNormalized.includes(normalizedBranch) || 
                               normalizedBranch.includes(row.branchNameNormalized);
        const hasCollegeSignal = canonicalRowCollege.includes(normalizedCollege) || normalizedCollege.includes(canonicalRowCollege);
        if (hasBranchSignal && hasCollegeSignal) return true;
        if (!hasBranchSignal) return false;

        if (predictionTokens.length === 0) return false;
        const rowNameLower = row.collegeName.toLowerCase().replace(/sambhajinagar/g, 'aurangabad');
        const tokenHits = predictionTokens.filter((token) => rowNameLower.includes(token)).length;
        return tokenHits > 0;
      });

      const scored = candidates
        .map((row) => {
          const canonicalRowCollege = canonicalizeCollegeLookup(row.collegeNameNormalized);
          const rowNameLower = row.collegeName.toLowerCase().replace(/sambhajinagar/g, 'aurangabad');
          const tokenHits = predictionTokens.filter((token) => rowNameLower.includes(token)).length;
          let score = 0;
          if (row.branchNameNormalized === normalizedBranch) score += 10;
          if (row.branchNameNormalized.includes(normalizedBranch) || normalizedBranch.includes(row.branchNameNormalized)) score += 5;
          if (canonicalRowCollege === normalizedCollege) score += 12;
          if (canonicalRowCollege.includes(normalizedCollege) || normalizedCollege.includes(canonicalRowCollege)) score += 8;
          score += tokenHits * 3;
          return { row, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      return scored[0]?.score >= 10 ? scored[0].row : null;
    };

    const toRoundPayload = (roundDoc) => {
      const cutoffByCategory = {
        general: roundDoc?.cutoff?.general ?? null,
        obc: roundDoc?.cutoff?.obc ?? null,
        sc: roundDoc?.cutoff?.sc ?? null,
        st: roundDoc?.cutoff?.st ?? null,
        ews: roundDoc?.cutoff?.ews ?? null,
        vjnt: roundDoc?.cutoff?.vjnt ?? null,
        nt1: roundDoc?.cutoff?.nt1 ?? null,
        nt2: roundDoc?.cutoff?.nt2 ?? null,
        nt3: roundDoc?.cutoff?.nt3 ?? null,
        sebc: roundDoc?.cutoff?.sebc ?? null,
        tfws: roundDoc?.cutoff?.tfws ?? null
      };

      return {
        round: roundDoc?.number,
        cutoff: cutoffByCategory[categoryKey] ?? cutoffByCategory.general ?? cutoffByCategory.tfws ?? null,
        cutoffByCategory,
        seatType: cutoffByCategory.tfws ? 'TFWS' : 'General'
      };
    };

    // Format predictions from ML model - Map Flask API fields to frontend expectations
    const allPredictions = predictions.map((pred, idx) => {
      const predictionName = pred.college_name || pred.college || pred.name || 'Unknown College';
      const predictionBranch = pred.branch || pred.course || courses[0] || 'Engineering';
      const matchedCollege = findBestCollegeMatch(predictionName);
      const matchedCsvRow = findBestCsvMatch(predictionName, predictionBranch);

      let matchedCourse = null;
      if (matchedCollege?.courses?.length) {
        const normalizedBranch = normalizeText(predictionBranch);
        const branchAliasSet = new Set(canonicalizeBranchName(predictionBranch)); // Get all aliases
        
        // First, try exact match with branch aliases
        matchedCourse = matchedCollege.courses.find((courseDoc) => 
          branchAliasSet.has(normalizeText(courseDoc.name)) || 
          normalizeText(courseDoc.name) === normalizedBranch
        );

        if (!matchedCourse) {
          // Then try fuzzy matching with includes
          matchedCourse = matchedCollege.courses.find((courseDoc) => {
            const normalizedCourse = normalizeText(courseDoc.name);
            return normalizedCourse.includes(normalizedBranch) || normalizedBranch.includes(normalizedCourse) || branchAliasSet.has(normalizedCourse);
          });
        }
      }

      const sourceRounds = (matchedCourse?.rounds?.length ? matchedCourse.rounds : matchedCollege?.rounds || [])
        .filter((r) => r && typeof r.number !== 'undefined')
        .sort((a, b) => a.number - b.number);

      const csvRounds = (matchedCsvRow?.rounds || []).map((round) => ({
        round: round.round,
        cutoffByCategory: round.cutoffByCategory,
        cutoff: round.cutoffByCategory?.[categoryKey] ?? round.cutoffByCategory?.general ?? null,
        seatType: round.seatType || 'General'
      }));

      const allRounds = csvRounds.length > 0 ? csvRounds : sourceRounds.map(toRoundPayload);
      const validRoundCutoffs = allRounds
        .map((round) => ({ ...round, cutoffValue: parseFloat(round.cutoff) }))
        .filter((round) => !Number.isNaN(round.cutoffValue));

      const bestRound = validRoundCutoffs
        .filter((round) => userPercentile >= round.cutoffValue)
        .map((round) => round.round)
        .sort((a, b) => b - a)[0] || null;

      const closingRoundCutoff = validRoundCutoffs.length > 0
        ? validRoundCutoffs[validRoundCutoffs.length - 1].cutoffValue
        : null;

      return {
      // Keep all original fields first
      ...pred,
      // Flask API returns: college_name, location, college_type, seat_type, seat_level, is_tfws, is_ladies, etc.
      // Frontend expects: name, admissionChance, cutoffForCategory, etc.
      // These mapped fields override the original ones
      name: predictionName,
      collegeName: predictionName,
      admissionChance: pred.admission_probability || pred.admissionChance || pred.match_percentage || 50,
      admissionProbability: pred.admission_probability || pred.admissionChance || pred.match_percentage || 50,
      cutoffForCategory: closingRoundCutoff ?? pred.percentile_required ?? pred.cut_off ?? pred.cutoffForCategory ?? 'N/A',
      lastYearCutoff: closingRoundCutoff ?? pred.percentile_required ?? pred.cut_off ?? pred.cutoffForCategory ?? null,
      location: pred.location || matchedCollege?.location || matchedCsvRow?.location || 'Not specified',
      city: pred.location || matchedCollege?.city || matchedCsvRow?.location || 'Not specified',
      type: pred.college_type || matchedCollege?.type || matchedCsvRow?.collegeType || 'N/A',
      establishedYear: pred.establishedYear || matchedCollege?.establishedYear || 'N/A',
      code: pred.code || matchedCsvRow?.collegeCode || '',
      branch: predictionBranch,
      course: predictionBranch,
      seat_type: pred.seat_type || 'General',
      seat_level: pred.seat_level || 'State',
      is_tfws: pred.is_tfws || false,
      is_ladies: pred.is_ladies || false,
      allRounds,
      bestMatchingRound: bestRound,
      confidence: pred.confidence || pred.match_percentage / 100 || 0.75,
      category: category,
      percentile: userPercentile,
      rank: idx + 1,
      modelSource: 'EnhancedML',
      accuracy: '90.7%'
    };
    });

    // Metadata from ML predictions
    const metadata = {
      totalColleges: allPredictions.length,
      modelType: 'Stacking Ensemble (90.7% Accuracy)',
      algorithmVersion: 'Enhanced ML v1.0',
      mlModelAccuracy: '90.7%',
      processedRecords: 22306
    };

    // Save to database if user is logged in
    let predictionId = null;
    if (req.user) {
      try {
        const predictionDoc = new Prediction({
          user: req.user._id,
          inputData: {
            percentile: userPercentile,
            category,
            courses,
            universityType,
            includeLadies,
            includeTFWS,
            examType: 'MHT-CET',
            examYear: 2025
          },
          predictions: allPredictions,
          metadata
        });
        await predictionDoc.save();
        predictionId = predictionDoc._id;
        console.log('[ML Prediction] Saved to database:', predictionId);
      } catch (dbError) {
        console.error('[ML Prediction] Database error:', dbError.message);
      }
    }

    // Return ML predictions
    res.json({
      success: true,
      predictions: allPredictions,
      metadata,
      predictionId,
      modelInfo: {
        type: 'Enhanced ML Stacking Ensemble',
        accuracy: '90.7%',
        framework: 'Scikit-learn'
      }
    });
  } catch (error) {
    console.error('[ML Prediction] ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions',
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

    const mapCategoryToKey = (inputCategory = '') => {
      const normalized = inputCategory.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.includes('general') || normalized.includes('open')) return 'general';
      if (normalized.includes('obc')) return 'obc';
      if (normalized === 'sc' || normalized.includes('scheduledcaste')) return 'sc';
      if (normalized === 'st' || normalized.includes('scheduledtribe')) return 'st';
      if (normalized.includes('ews')) return 'ews';
      if (normalized.includes('vj')) return 'vjnt';
      if (normalized.includes('nta') || normalized.includes('nt1')) return 'nt1';
      if (normalized.includes('ntb') || normalized.includes('nt2')) return 'nt2';
      if (normalized.includes('ntc') || normalized.includes('nt3')) return 'nt3';
      if (normalized.includes('sbc') || normalized.includes('sebc')) return 'sebc';
      if (normalized.includes('tfws')) return 'tfws';
      return 'general';
    };

    const getMeaningfulTokens = (input = '') => input
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => (token === 'sambhajinagar' ? 'aurangabad' : token))
      .filter((token) => token.length > 3)
      .filter((token) => !['college', 'engineering', 'institute', 'technology', 'technological', 'university', 'autonomous', 'government'].includes(token));

    const findBestCsvMatch = (predictionCollegeName, predictionBranchName) => {
      const normalizedCollege = canonicalizeCollegeLookup(predictionCollegeName);
      const normalizedBranch = normalizeLookupText(predictionBranchName);
      const branchAliasSet = new Set(canonicalizeBranchName(predictionBranchName)); // Get all aliases
      if (!normalizedCollege || !normalizedBranch) return null;

      const exact = csvCutoffRows.find((row) =>
        canonicalizeCollegeLookup(row.collegeNameNormalized) === normalizedCollege &&
        (row.branchNameNormalized === normalizedBranch || branchAliasSet.has(row.branchNameNormalized))
      );
      if (exact) return exact;

      const predictionTokens = getMeaningfulTokens(predictionCollegeName);

      const candidates = csvCutoffRows.filter((row) => {
        const canonicalRowCollege = canonicalizeCollegeLookup(row.collegeNameNormalized);
        // Check if branch matches using aliases
        const hasBranchSignal = branchAliasSet.has(row.branchNameNormalized) || 
                               row.branchNameNormalized.includes(normalizedBranch) || 
                               normalizedBranch.includes(row.branchNameNormalized);
        const hasCollegeSignal = canonicalRowCollege.includes(normalizedCollege) || normalizedCollege.includes(canonicalRowCollege);
        if (hasBranchSignal && hasCollegeSignal) return true;
        if (!hasBranchSignal || predictionTokens.length === 0) return false;

        const rowNameLower = row.collegeName.toLowerCase().replace(/sambhajinagar/g, 'aurangabad');
        const tokenHits = predictionTokens.filter((token) => rowNameLower.includes(token)).length;
        return tokenHits > 0;
      });

      const scored = candidates
        .map((row) => {
          const canonicalRowCollege = canonicalizeCollegeLookup(row.collegeNameNormalized);
          const rowNameLower = row.collegeName.toLowerCase().replace(/sambhajinagar/g, 'aurangabad');
          const tokenHits = predictionTokens.filter((token) => rowNameLower.includes(token)).length;
          let score = 0;
          if (row.branchNameNormalized === normalizedBranch || branchAliasSet.has(row.branchNameNormalized)) score += 10;
          if (row.branchNameNormalized.includes(normalizedBranch) || normalizedBranch.includes(row.branchNameNormalized)) score += 5;
          if (canonicalRowCollege === normalizedCollege) score += 12;
          if (canonicalRowCollege.includes(normalizedCollege) || normalizedCollege.includes(canonicalRowCollege)) score += 8;
          score += tokenHits * 3;
          return { row, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      return scored[0]?.score >= 10 ? scored[0].row : null;
    };

    const refreshedPredictions = predictions.map((predictionDoc) => {
      const predictionObj = predictionDoc.toObject();
      const categoryKey = mapCategoryToKey(predictionObj.inputData?.category || 'General');

      predictionObj.predictions = (predictionObj.predictions || []).map((pred) => {
        const predictionName = pred.collegeName || pred.name || pred.college || '';
        const predictionBranch = pred.branch || pred.course || predictionObj.inputData?.courses?.[0] || '';
        const matchedCsvRow = findBestCsvMatch(predictionName, predictionBranch);

        if (!matchedCsvRow || !Array.isArray(matchedCsvRow.rounds) || matchedCsvRow.rounds.length === 0) {
          return pred;
        }

        const csvRounds = matchedCsvRow.rounds.map((round) => ({
          round: round.round,
          cutoffByCategory: round.cutoffByCategory,
          cutoff: round.cutoffByCategory?.[categoryKey] ?? round.cutoffByCategory?.general ?? null,
          seatType: round.seatType || 'State'
        }));

        const validRoundCutoffs = csvRounds
          .map((round) => ({ ...round, cutoffValue: parseFloat(round.cutoff) }))
          .filter((round) => !Number.isNaN(round.cutoffValue));

        const closingRoundCutoff = validRoundCutoffs.length > 0
          ? validRoundCutoffs[validRoundCutoffs.length - 1].cutoffValue
          : null;

        return {
          ...pred,
          allRounds: csvRounds,
          cutoffForCategory: closingRoundCutoff ?? pred.cutoffForCategory ?? 'N/A',
          lastYearCutoff: closingRoundCutoff ?? pred.lastYearCutoff ?? null,
          code: pred.code || matchedCsvRow.collegeCode || '',
          location: pred.location || matchedCsvRow.location || pred.city || 'Not specified',
          city: pred.city || matchedCsvRow.location || 'Not specified',
          type: pred.type || matchedCsvRow.collegeType || 'N/A'
        };
      });

      return predictionObj;
    });

    const total = await Prediction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      predictions: refreshedPredictions,
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

    // Context-Aware Personalization
    const userPercentile = context?.userPercentile ? parseFloat(context.userPercentile) : null;
    const userCategory = context?.userCategory || 'General';
    const userName = req.user?.name ? req.user.name.split(' ')[0] : 'Aspiring Engineer';

    // Helper to get admission chance
    const getChance = (cutoff) => {
      if (!userPercentile) return "I'd need your percentile to predict that. Please enter it in the AI Predictor tab!";
      const diff = userPercentile - cutoff;
      if (diff >= 0) return "Excellent! You have a very high chance (Probable). 🌟";
      if (diff >= -1.5) return "You have a decent chance, it might be borderline. 🤞";
      return "It looks difficult with your current percentile, but don't lose hope! Try spot rounds. 💪";
    };

    // Enhanced AI responses
    if (lowerMessage.includes('chance') || lowerMessage.includes('can i get') || lowerMessage.includes('prediction')) {
      if (lowerMessage.includes('coep')) {
        response = `📊 **Admission Prediction for COEP**\n\nYour Percentile: **${userPercentile || 'Not provided'}**\nCOEP Computer Cutoff: ~99.5%\nCOEP Mech Cutoff: ~98.0%\n\n🔮 **Prediction**: ${getChance(99.0)}\n\n💡 Note: Cutoffs vary by category (${userCategory}). This is an estimate based on last year.`;
        intent = 'prediction_specific';
      } else if (lowerMessage.includes('vjti')) {
        response = `📊 **Admission Prediction for VJTI Mumbai**\n\nYour Percentile: **${userPercentile || 'Not provided'}**\nVJTI Computer Cutoff: ~99.3%\nVJTI IT Cutoff: ~99.0%\n\n🔮 **Prediction**: ${getChance(98.5)}\n\n💡 Competition is high at VJTI!`;
        intent = 'prediction_specific';
      } else if (userPercentile) {
        response = `🔮 **Personalized College Recommendations**\n\nBased on your percentile of **${userPercentile}%** (${userCategory}):\n\n`;
        if (userPercentile > 98) response += `🌟 **Ambitious/Top Tier**:\n• COEP Pune\n• VJTI Mumbai\n• SPIT Mumbai\n• PICT Pune`;
        else if (userPercentile > 90) response += `🎯 **Excellent Options**:\n• DJ Sanghvi (Mumbai)\n• VIT Pune\n• Walchand Sangli\n• PCCOE Pune`;
        else if (userPercentile > 80) response += `✅ **Good Choices**:\n• DY Patil Akurdi\n• Thadomal Shahani\n• VESIT Chembur\n• MIT Alandi`;
        else response += `🚀 **Recommended Strategy**:\nFocus on Tier-2/3 colleges in your region or try for institutional rounds. Detailed list available in the "AI Predictor" results tab!`;

        response += `\n\nWould you like details on any specific college from this list?`;
        intent = 'recommendation_personalized';
      } else {
        response = `🤔 I need your percentile to predict your chances. Please go to the **AI Predictor** tab, enter your details, and then ask me again!`;
        intent = 'missing_context';
      }
    } else if (lowerMessage.includes('coep') || lowerMessage.includes('college of engineering pune')) {
      response = `🏛️ **College of Engineering Pune (COEP)**\n\n📍 **Location**: Pune (Shivajinagar)\n🏆 **Ranking**: #1 in Maharashtra (Govt)\n💰 **Fees**: ₹90,600/year\n📊 **Cutoffs (Open)**: CS (99.8%), Mech (98.2%), EnTC (99.0%)\n💼 **Placements**: Avg ₹12 LPA, Highest ₹50.5 LPA\n\nDid you know? COEP is one of Asia's oldest engineering colleges (Est. 1854)!`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('vjti') || lowerMessage.includes('veermata')) {
      response = `🏛️ **VJTI Mumbai**\n\n📍 **Location**: Matunga, Mumbai\n🏆 **Ranking**: Premier Govt Institute\n💰 **Fees**: ₹85,000/year\n📊 **Cutoffs (Open)**: CS (99.7%), IT (99.5%), Electronics (98.8%)\n💼 **Placements**: Avg ₹11.5 LPA, Highest ₹62 LPA (Texas Instruments)\n\nVJTI is famous for its strong alumni network and tech fests!`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('spit') || lowerMessage.includes('sardar patel')) {
      response = `🏛️ **Sardar Patel Institute of Technology (SPIT)**\n\n📍 **Location**: Andheri, Mumbai\n🏆 **Status**: Autonomous Institute\n💰 **Fees**: ~₹1.7 Lakhs/year\n📊 **Cutoffs**: CS (99.2%), CSE-AI (98.8%)\n💼 **Placements**: Avg ₹15 LPA (Excellent ROI!)\n\nSPIT is known for its rigorous coding culture.`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('pict') || lowerMessage.includes('pune institute')) {
      response = `🏛️ **PICT Pune**\n\n📍 **Location**: Dhankawadi, Pune\n🏆 **Specialty**: Known as "Coding Factory"\n💰 **Fees**: ~₹1 Lakh/year\n📊 **Cutoffs**: CS (99.1%), IT (98.8%), EnTC (97.5%)\n💼 **Placements**: Avg ₹12 LPA, Highest often crosses ₹40 LPA\n\nBest choice if you are strictly focused on CS/IT domain!`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('vit') || lowerMessage.includes('vishwakarma')) {
      response = `🏛️ **VIT Pune (Vishwakarma Institute)**\n\n📍 **Location**: Bibwewadi, Pune\n🏆 **Status**: Top Private Autonomous\n💰 **Fees**: ~₹1.9 Lakhs/year\n📊 **Cutoffs**: CS (98.5%), AI&DS (97.8%)\n💼 **Placements**: Avg ₹9 LPA, Highest ₹33 LPA\n\nOffers a great campus life balance with academics.`;
      intent = 'college_specific';
    } else if (lowerMessage.includes('document') || lowerMessage.includes('certificate') || lowerMessage.includes('paper')) {
      response = `📄 **Required Documents for CAP Rounds (Admission)**\n\n1. **SSC (10th) & HSC (12th) Marksheets**\n2. **MHT-CET 2025 Scorecard**\n3. **Domicile Certificate** (Must for Maharashtra seats)\n4. **Nationality Certificate**\n5. **Leaving Certificate (LC)**\n\n📝 **Category Specific**:\n• Caste Certificate & Validity (SC/ST/OBC)\n• Non-Creamy Layer (OBC/SBC/VJNT) - Valid till March 2026\n• EWS Certificate (if applicable)\n• Income Certificate (for TFWS/EBC scholarships)\n\n💡 Tip: Keep 5 sets of attested photocopies ready!`;
      intent = 'documents';
    } else if (lowerMessage.includes('fees') || lowerMessage.includes('cost')) {
      response = `💰 **Fee Structure Overview (Approx)**\n\n🏛️ **Government Colleges** (COEP, VJTI): ₹80k - ₹90k / year\n🏫 **Aided Colleges** (Sangli, Walchand): ₹85k - ₹1L / year\n🏢 **Private Top Tier** (PICT, SPIT, DJ): ₹1.5L - ₹2.2L / year\n🏘️ **Private Mid Tier**: ₹1L - ₹1.5L / year\n\n💸 **Scholarships (EBC/Category)**:\n• Open/EBC: 50% Tuition Fee Waiver\n• OBC: 50% Tuition Fee Waiver\n• SC/ST: 100% Tuition Fee Waiver\n• TFWS: 100% Tuition Fee Waiver (Merit-based)\n\nDo you want fee details for a specific college?`;
      intent = 'fees_inquiry';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.trim() === 'hi') {
      response = `👋 **Hello ${userName}!**\n\nI'm your intelligent MHT-CET Assistant. I can help you with:\n\n1. **Personalized Chances**: "Can I get into COEP with ${userPercentile || 'my score'}?"\n2. **College Info**: Fees, Placements of VJTI, PICT, SPIT, etc.\n3. **Comparisons**: "COEP vs VJTI"\n4. **Process**: Documents, CAP Rounds info\n\nHow can I help you achieve your engineering dream today? 🚀`;
      intent = 'greeting';
    } else {
      // ---------------------------------------------------------
      // GEMINI AI INTEGRATION (Fallback for Open-Ended Queries)
      // ---------------------------------------------------------
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('Gemini API Key not configured');
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construct a Context-Aware Prompt
        const systemPrompt = `
          You are an expert MHT-CET Admission Counselor and Career Guide for engineering aspirants in Maharashtra.
          
          User Context:
          - Name: ${userName}
          - Category: ${userCategory}
          - Percentile: ${userPercentile || 'Unknown'}
          - Interested Courses: ${context?.userCourses?.join(', ') || 'Not specified'}
          
          Your Task:
          Answer the student's question: "${message}" matches their profile.
          
          Guidelines:
          1. Be encouraging, professional, and precise.
          2. Focus on engineering colleges in Maharashtra (COEP, VJTI, SPIT, PICT, VIT, etc.).
          3. If asked about chances, use their percentile (if available) to give a realistic assessment.
          4. If asked about "Best Colleges", suggest a mix of Govt and Top Private based on their score.
          5. Keep the response concise (under 100 words) but informative.
          6. Use emojis to make it friendly.
        `;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();

        response = text;
        intent = 'ai_generated';

      } catch (aiError) {
        console.error('AI Generation Failed:', aiError.message);
        // Fallback to generic response if AI fails or Key missing
        response = `🤖 **Smart Assistant**\n\nI see you have a unique question! To give you the best answer, I need to be connected to my advanced AI brain (Gemini).\n\n**Dev Note**: Please add \`GEMINI_API_KEY\` to your backend \`.env\` file to unlock fully open-ended responses!\n\nIn the meantime, try asking about:\n• Cutoffs for COEP/VJTI\n• Documents required\n• Fee structures\n• "Can I get CS with 95 percentile?"`;
        intent = 'ai_fallback';
      }
    }

    // Save chat message if user is authenticated, sessionId is provided and storeHistory is not explicitly false
    const storeHistory = false; // Chat history storage disabled as per user request
    
    console.log(`[Chat] storeHistory flag: ${storeHistory}, sessionId: ${sessionId}`);
    
    if (req.user && sessionId && storeHistory) {
      console.log('[Chat] Saving chat to database...');
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
    } else {
      console.log('[Chat] Skipping database save - Privacy Mode Active (storeHistory: false)');
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
            <h1 s>🎓 MHT-CET 2025 College Prediction Report</h1>
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
    console.log('[PDF] Starting Puppeteer launch...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    console.log('[PDF] Browser launched successfully');

    const page = await browser.newPage();
    console.log('[PDF] Page created, setting content...');
    // Use domcontentloaded for faster rendering and less timeout risk
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('[PDF] Content set, generating PDF buffer...');

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
    console.log(`[PDF] PDF generated via Puppeteer. Size: ${pdfBuffer.length} bytes`);

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