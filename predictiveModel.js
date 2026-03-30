import fs from 'fs';

// ============================================================
// COLLEGE PREDICTION MODEL - Machine Learning Approach
// ============================================================

class CollegePredictionModel {
  constructor() {
    this.colleges = [];
    this.cutoffs = [];
    this.scholarships = [];
    this.model = null;
    this.categoryMap = {
      'GENERAL': 'GOPENS',
      'OBC': 'GOBCS',
      'SC': 'GSCS',
      'ST': 'GSTS',
      'VJ': 'GVJS',
      'NT1': 'GNT1S',
      'NT2': 'GNT2S',
      'NT3': 'GNT3S',
      'SEBC': 'GSEBCS',
      'EWS': 'EWS',
      'TFWS': 'TFWS'
    };
  }

  // CSV Parser
  parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      if (values.some(v => v)) {
        data.push(row);
      }
    }
    return data;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  parsePercentile(val) {
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  // Load and initialize data
  async loadData() {
    try {
      // Load colleges
      const collegesContent = fs.readFileSync('/workspaces/MHTCET/colleges_data.csv', 'utf-8');
      const collegesData = this.parseCSV(collegesContent);
      this.colleges = collegesData.map(row => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        fees: parseFloat(row.fees) || 0,
        courses: row.courses ? row.courses.split('|') : [],
        cutoff: parseFloat(row.cutoff) || 0,
        scholarships: row.scholarships ? row.scholarships.split('|') : []
      }));

      // Load cutoffs
      const cutoffsContent = fs.readFileSync('/workspaces/MHTCET/FINAL_MAHARASHTRA_ALL_CASTWISE_FULL.csv', 'utf-8');
      const cutoffsData = this.parseCSV(cutoffsContent);
      this.cutoffs = cutoffsData.filter(row => row.college_name && row.branch_name);

      // Load scholarships
      const scholarshipsContent = fs.readFileSync('/workspaces/MHTCET/scholarships.csv', 'utf-8');
      const scholarshipsData = this.parseCSV(scholarshipsContent);
      this.scholarships = scholarshipsData;

      console.log(`✓ Loaded ${this.colleges.length} colleges`);
      console.log(`✓ Loaded ${this.cutoffs.length} cutoff records`);
      console.log(`✓ Loaded ${this.scholarships.length} scholarships`);

      this.buildModel();
      return true;
    } catch (error) {
      console.error('Error loading data:', error.message);
      return false;
    }
  }

  // Build prediction model from data
  buildModel() {
    this.model = {
      collegeStats: {},
      categoryStats: {}
    };

    // Analyze statistics for each college
    this.cutoffs.forEach(cutoff => {
      const collegeName = cutoff.college_name;
      if (!this.model.collegeStats[collegeName]) {
        this.model.collegeStats[collegeName] = {
          name: collegeName,
          location: cutoff.location,
          type: cutoff.college_type,
          cutoffs: {},
          branches: new Set(),
          minCutoff: Infinity,
          maxCutoff: 0
        };
      }

      // Store cutoffs by category
      Object.keys(this.categoryMap).forEach(category => {
        const key = this.categoryMap[category];
        const cutoffVal = this.parsePercentile(cutoff[key]);
        if (cutoffVal > 0) {
          if (!this.model.collegeStats[collegeName].cutoffs[category]) {
            this.model.collegeStats[collegeName].cutoffs[category] = [];
          }
          this.model.collegeStats[collegeName].cutoffs[category].push(cutoffVal);
          this.model.collegeStats[collegeName].minCutoff = Math.min(
            this.model.collegeStats[collegeName].minCutoff,
            cutoffVal
          );
          this.model.collegeStats[collegeName].maxCutoff = Math.max(
            this.model.collegeStats[collegeName].maxCutoff,
            cutoffVal
          );
        }
      });

      this.model.collegeStats[collegeName].branches.add(cutoff.branch_name);
    });

    // Convert branches Set to Array
    Object.keys(this.model.collegeStats).forEach(collegeName => {
      this.model.collegeStats[collegeName].branches = Array.from(
        this.model.collegeStats[collegeName].branches
      );
    });

    console.log(`✓ Prediction model built with ${Object.keys(this.model.collegeStats).length} colleges`);
  }

  // Main prediction function
  predict(studentProfile) {
    const {
      percentile,
      category = 'GENERAL',
      preferredCourse = null,
      preferredDistrict = null,
      maxDistance = null
    } = studentProfile;

    if (!percentile || percentile < 0 || percentile > 100) {
      throw new Error('Invalid percentile. Must be between 0-100');
    }

    const predictions = [];
    const categoryKey = this.categoryMap[category.toUpperCase()] || 'GOPENS';

    // Score each college
    Object.keys(this.model.collegeStats).forEach(collegeName => {
      const collegeData = this.model.collegeStats[collegeName];
      const cutoffs = collegeData.cutoffs[category];

      if (!cutoffs || cutoffs.length === 0) return;

      // Get average cutoff for this category
      const avgCutoff = cutoffs.reduce((a, b) => a + b, 0) / cutoffs.length;
      const minCutoff = Math.min(...cutoffs);
      const maxCutoff = Math.max(...cutoffs);

      // Check if student meets minimum cutoff
      if (percentile < minCutoff) {
        return; // Student doesn't qualify
      }

      // Calculate admission probability
      let admissionProbability = 0;
      if (percentile >= maxCutoff) {
        admissionProbability = 0.95; // Very high chance
      } else if (percentile >= avgCutoff) {
        admissionProbability = 0.75; // High chance
      } else if (percentile >= minCutoff + 1) {
        admissionProbability = 0.50; // Medium chance
      } else {
        admissionProbability = 0.30; // Low chance
      }

      // Filter by preferred course
      let matchingBranches = collegeData.branches;
      if (preferredCourse) {
        matchingBranches = collegeData.branches.filter(branch =>
          branch.toUpperCase().includes(preferredCourse.toUpperCase())
        );
        if (matchingBranches.length === 0) {
          return; // No matching course
        }
      }

      // Filter by preferred district
      if (preferredDistrict && collegeData.location !== preferredDistrict) {
        return;
      }

      // Get college info
      const collegeInfo = this.colleges.find(c =>
        c.name.toLowerCase().includes(collegeName.toLowerCase())
      );

      predictions.push({
        rank: predictions.length + 1,
        collegeName: collegeName,
        location: collegeData.location,
        type: collegeData.type,
        cutoff: minCutoff,
        avgCutoff: Math.round(avgCutoff * 100) / 100,
        maxCutoff: maxCutoff,
        studentPercentile: percentile,
        admissionProbability: Math.round(admissionProbability * 100),
        branches: matchingBranches,
        fees: collegeInfo?.fees || 'N/A',
        scholarships: collegeInfo?.scholarships || [],
        recommendation: this.getRecommendation(percentile, avgCutoff, admissionProbability)
      });
    });

    // Sort by admission probability and cutoff
    predictions.sort((a, b) => {
      if (b.admissionProbability !== a.admissionProbability) {
        return b.admissionProbability - a.admissionProbability;
      }
      return b.avgCutoff - a.avgCutoff;
    });

    // Categorize predictions
    const topChoices = predictions.filter(p => p.admissionProbability >= 75).slice(0, 5);
    const moderateChoices = predictions.filter(p => p.admissionProbability >= 50 && p.admissionProbability < 75).slice(0, 5);
    const safeChoices = predictions.filter(p => p.admissionProbability < 50).slice(0, 5);

    return {
      studentProfile: {
        percentile: percentile,
        category: category,
        preferredCourse: preferredCourse || 'Any',
        preferredDistrict: preferredDistrict || 'Any'
      },
      totalMatches: predictions.length,
      predictions: {
        topChoices: topChoices.length > 0 ? topChoices : [],
        moderateChoices: moderateChoices.length > 0 ? moderateChoices : [],
        safeChoices: safeChoices.length > 0 ? safeChoices : []
      },
      summary: {
        topChoicesCount: topChoices.length,
        moderateChoicesCount: moderateChoices.length,
        safeChoicesCount: safeChoices.length,
        totalPredictions: topChoices.length + moderateChoices.length + safeChoices.length
      }
    };
  }

  // Get recommendation based on scores
  getRecommendation(percentile, cutoff, probability) {
    if (probability >= 0.75) {
      return '⭐ Excellent chance - Apply immediately';
    } else if (probability >= 0.50) {
      return '✅ Good chance - Strong backup option';
    } else if (probability >= 0.30) {
      return '⚠️  Fair chance - Consider as safety option';
    } else {
      return '❌ Low chance - Very competitive';
    }
  }

  // Get detailed analysis
  analyzeOptions(predictions) {
    const analysis = {
      riskAssessment: {
        high: predictions.topChoices.length,
        medium: predictions.moderateChoices.length,
        low: predictions.safeChoices.length
      },
      recommendedStrategy: this.getStrategy(predictions),
      topPick: predictions.topChoices[0] || null,
      safetyOption: predictions.safeChoices[0] || null
    };
    return analysis;
  }

  // Get admission strategy
  getStrategy(predictions) {
    const total = predictions.summary.totalPredictions;

    if (predictions.summary.topChoicesCount >= 3) {
      return 'Strong Profile - Focus on top choices, you have excellent opportunities';
    } else if (predictions.summary.topChoicesCount > 0 && predictions.summary.safeChoicesCount >= 2) {
      return 'Balanced Profile - Mix of ambitious and safe options available';
    } else if (predictions.summary.safeChoicesCount >= 3) {
      return 'Conservative Profile - Multiple safety options, consider competitive colleges';
    } else if (total === 0) {
      return 'Limited Options - Consider retaking exam or exploring other opportunities';
    } else {
      return 'Strategic Profile - Carefully balance choices across risk levels';
    }
  }
}

