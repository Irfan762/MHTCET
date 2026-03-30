import express from 'express';
import CollegePredictionModel from './predictiveModel.js';

// Initialize model
const predictionModel = new CollegePredictionModel();
let modelInitialized = false;

// Initialize model on startup
export async function initializePredictionModel() {
  try {
    const success = await predictionModel.loadData();
    if (success) {
      modelInitialized = true;
      console.log('✅ Prediction model initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize prediction model:', error);
  }
}

// Create router
export const predictionRouter = express.Router();

/**
 * POST /api/predict
 * Main prediction endpoint
 * Body: { percentile, category, preferredCourse, preferredDistrict }
 */
predictionRouter.post('/predict', (req, res) => {
  try {
    if (!modelInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Prediction model not initialized'
      });
    }

    const { percentile, category, preferredCourse, preferredDistrict } = req.body;

    // Validate input
    if (percentile === undefined || percentile === null) {
      return res.status(400).json({
        success: false,
        error: 'Percentile is required'
      });
    }

    const studentProfile = {
      percentile: parseFloat(percentile),
      category: category || 'GENERAL',
      preferredCourse: preferredCourse || null,
      preferredDistrict: preferredDistrict || null
    };

    const predictions = predictionModel.predict(studentProfile);

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/predict/analyze
 * Get strategic analysis for predictions
 */
predictionRouter.post('/predict/analyze', (req, res) => {
  try {
    if (!modelInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Prediction model not initialized'
      });
    }

    const { percentile, category } = req.body;

    if (!percentile) {
      return res.status(400).json({
        success: false,
        error: 'Percentile is required'
      });
    }

    const studentProfile = {
      percentile: parseFloat(percentile),
      category: category || 'GENERAL'
    };

    const predictions = predictionModel.predict(studentProfile);
    const analysis = predictionModel.analyzeOptions(predictions.predictions);

    res.json({
      success: true,
      predictions: predictions,
      analysis: analysis
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/predict/model-stats
 * Get model statistics
 */
predictionRouter.get('/model-stats', (req, res) => {
  try {
    if (!modelInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Prediction model not initialized'
      });
    }

    const stats = {
      totalColleges: Object.keys(predictionModel.model.collegeStats).length,
      totalCutoffRecords: predictionModel.cutoffs.length,
      totalScholarships: predictionModel.scholarships.length,
      categories: Object.keys(predictionModel.categoryMap),
      modelStatus: 'ready'
    };

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/predict/colleges
 * Get all colleges with basic info
 */
predictionRouter.get('/colleges', (req, res) => {
  try {
    if (!modelInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Prediction model not initialized'
      });
    }

    const collegeList = Object.values(predictionModel.model.collegeStats).map(college => ({
      name: college.name,
      location: college.location,
      type: college.type,
      branches: college.branches.length,
      minCutoff: college.minCutoff,
      maxCutoff: college.maxCutoff
    }));

    res.json({
      success: true,
      total: collegeList.length,
      colleges: collegeList.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/predict/categories
 * Get available categories
 */
predictionRouter.get('/categories', (req, res) => {
  const categories = Object.keys(predictionModel.categoryMap);
  res.json({
    success: true,
    categories: categories
  });
});

export default predictionRouter;
