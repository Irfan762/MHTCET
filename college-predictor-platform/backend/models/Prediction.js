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
      required: true
    },
    course: {
      type: [String],
      required: true
    },
    universityType: {
      type: String,
      default: 'Home University'
    },
    includeLadies: {
      type: Boolean,
      default: false
    },
    includeTFWS: {
      type: Boolean,
      default: false
    },
    city: {
      type: String,
      default: 'All Cities'
    },
    examType: {
      type: String,
      default: 'MHT-CET'
    },
    examYear: {
      type: Number,
      default: 2025
    }
  },
  predictions: [{
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    course: String,
    probability: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Probable', 'Borderline', 'Safe', 'Difficult', 'Very High Chance'],
      required: true
    },
    admissionChance: Number,
    riskLabel: String,
    cutoffForCategory: {
      type: Number,
      required: true
    },
    adjustedCutoff: Number,
    difference: {
      type: Number,
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    fees: String,
    placements: {
      averagePackage: String,
      highestPackage: String,
      placementRate: String
    },
    aiConfidence: String,
    aiInsight: String,
    trendScore: String,
    allRounds: Array,
    bestMatchingRound: Number
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
    highChance: Number,
    mediumChance: Number,
    lowChance: Number,
    averageChance: Number,
    universityApplied: String,
    algorithmVersion: {
      type: String,
      default: '4.0'
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