import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputData: {
    percentile: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    category: {
      type: String,
      required: true,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS']
    },
    course: {
      type: [String], // Changed to array to support multiple courses
      required: true
    },
    examType: {
      type: String,
      default: 'MHT-CET'
    },
    examYear: {
      type: Number,
      default: new Date().getFullYear()
    }
  },
  predictions: [{
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    probability: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true
    },
    cutoffForCategory: {
      type: Number,
      required: true
    },
    difference: {
      type: Number,
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    course: String,
    fees: String,
    placements: {
      averagePackage: String,
      highestPackage: String,
      placementRate: String
    }
  }],
  metadata: {
    totalColleges: {
      type: Number,
      required: true
    },
    totalCourses: {
      type: Number,
      default: 1
    },
    highProbability: {
      type: Number,
      default: 0
    },
    mediumProbability: {
      type: Number,
      default: 0
    },
    lowProbability: {
      type: Number,
      default: 0
    },
    courseBreakdown: [{
      course: String,
      totalColleges: Number,
      highProbability: Number,
      mediumProbability: Number,
      lowProbability: Number
    }],
    algorithmVersion: {
      type: String,
      default: '1.0'
    }
  },
  status: {
    type: String,
    enum: ['generated', 'viewed', 'downloaded', 'shared'],
    default: 'generated'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for user predictions
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ 'inputData.percentile': 1 });
predictionSchema.index({ 'inputData.category': 1 });

export default mongoose.model('Prediction', predictionSchema);