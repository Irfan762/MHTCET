// ============================================================
// QUICK USAGE EXAMPLES - College Prediction Model
// ============================================================

// ============================================================
// EXAMPLE 1: Basic Standalone Usage
// ============================================================

import CollegePredictionModel from './predictiveModel.js';

async function basicExample() {
  const model = new CollegePredictionModel();

  // Load data from CSV files
  await model.loadData();

  // Create student profile
  const student = {
    percentile: 90,
    category: 'GENERAL',
    preferredCourse: 'Computer Science',
    preferredDistrict: null
  };

  // Get predictions
  const result = model.predict(student);

  // View results
  console.log('Total Matching Colleges:', result.totalMatches);
  console.log('Top Choices:', result.predictions.topChoices);
  console.log('Moderate Choices:', result.predictions.moderateChoices);
  console.log('Safe Choices:', result.predictions.safeChoices);
}

// Run: node (file containing this)
// Or import: import { basicExample } from './examples.js';


// ============================================================
// EXAMPLE 2: React Component Usage
// ============================================================

import { useState } from 'react';
import axios from 'axios';

function CollegePredictorUI() {
  const [percentile, setPercentile] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/predict', {
        percentile: parseFloat(percentile),
        category: category,
        preferredCourse: null,
        preferredDistrict: null
      });

      setPredictions(response.data.data);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handlePredict}>
        <input
          type="number"
          placeholder="Enter Percentile"
          value={percentile}
          onChange={(e) => setPercentile(e.target.value)}
          max="100"
          min="0"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>GENERAL</option>
          <option>OBC</option>
          <option>SC</option>
          <option>ST</option>
          <option>VJ</option>
          <option>NT1</option>
          <option>NT2</option>
          <option>NT3</option>
          <option>SEBC</option>
          <option>EWS</option>
          <option>TFWS</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Get Predictions'}
        </button>
      </form>

      {predictions && (
        <div>
          <h3>Results for {predictions.studentProfile.percentile}% - {predictions.studentProfile.category}</h3>

          <h4>Top Choices ({predictions.predictions.topChoices.length})</h4>
          {predictions.predictions.topChoices.map((college, idx) => (
            <div key={idx}>
              <h5>{college.collegeName}</h5>
              <p>Probability: {college.admissionProbability}%</p>
              <p>Cutoff: {college.minCutoff}%ile</p>
              <p>{college.recommendation}</p>
            </div>
          ))}

          <h4>Moderate Choices ({predictions.predictions.moderateChoices.length})</h4>
          {predictions.predictions.moderateChoices.map((college, idx) => (
            <div key={idx}>
              <h5>{college.collegeName}</h5>
              <p>Probability: {college.admissionProbability}%</p>
            </div>
          ))}

          <h4>Safe Choices ({predictions.predictions.safeChoices.length})</h4>
          {predictions.predictions.safeChoices.map((college, idx) => (
            <div key={idx}>
              <h5>{college.collegeName}</h5>
              <p>Probability: {college.admissionProbability}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollegePredictorUI;


// ============================================================
// EXAMPLE 3: Backend Integration (server.js)
// ============================================================

import express from 'express';
import { predictionRouter, initializePredictionModel } from './routes/predictionApi.js';

const app = express();

// Middleware
app.use(express.json());

// Initialize prediction model on startup
(async () => {
  await initializePredictionModel();
  console.log('Prediction model ready!');
})();

// Mount prediction routes
app.use('/api', predictionRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});


// ============================================================
// EXAMPLE 4: Batch Processing Multiple Students
// ============================================================

async function batchPredict() {
  const model = new CollegePredictionModel();
  await model.loadData();

  const students = [
    { percentile: 95, category: 'GENERAL' },
    { percentile: 85, category: 'OBC' },
    { percentile: 75, category: 'SC' },
    { percentile: 88, category: 'GENERAL', preferredCourse: 'Computer Science' }
  ];

  const results = [];

  students.forEach(student => {
    const prediction = model.predict(student);
    results.push({
      student: student,
      topChoices: prediction.predictions.topChoices.length,
      moderateChoices: prediction.predictions.moderateChoices.length,
      safeChoices: prediction.predictions.safeChoices.length,
      totalOptions: prediction.totalMatches,
      topPick: prediction.predictions.topChoices[0]?.collegeName || 'None'
    });
  });

  console.table(results);
  return results;
}

// Usage: await batchPredict();


// ============================================================
// EXAMPLE 5: Custom Analysis
// ============================================================

async function customAnalysis() {
  const model = new CollegePredictionModel();
  await model.loadData();

  const student = {
    percentile: 88,
    category: 'GENERAL',
    preferredCourse: 'Computer Science'
  };

  const predictions = model.predict(student);

  // Get strategic analysis
  const analysis = model.analyzeOptions(predictions.predictions);

  console.log('Risk Assessment:', analysis.riskAssessment);
  console.log('Recommended Strategy:', analysis.recommendedStrategy);

  if (analysis.topPick) {
    console.log('Top Pick:', analysis.topPick.collegeName);
    console.log('Probability:', analysis.topPick.admissionProbability + '%');
  }

  if (analysis.safetyOption) {
    console.log('Safety Option:', analysis.safetyOption.collegeName);
    console.log('Probability:', analysis.safetyOption.admissionProbability + '%');
  }
}

// Usage: await customAnalysis();


// ============================================================
// EXAMPLE 6: Fetch from API (Client Side)
// ============================================================

async function clientSidePrediction() {
  const API_URL = 'http://localhost:3001/api/predict';

  const student = {
    percentile: 92,
    category: 'GENERAL',
    preferredCourse: 'Mechanical Engineering',
    preferredDistrict: null
  };

  try {
    // Get predictions
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(student)
    });

    const data = await response.json();

    if (data.success) {
      console.log('Predictions:', data.data);
      displayResults(data.data);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

function displayResults(data) {
  console.log('=== PREDICTION RESULTS ===\n');
  console.log('Student Profile:');
  console.log(`  Percentile: ${data.studentProfile.percentile}%`);
  console.log(`  Category: ${data.studentProfile.category}\n`);

  console.log('Summary:');
  console.log(`  Total Matches: ${data.totalMatches}`);
  console.log(`  Top Choices: ${data.summary.topChoicesCount}`);
  console.log(`  Moderate Choices: ${data.summary.moderateChoicesCount}`);
  console.log(`  Safe Choices: ${data.summary.safeChoicesCount}\n`);

  if (data.predictions.topChoices.length > 0) {
    console.log('Top Choices:');
    data.predictions.topChoices.slice(0, 3).forEach((college, idx) => {
      console.log(`  ${idx + 1}. ${college.collegeName}`);
      console.log(`     Probability: ${college.admissionProbability}%`);
    });
  }
}

// Usage: clientSidePrediction();


// ============================================================
// EXAMPLE 7: Filtering & Sorting
// ============================================================

async function advancedFiltering() {
  const model = new CollegePredictionModel();
  await model.loadData();

  const student = { percentile: 85, category: 'GENERAL' };
  const result = model.predict(student);

  // Get all colleges sorted by probability
  const allColleges = [
    ...result.predictions.topChoices,
    ...result.predictions.moderateChoices,
    ...result.predictions.safeChoices
  ];

  // Filter by location
  const puneColleges = allColleges.filter(c => c.location === 'Pune');
  console.log('Colleges in Pune:', puneColleges.length);

  // Filter by type
  const governmentColleges = allColleges.filter(c => c.type.includes('Government'));
  console.log('Government Colleges:', governmentColleges.length);

  // Filter by probability
  const highProbability = allColleges.filter(c => c.admissionProbability >= 70);
  console.log('High Probability Colleges:', highProbability.length);

  // Custom sorting
  const sortedByFees = allColleges.sort((a, b) => {
    const feeA = typeof a.fees === 'number' ? a.fees : 0;
    const feeB = typeof b.fees === 'number' ? b.fees : 0;
    return feeA - feeB;
  });
  console.log('Cheapest Options:', sortedByFees.slice(0, 3).map(c => c.collegeName));
}

// Usage: await advancedFiltering();


// ============================================================
// EXAMPLE 8: Comparison Tool
// ============================================================

async function compareColleges() {
  const model = new CollegePredictionModel();
  await model.loadData();

  const student = { percentile: 90, category: 'GENERAL' };
  const predictions = model.predict(student);

  if (predictions.predictions.topChoices.length >= 2) {
    const [college1, college2] = predictions.predictions.topChoices;

    console.log('═'.repeat(60));
    console.log('COLLEGE COMPARISON\n');

    console.log(`${college1.collegeName.padEnd(30)} | ${college2.collegeName}`);
    console.log('─'.repeat(60));
    console.log(`Probability: ${college1.admissionProbability}%`.padEnd(30) +
                ` | Probability: ${college2.admissionProbability}%`);
    console.log(`Cutoff: ${college1.avgCutoff}%ile`.padEnd(30) +
                ` | Cutoff: ${college2.avgCutoff}%ile`);
    console.log(`Location: ${college1.location}`.padEnd(30) +
                ` | Location: ${college2.location}`);
    console.log(`Type: ${college1.type}`.padEnd(30) +
                ` | Type: ${college2.type}`);
    console.log(`Branches: ${college1.branches.length}`.padEnd(30) +
                ` | Branches: ${college2.branches.length}`);
  }
}

// Usage: await compareColleges();


export {
  basicExample,
  batchPredict,
  customAnalysis,
  clientSidePrediction,
  advancedFiltering,
  compareColleges
};
