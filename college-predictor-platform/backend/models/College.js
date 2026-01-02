import mongoose from 'mongoose';

const cutoffSchema = {
  general: { type: Number, required: false, min: 0, max: 100, default: null },
  obc: { type: Number, required: false, min: 0, max: 100, default: null },
  sc: { type: Number, required: false, min: 0, max: 100, default: null },
  st: { type: Number, required: false, min: 0, max: 100, default: null },
  ews: { type: Number, required: false, min: 0, max: 100, default: null },
  vjnt: { type: Number, required: false, min: 0, max: 100, default: null },
  nt1: { type: Number, required: false, min: 0, max: 100, default: null },
  nt2: { type: Number, required: false, min: 0, max: 100, default: null },
  nt3: { type: Number, required: false, min: 0, max: 100, default: null },
  sebc: { type: Number, required: false, min: 0, max: 100, default: null },
  tfws: { type: Number, required: false, min: 0, max: 100, default: null },
  ladies: {
    general: { type: Number, required: false, min: 0, max: 100, default: null },
    obc: { type: Number, required: false, min: 0, max: 100, default: null },
    sc: { type: Number, required: false, min: 0, max: 100, default: null },
    st: { type: Number, required: false, min: 0, max: 100, default: null },
    vjnt: { type: Number, required: false, min: 0, max: 100, default: null },
    nt1: { type: Number, required: false, min: 0, max: 100, default: null },
    nt2: { type: Number, required: false, min: 0, max: 100, default: null },
    nt3: { type: Number, required: false, min: 0, max: 100, default: null },
    sebc: { type: Number, required: false, min: 0, max: 100, default: null }
  }
};

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
    unique: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    default: 'Maharashtra',
    trim: true
  },
  type: {
    type: String,
    enum: ['Government', 'Private', 'Autonomous', 'Deemed', 'University'],
    required: true
  },
  establishedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  courses: [{
    name: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      default: '4 years'
    },
    seats: {
      type: Number,
      min: 0
    },
    rounds: [{
      number: Number,
      cutoff: cutoffSchema
    }],
    cutoff: cutoffSchema // Keep for backward compatibility/quick access
  }],
  rounds: [{
    number: Number,
    cutoff: cutoffSchema
  }],
  cutoff: cutoffSchema,

  fees: {
    annual: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    formatted: {
      type: String,
      required: true
    }
  },
  placements: {
    averagePackage: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      formatted: {
        type: String,
        required: true
      }
    },
    highestPackage: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      formatted: {
        type: String,
        required: true
      }
    },
    placementRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    topRecruiters: [{
      type: String,
      trim: true
    }],
    placementYear: {
      type: Number,
      default: new Date().getFullYear()
    }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  accreditation: [{
    body: String,
    grade: String,
    year: Number
  }],
  ranking: {
    nirf: Number,
    overall: Number,
    engineering: Number
  },
  contact: {
    website: String,
    email: String,
    phone: String,
    address: String
  },
  images: [{
    url: String,
    caption: String,
    type: {
      type: String,
      enum: ['campus', 'building', 'lab', 'hostel', 'other'],
      default: 'campus'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
collegeSchema.index({ name: 'text', location: 'text', city: 'text' });
collegeSchema.index({ type: 1 });
collegeSchema.index({ 'cutoff.general': -1 });
collegeSchema.index({ featured: -1, createdAt: -1 });

export default mongoose.model('College', collegeSchema);