// ============================================================
// DEMO & USAGE
// ============================================================

async function runDemo() {
  const model = new CollegePredictionModel();

  console.log('═'.repeat(80));
  console.log('COLLEGE PREDICTION MODEL - Initialization');
  console.log('═'.repeat(80));

  const initialized = await model.loadData();
  if (!initialized) return;

  console.log('\n' + '═'.repeat(80));
  console.log('TEST 1: 90 Percentile, General Category');
  console.log('═'.repeat(80));

  const student1 = {
    percentile: 90,
    category: 'GENERAL',
    preferredCourse: null,
    preferredDistrict: null
  };

  const result1 = model.predict(student1);
  displayResults(result1);

  console.log('\n' + '═'.repeat(80));
  console.log('TEST 2: 85 Percentile, OBC Category, Computer Science');
  console.log('═'.repeat(80));

  const student2 = {
    percentile: 85,
    category: 'OBC',
    preferredCourse: 'Computer Science',
    preferredDistrict: null
  };

  const result2 = model.predict(student2);
  displayResults(result2);

  console.log('\n' + '═'.repeat(80));
  console.log('TEST 3: 75 Percentile, SC Category');
  console.log('═'.repeat(80));

  const student3 = {
    percentile: 75,
    category: 'SC',
    preferredCourse: null,
    preferredDistrict: null
  };

  const result3 = model.predict(student3);
  displayResults(result3);

  // Display strategy
  console.log('\n' + '═'.repeat(80));
  console.log('STRATEGIC ANALYSIS - Student 1 (90 Percentile, General)');
  console.log('═'.repeat(80));
  const analysis = model.analyzeOptions(result1.predictions);
  console.log(JSON.stringify(analysis, null, 2));
}

