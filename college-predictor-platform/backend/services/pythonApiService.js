/**
 * Python ML API Integration for Node.js Backend
 * Connects Express backend with Python Flask predictions API
 */

import axios from 'axios';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000/api/predict';
const PYTHON_API_BASE = process.env.PYTHON_API_BASE || 'http://localhost:5000';

/**
 * Prediction service - communicates with Python ML API
 */
class PredictionService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: PYTHON_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get college predictions
   * @param {Object} studentProfile - {percentile, category, preferredCourse, preferredDistrict}
   * @returns {Promise<Object>} - Predictions result
   */
  async predict(studentProfile) {
    try {
      const response = await this.apiClient.post('/api/predict', {
        percentile: parseFloat(studentProfile.percentile),
        category: studentProfile.category || 'GENERAL',
        preferredCourse: studentProfile.preferredCourse || null,
        preferredDistrict: studentProfile.preferredDistrict || null
      });

      return {
        success: true,
        data: response.data.data,
        meta: {
          timestamp: new Date(),
          apiVersion: '1.0'
        }
      };
    } catch (error) {
      console.error('Prediction error:', error.message);
      throw {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Batch predictions
   * @param {Array} students - Array of student profiles
   * @returns {Promise<Object>} - Batch results
   */
  async batchPredict(students) {
    try {
      const response = await this.apiClient.post('/api/predict/batch', {
        students: students.map(s => ({
          percentile: parseFloat(s.percentile),
          category: s.category || 'GENERAL',
          preferredCourse: s.preferredCourse || null,
          preferredDistrict: s.preferredDistrict || null
        }))
      });

      return {
        success: true,
        data: response.data,
        meta: {
          timestamp: new Date(),
          total: response.data.total,
          successful: response.data.successful
        }
      };
    } catch (error) {
      console.error('Batch prediction error:', error.message);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get strategic analysis
   * @param {Object} profile - {percentile, category}
   * @returns {Promise<Object>} - Analysis result
   */
  async analyze(profile) {
    try {
      const response = await this.apiClient.post('/api/predict/analyze', {
        percentile: parseFloat(profile.percentile),
        category: profile.category || 'GENERAL'
      });

      return {
        success: true,
        data: response.data,
        meta: {
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get model statistics
   * @returns {Promise<Object>} - Model stats
   */
  async getModelStats() {
    try {
      const response = await this.apiClient.get('/api/predict/model-stats');
      return {
        success: true,
        data: response.data.stats
      };
    } catch (error) {
      console.error('Stats error:', error.message);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available categories
   * @returns {Promise<Array>} - List of categories
   */
  async getCategories() {
    try {
      const response = await this.apiClient.get('/api/predict/categories');
      return {
        success: true,
        data: response.data.categories
      };
    } catch (error) {
      console.error('Categories error:', error.message);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all colleges
   * @returns {Promise<Array>} - List of colleges
   */
  async getColleges() {
    try {
      const response = await this.apiClient.get('/api/predict/colleges');
      return {
        success: true,
        data: response.data.colleges,
        total: response.data.total
      };
    } catch (error) {
      console.error('Colleges error:', error.message);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check
   * @returns {Promise<Boolean>} - API health
   */
  async healthCheck() {
    try {
      const response = await this.apiClient.get('/health');
      return response.data.model_initialized === true;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const predictionService = new PredictionService();

/**
 * Express middleware to use prediction service
 */
export function createPredictionRoutes(app) {
  /**
   * POST /api/predictions
   * Get college predictions for a student
   */
  app.post('/api/predictions', async (req, res) => {
    try {
      const { percentile, category, course, district } = req.body;

      if (!percentile) {
        return res.status(400).json({
          success: false,
          error: 'Percentile is required'
        });
      }

      const result = await predictionService.predict({
        percentile,
        category,
        preferredCourse: course,
        preferredDistrict: district
      });

      // Save to database (optional)
      if (req.user) {
        await savePredictionHistory(req.user.id, result.data);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * POST /api/predictions/batch
   * Batch predictions
   */
  app.post('/api/predictions/batch', async (req, res) => {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Students array is required'
        });
      }

      const result = await predictionService.batchPredict(students);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * POST /api/predictions/analyze
   * Get strategic analysis
   */
  app.post('/api/predictions/analyze', async (req, res) => {
    try {
      const { percentile, category } = req.body;

      if (!percentile) {
        return res.status(400).json({
          success: false,
          error: 'Percentile is required'
        });
      }

      const result = await predictionService.analyze({
        percentile,
        category
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * GET /api/predictions/model-stats
   * Get model statistics
   */
  app.get('/api/predictions/model-stats', async (req, res) => {
    try {
      const result = await predictionService.getModelStats();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * GET /api/predictions/categories
   * Get available categories
   */
  app.get('/api/predictions/categories', async (req, res) => {
    try {
      const result = await predictionService.getCategories();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * GET /api/predictions/colleges
   * Get all colleges
   */
  app.get('/api/predictions/colleges', async (req, res) => {
    try {
      const result = await predictionService.getColleges();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.error || error.message
      });
    }
  });

  /**
   * GET /api/predictions/health
   * Check AI API health
   */
  app.get('/api/predictions/health', async (req, res) => {
    try {
      const isHealthy = await predictionService.healthCheck();
      res.json({
        success: true,
        mlApiHealthy: isHealthy,
        status: isHealthy ? 'ready' : 'initializing'
      });
    } catch (error) {
      res.json({
        success: false,
        mlApiHealthy: false,
        error: error.message
      });
    }
  });
}

/**
 * Save prediction to database (optional)
 */
async function savePredictionHistory(userId, predictionData) {
  // Implement database save as needed
  // Example:
  // await Prediction.create({
  //   userId,
  //   percentile: predictionData.studentProfile.percentile,
  //   category: predictionData.studentProfile.category,
  //   results: predictionData.predictions,
  //   createdAt: new Date()
  // });
}

export default {
  predictionService,
  createPredictionRoutes
};
