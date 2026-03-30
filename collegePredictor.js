import fs from 'fs';

// ============================================================
// COLLEGE PREDICTOR - Using CSV Data (No External Dependencies)
// ============================================================

class CollegePredictor {
  constructor() {
    this.colleges = [];
    this.cutoffs = [];
    this.scholarships = [];
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
      'EWS': 'EWS'
    };
  }

  // Simple CSV parser - handles quoted fields
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
      if (values.some(v => v)) { // Skip empty rows
        data.push(row);
      }
    }
    return data;
  }

  // Parse a single CSV line handling quoted fields
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
          i++; // Skip next quote
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

  // Load colleges data from CSV
  async loadColleges() {
    try {
      const content = fs.readFileSync('/workspaces/MHTCET/colleges_data.csv', 'utf-8');
      const data = this.parseCSV(content);

      this.colleges = data.map(row => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        fees: row.fees,
        courses: row.courses ? row.courses.split('|') : [],
        cutoff: row.cutoff,
        scholarships: row.scholarships ? row.scholarships.split('|') : []
      }));
      console.log(`✓ Loaded ${this.colleges.length} colleges`);
    } catch (error) {
      console.error('Error loading colleges:', error.message);
      throw error;
    }
  }

  // Load cutoff data from CSV
  async loadCutoffs() {
    try {
      const content = fs.readFileSync('/workspaces/MHTCET/FINAL_MAHARASHTRA_ALL_CASTWISE_FULL.csv', 'utf-8');
      const data = this.parseCSV(content);

      this.cutoffs = data.filter(row => row.college_name && row.branch_name);
      console.log(`✓ Loaded ${this.cutoffs.length} cutoff records`);
    } catch (error) {
      console.error('Error loading cutoffs:', error.message);
      throw error;
    }
  }

  // Load scholarships data
  async loadScholarships() {
    try {
      const content = fs.readFileSync('/workspaces/MHTCET/scholarships.csv', 'utf-8');
      const data = this.parseCSV(content);

      this.scholarships = data.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        eligibility: row.eligibility,
        amount: row.amount
      }));
      console.log(`✓ Loaded ${this.scholarships.length} scholarships`);
    } catch (error) {
      console.error('Error loading scholarships:', error.message);
      throw error;
    }
  }

  // Parse percentile from string (e.g., "90%ile" -> 90)
  parsePercentile(percentileStr) {
    if (!percentileStr) return 0;
    const num = parseFloat(percentileStr);
    return isNaN(num) ? 0 : num;
  }

  // Main prediction function
  predictColleges(userPercentile, userCategory, preferredCourse = null) {
    console.log(`\n🎯 Predicting colleges for:`);
    console.log(`   Percentile: ${userPercentile}%ile`);
    console.log(`   Category: ${userCategory}`);
    console.log(`   Course: ${preferredCourse || 'Any'}\n`);

    const categoryKey = this.categoryMap[userCategory.toUpperCase()] || 'GOPENS';
    const predictions = [];

    // Filter cutoffs based on user percentile
    this.cutoffs.forEach((cutoff) => {
      const cutoffValue = this.parsePercentile(cutoff[categoryKey]);

      // Check if user's percentile meets or exceeds cutoff
      if (cutoffValue > 0 && userPercentile >= cutoffValue) {
        // Filter by course if specified
        if (preferredCourse && cutoff.branch_name.toUpperCase().includes(preferredCourse.toUpperCase())) {
          predictions.push(cutoff);
        } else if (!preferredCourse) {
          predictions.push(cutoff);
        }
      }
    });

    // Get unique colleges from predictions (keep best cutoff for each college)
    const collegeMap = new Map();
    predictions.forEach(p => {
      const key = p.college_name;
      if (!collegeMap.has(key) || this.parsePercentile(p[categoryKey]) > this.parsePercentile(collegeMap.get(key)[categoryKey])) {
        collegeMap.set(key, p);
      }
    });

    // Sort and map to results
    const results = Array.from(collegeMap.values())
      .sort((a, b) => this.parsePercentile(b[categoryKey]) - this.parsePercentile(a[categoryKey]))
      .slice(0, 15)
      .map((cutoff) => {
        const collegeInfo = this.colleges.find(c =>
          c.name.toLowerCase().includes(cutoff.college_name.toLowerCase())
        );

        return {
          collegeName: cutoff.college_name,
          branch: cutoff.branch_name,
          city: cutoff.location,
          cutoffPercentile: this.parsePercentile(cutoff[categoryKey]),
          yourPercentile: userPercentile,
          admissionProbability: this.calculateProbability(userPercentile, this.parsePercentile(cutoff[categoryKey])),
          collegeType: collegeInfo?.type || 'Unknown',
          fees: collegeInfo?.fees || 'N/A',
          scholarships: collegeInfo?.scholarships || [],
          counsellingRound: cutoff.round || 1,
          year: cutoff.year || 2025
        };
      });

    return {
      totalMatches: predictions.length,
      topColleges: results
    };
  }

  // Calculate admission probability based on percentile difference
  calculateProbability(userPercentile, cutoffPercentile) {
    const diff = userPercentile - cutoffPercentile;
    if (diff >= 5) return '90-100%';
    if (diff >= 3) return '70-90%';
    if (diff >= 1) return '50-70%';
    return '30-50%';
  }

  // Get colleges by district
  getCollegesByDistrict(district) {
    return this.colleges.filter(c => c.district.toLowerCase() === district.toLowerCase());
  }

  // Get colleges by type
  getCollegesByType(type) {
    return this.colleges.filter(c => c.type.toLowerCase().includes(type.toLowerCase()));
  }

  // Display all colleges
  displayAllColleges() {
    console.log('\n📚 ALL COLLEGES:\n');
    this.colleges.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name}`);
      console.log(`   City: ${college.city} | Type: ${college.type}`);
      console.log(`   Fees: ${college.fees}`);
      console.log(`   Courses: ${college.courses.join(', ')}`);
      console.log('');
    });
  }

  // Initialize all data
  async initialize() {
    try {
      await this.loadColleges();
      await this.loadCutoffs();
      await this.loadScholarships();
      console.log('\n✅ College Predictor initialized successfully!\n');
      return true;
    } catch (error) {
      console.error('❌ Error initializing predictor:', error);
      return false;
    }
  }
}

// ============================================================
// DEMO & USAGE
// ============================================================

async function main() {
  const predictor = new CollegePredictor();

  // Initialize with CSV data
  const initialized = await predictor.initialize();
  if (!initialized) return;

  // Example 1: Predict colleges for 90 percentile, General category
  console.log('═'.repeat(70));
  console.log('EXAMPLE 1: 90 Percentile, General Category');
  console.log('═'.repeat(70));
  let result = predictor.predictColleges(90, 'GENERAL');
  console.log(`\n📊 Total Matching Colleges: ${result.totalMatches}\n`);
  console.log('🏆 Top 10 Colleges:\n');
  result.topColleges.slice(0, 10).forEach((college, index) => {
    console.log(`${index + 1}. ${college.collegeName}`);
    console.log(`   📍 Location: ${college.city}`);
    console.log(`   🎓 Branch: ${college.branch}`);
    console.log(`   📊 Cutoff: ${college.cutoffPercentile}%ile | Your Percentile: ${college.yourPercentile}%ile`);
    console.log(`   ✅ Admission Probability: ${college.admissionProbability}`);
    console.log(`   🏢 Type: ${college.collegeType} | 💰 Fees: ${college.fees}`);
    if (college.scholarships.length > 0) {
      console.log(`   🎁 Scholarships: ${college.scholarships.join(', ')}`);
    }
    console.log('');
  });

  // Example 2: 85 percentile, OBC category
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 2: 85 Percentile, OBC Category');
  console.log('═'.repeat(70));
  result = predictor.predictColleges(85, 'OBC');
  console.log(`\n📊 Total Matching Colleges: ${result.totalMatches}\n`);
  console.log('🏆 Top 5 Colleges:\n');
  result.topColleges.slice(0, 5).forEach((college, index) => {
    console.log(`${index + 1}. ${college.collegeName}`);
    console.log(`   🎓 Branch: ${college.branch}`);
    console.log(`   📊 Cutoff: ${college.cutoffPercentile}%ile`);
    console.log(`   ✅ Probability: ${college.admissionProbability}\n`);
  });

  // Example 3: Filter by Computer Science branch
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 3: 88 Percentile, Computer Science Branch, General Category');
  console.log('═'.repeat(70));
  result = predictor.predictColleges(88, 'GENERAL', 'Computer Science');
  console.log(`\n📊 Total Matching Colleges: ${result.totalMatches}\n`);
  console.log('🏆 Colleges:\n');
  result.topColleges.forEach((college, index) => {
    console.log(`${index + 1}. ${college.collegeName}`);
    console.log(`   🎓 ${college.branch}`);
    console.log(`   ✅ Probability: ${college.admissionProbability}`);
    console.log(`   💰 Fees: ${college.fees}\n`);
  });

  // Display colleges by district
  console.log('\n' + '═'.repeat(70));
  console.log('COLLEGES BY DISTRICT - PUNE');
  console.log('═'.repeat(70));
  const puneColleges = predictor.getCollegesByDistrict('Pune');
  if (puneColleges.length > 0) {
    puneColleges.forEach((college) => {
      console.log(`• ${college.name} (${college.type})`);
    });
  } else {
    console.log('No colleges found in Pune');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ All examples completed!');
  console.log('═'.repeat(70));
}

// Run demo
main().catch(console.error);

export default CollegePredictor;