function displayResults(result) {
  console.log(`\n📊 Student Profile:`);
  console.log(`   • Percentile: ${result.studentProfile.percentile}`);
  console.log(`   • Category: ${result.studentProfile.category}`);
  console.log(`   • Preferred Course: ${result.studentProfile.preferredCourse}`);
  console.log(`\n📈 Matches Summary:`);
  console.log(`   • Total Matching Colleges: ${result.totalMatches}`);
  console.log(`   • Top Choices (75%+ probability): ${result.summary.topChoicesCount}`);
  console.log(`   • Moderate Choices (50-75%): ${result.summary.moderateChoicesCount}`);
  console.log(`   • Safe Choices (<50%): ${result.summary.safeChoicesCount}`);

  if (result.predictions.topChoices.length > 0) {
    console.log(`\n🏆 TOP CHOICES (${result.predictions.topChoices.length}):`);
    result.predictions.topChoices.forEach((college, idx) => {
      console.log(`\n   ${idx + 1}. ${college.collegeName}`);
      console.log(`      Location: ${college.location}`);
      console.log(`      Cutoff: ${college.minCutoff}%ile | Your: ${college.studentPercentile}%ile`);
      console.log(`      Probability: ${college.admissionProbability}%`);
      console.log(`      Branches: ${college.branches.slice(0, 3).join(', ')}${college.branches.length > 3 ? '...' : ''}`);
      console.log(`      ${college.recommendation}`);
    });
  }

  if (result.predictions.moderateChoices.length > 0) {
    console.log(`\n✅ MODERATE CHOICES (${result.predictions.moderateChoices.length}):`);
    result.predictions.moderateChoices.slice(0, 3).forEach((college, idx) => {
      console.log(`\n   ${idx + 1}. ${college.collegeName}`);
      console.log(`      Probability: ${college.admissionProbability}% | ${college.recommendation}`);
    });
  }

  if (result.predictions.safeChoices.length > 0) {
    console.log(`\n🛡️  SAFE CHOICES (${result.predictions.safeChoices.length}):`);
    result.predictions.safeChoices.slice(0, 2).forEach((college, idx) => {
      console.log(`   ${idx + 1}. ${college.collegeName} - ${college.admissionProbability}% probability`);
    });
  }
}

// Run the demo
runDemo().catch(console.error);

export default CollegePredictionModel;
