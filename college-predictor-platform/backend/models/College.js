import mongoose from 'mongoose';

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
    enum: ['Government', 'Private', 'Autonomous', 'Deemed'],
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
    }
  }],
  cutoff: {
    general: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    obc: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    sc: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    st: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    ews: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
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