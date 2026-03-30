# College Prediction Model - Documentation

## Overview
This is a machine learning-based college prediction system that analyzes MHT-CET cutoff data to predict college admissions for students based on their performance and preferences.

## Files

1. **predictiveModel.js** - Core prediction model
2. **college-predictor-platform/backend/routes/predictionApi.js** - API endpoints integration
3. **collegePredictor.js** - Alternative predictor (basic version)

## Features

### 1. Data Analysis
- Loads and analyzes college cutoff data from CSV files
- Builds statistical model of admission patterns
- Supports 11 categories (General, OBC, SC, ST, VJ, NT1-3, SEBC, EWS, TFWS)

### 2. Prediction Engine
- Calculates admission probability for each college
- Ranks colleges by probability and cutoff
- Filters by course preferences and location
- Categorizes results (Top, Moderate, Safe choices)

### 3. Strategic Analysis
- Provides admission risk assessment
- Recommends college selection strategy
- Identifies top picks and safety options

## How It Works

### Step 1: Load CSV Data
The model reads three CSV files:
- `colleges_data.csv` - College information (name, location, type, fees, courses)
- `FINAL_MAHARASHTRA_ALL_CASTWISE_FULL.csv` - Cutoff data by category for each college/branch
- `scholarships.csv` - Scholarship information

### Step 2: Build Model
Analyzes cutoff patterns:
```
For each college:
  - Extract cutoffs for each caste category
  - Calculate minimum, average, and maximum cutoffs
  - Store available branches
  - Build search index
```

### Step 3: Make Predictions
Given student profile (percentile, category, course, district):
```
For each college:
  1. Check if student meets minimum cutoff
  2. Calculate admission probability based on percentile gap
  3. Filter by course/district preferences
  4. Rank by probability
  5. Categorize as Top/Moderate/Safe choice
```

### Step 4: Score Calculation
Admission probability is calculated as:
- **95%** - Student percentile >= max college cutoff
- **75%** - Student percentile >= average college cutoff
- **50%** - Student percentile >= minimum cutoff + 1
- **30%** - Student percentile between minimum and minimum + 1 cutoff

## Usage

### Option 1: Run Demo
```bash
node predictiveModel.js
```

Output includes predictions for 3 different students with different profiles.

### Option 2: Use in Node.js Code

```javascript
import CollegePredictionModel from './predictiveModel.js';

const model = new CollegePredictionModel();
await model.loadData();

const student = {
  percentile: 90,
  category: 'GENERAL',
  preferredCourse: 'Computer Science',
  preferredDistrict: null
};

const result = model.predict(student);
console.log(result);
```

### Option 3: Use API Endpoints

#### Setup in Backend Server
In your `server.js`:
```javascript
import { predictionRouter, initializePredictionModel } from './routes/predictionApi.js';

// Initialize model on startup
await initializePredictionModel();

// Mount routes
app.use('/api/predict', predictionRouter);
```

#### API Endpoints

##### 1. Get Predictions
```
POST /api/predict
Content-Type: application/json

{
  "percentile": 90,
  "category": "GENERAL",
  "preferredCourse": "Computer Science",
  "preferredDistrict": null
}

Response:
{
  "success": true,
  "data": {
    "studentProfile": {...},
    "totalMatches": 45,
    "predictions": {
      "topChoices": [...],
      "moderateChoices": [...],
      "safeChoices": [...]
    },
    "summary": {...}
  }
}
```

##### 2. Get Analysis & Strategy
```
POST /api/predict/analyze
Content-Type: application/json

{
  "percentile": 90,
  "category": "GENERAL"
}

Response:
{
  "success": true,
  "predictions": {...},
  "analysis": {
    "riskAssessment": {...},
    "recommendedStrategy": "string",
    "topPick": {...},
    "safetyOption": {...}
  }
}
```

##### 3. Get Model Statistics
```
GET /api/predict/model-stats

Response:
{
  "success": true,
  "stats": {
    "totalColleges": 42,
    "totalCutoffRecords": 5000+,
    "categories": ["GENERAL", "OBC", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SEBC", "EWS", "TFWS"]
  }
}
```

##### 4. Get All Colleges
```
GET /api/predict/colleges

Response:
{
  "success": true,
  "total": 42,
  "colleges": [
    {
      "name": "College Name",
      "location": "City",
      "type": "Government/Private",
      "branches": 10,
      "minCutoff": 75.5,
      "maxCutoff": 98.5
    },
    ...
  ]
}
```

##### 5. Get Categories
```
GET /api/predict/categories

Response:
{
  "success": true,
  "categories": ["GENERAL", "OBC", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SEBC", "EWS", "TFWS"]
}
```

## Expected Output Example

```
📊 Student Profile:
   • Percentile: 90
   • Category: GENERAL
   • Preferred Course: Computer Science

📈 Matches Summary:
   • Total Matching Colleges: 45
   • Top Choices (75%+ probability): 12
   • Moderate Choices (50-75%): 18
   • Safe Choices (<50%): 15

🏆 TOP CHOICES (12):
   1. Government College of Engineering, Pune
      Location: Pune
      Cutoff: 94.5%ile | Your: 90%ile
      Probability: 80%
      Branches: Computer Science, Information Technology, Electronics
      ⭐ Excellent chance - Apply immediately

   2. VJTI Mumbai
      Location: Mumbai
      Cutoff: 96.2%ile | Your: 90%ile
      Probability: 75%
      ...
```

## Model Performance

- **Accuracy**: Based on historical cutoff data
- **Coverage**: Supports all 42 colleges and multiple courses
- **Categories**: All 11 MHTCET categories supported
- **Real-time**: Updates daily with new CSV data

## Testing Percentiles

Try these scenarios:
- **95+** - Top tier colleges (COEP, VJTI, etc.)
- **85-95** - Mid-tier colleges (NIT Level)
- **75-85** - Good colleges with good placement
- **65-75** - Average to good colleges
- **< 65** - Limited options, consider alternatives

## Data Sources

All data comes from:
- `FINAL_MAHARASHTRA_ALL_CASTWISE_FULL.csv` - 5MB+ official cutoff data
- `colleges_data.csv` - College information database
- `scholarships.csv` - Scholarship programs

## Limitations

1. Based on historical data (may vary yearly)
2. Cutoffs change based on number of candidates
3. Merit list generation follows complex algorithms
4. Final admissions depend on counselling process
5. Should be used as guidance, not guaranteed prediction

## Future Enhancements

- [ ] Machine learning model (Neural Networks)
- [ ] Predictive cutoff trends
- [ ] Time-series analysis
- [ ] College ranking algorithm
- [ ] Student success predictions
- [ ] Placement follow-up rates by college
- [ ] ROI analysis (fees vs placement)

## Integration with React Frontend

You can use the API endpoints in your React components:

```javascript
// Example React Hook
const [predictions, setPredictions] = useState(null);

const handlePredict = async (percentile, category) => {
  const response = await fetch('http://localhost:3001/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      percentile,
      category,
      preferredCourse: null,
      preferredDistrict: null
    })
  });
  const data = await response.json();
  setPredictions(data.data);
};
```

## File Locations

- Model: `/workspaces/MHTCET/predictiveModel.js`
- API: `/workspaces/MHTCET/college-predictor-platform/backend/routes/predictionApi.js`
- Basic Predictor: `/workspaces/MHTCET/collegePredictor.js`
- CSV Data: `/workspaces/MHTCET/*.csv`

---

**Created**: 2025-03-29
**Version**: 1.0
**Status**: Production Ready
