import College from '../models/College.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read and parse the real MHT-CET CSV data
const parseCSVData = () => {
  try {
    const csvPath = path.join(__dirname, '../../../MHTCET_Cutoff_All_4_Rounds.csv');

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found at:', csvPath);
      console.log('📁 Using fallback data instead');
      return fallbackCollegeData;
    }

    console.log('📂 Reading CSV file from:', csvPath);
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());

    console.log(`📊 Total lines in CSV: ${lines.length}`);

    if (lines.length < 2) {
      console.log('❌ CSV file appears to be empty or invalid');
      return fallbackCollegeData;
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
    console.log('📋 CSV Headers:', headers.slice(0, 10)); // Show first 10 headers
    const indexByHeader = headers.reduce((acc, header, idx) => {
      acc[header.toLowerCase()] = idx;
      return acc;
    }, {});
    const isFourRoundFormat = Object.prototype.hasOwnProperty.call(indexByHeader, 'general_cutoff_r1');

    const colleges = new Map();
    let processedLines = 0;
    let skippedLines = 0;

    const getValue = (values, key) => {
      const idx = indexByHeader[key];
      if (idx === undefined) return '';
      return (values[idx] || '').replace(/"/g, '').trim();
    };

    const getNumber = (values, key) => {
      const raw = getValue(values, key);
      if (!raw) return null;
      const parsed = parseFloat(raw);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const buildRoundCutoff = (values, roundNum, isLadies, isTfws) => {
      const general = getNumber(values, `general_percentage_r${roundNum}`);
      const obc = getNumber(values, `obc_percentage_r${roundNum}`);
      const sc = getNumber(values, `sc_percentage_r${roundNum}`);
      const st = getNumber(values, `st_percentage_r${roundNum}`);
      const ews = getNumber(values, `ews_percentage_r${roundNum}`);
      const vjnt = getNumber(values, `vjnt_percentage_r${roundNum}`);
      const sebc = getNumber(values, `sbc_percentage_r${roundNum}`);

      return {
        general,
        obc,
        sc,
        st,
        ews,
        vjnt,
        nt1: null,
        nt2: null,
        nt3: null,
        sebc,
        tfws: isTfws ? general : null,
        ladies: {
          general: isLadies ? general : null,
          obc: isLadies ? obc : null,
          sc: isLadies ? sc : null,
          st: isLadies ? st : null,
          vjnt: isLadies ? vjnt : null,
          nt1: null,
          nt2: null,
          nt3: null,
          sebc: isLadies ? sebc : null
        }
      };
    };

    const mergeCutoff = (targetCutoff, sourceCutoff) => {
      ['general', 'obc', 'sc', 'st', 'ews', 'vjnt', 'nt1', 'nt2', 'nt3', 'sebc', 'tfws'].forEach((cat) => {
        if (sourceCutoff[cat] !== null && sourceCutoff[cat] !== undefined) {
          if (targetCutoff[cat] === null || targetCutoff[cat] === undefined || sourceCutoff[cat] > targetCutoff[cat]) {
            targetCutoff[cat] = sourceCutoff[cat];
          }
        }
      });

      Object.keys(targetCutoff.ladies).forEach((cat) => {
        const val = sourceCutoff.ladies[cat];
        if (val !== null && val !== undefined) {
          if (targetCutoff.ladies[cat] === null || targetCutoff.ladies[cat] === undefined || val > targetCutoff.ladies[cat]) {
            targetCutoff.ladies[cat] = val;
          }
        }
      });
    };

    // Process each line of CSV data (process all lines for complete data)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skippedLines++;
        continue;
      }

      // Handle CSV parsing with quoted fields
      const values = parseCSVLine(line);

      if (values.length < 10) {
        skippedLines++;
        continue;
      }

      try {
        if (!isFourRoundFormat) {
          skippedLines++;
          continue;
        }

        const collegeName = getValue(values, 'college_name');
        const collegeCode = getValue(values, 'college_code');
        const branchName = getValue(values, 'branch_name');
        const branchCode = getValue(values, 'branch_code');
        const location = getValue(values, 'location');
        const collegeType = getValue(values, 'college_type');
        const isLadies = getValue(values, 'is_ladies').toLowerCase() === 'yes';
        const isTfws = getValue(values, 'is_tfws').toLowerCase() === 'yes';

        // Skip if essential data is missing
        if (!collegeName || !branchName || !location) {
          skippedLines++;
          continue;
        }

        const collegeLocation = location || extractLocationFromName(collegeName);
        const type = determineCollegeType(collegeName, collegeType);

        const collegeKey = collegeName; // Use college name as key

        if (!colleges.has(collegeKey)) {
          colleges.set(collegeKey, {
            name: collegeName,
            location: collegeLocation + ', Maharashtra',
            city: collegeLocation,
            state: 'Maharashtra',
            type: type,
            establishedYear: getEstablishedYear(collegeName),
            courses: [],
            cutoff: {
              general: null,
              obc: null,
              sc: null,
              st: null,
              ews: null,
              vjnt: null,
              nt1: null,
              nt2: null,
              nt3: null,
              sebc: null,
              tfws: null,
              ladies: {
                general: null,
                obc: null,
                sc: null,
                st: null,
                vjnt: null,
                nt1: null,
                nt2: null,
                nt3: null,
                sebc: null
              }
            },
            fees: generateFees(type),
            placements: generatePlacements(collegeName),
            facilities: getStandardFacilities(),
            accreditation: getAccreditation(collegeName),
            ranking: generateRanking(),
            contact: generateContact(collegeName, collegeLocation),
            featured: isFeaturedCollege(collegeName),
            rounds: []
          });
        }

        // Add course to college
        const college = colleges.get(collegeKey);
        const existingCourse = college.courses.find(c => c.name === branchName);

        if (!existingCourse && branchName) {
          college.courses.push({
            name: branchName,
            code: branchCode || '',
            duration: '4 years',
            seats: generateSeats(branchName),
            rounds: [],
            cutoff: {
              general: null,
              obc: null,
              sc: null,
              st: null,
              ews: null,
              vjnt: null,
              nt1: null,
              nt2: null,
              nt3: null,
              sebc: null,
              tfws: null,
              ladies: {
                general: null,
                obc: null,
                sc: null,
                st: null,
                vjnt: null,
                nt1: null,
                nt2: null,
                nt3: null,
                sebc: null
              }
            }
          });
        }

        // Add or merge 4-round data to course and college
        const targetCourse = college.courses.find(c => c.name === branchName);
        if (targetCourse) {
          for (let roundNum = 1; roundNum <= 4; roundNum++) {
            const roundCutoff = buildRoundCutoff(values, roundNum, isLadies, isTfws);

            const hasAtLeastOneCutoff = ['general', 'obc', 'sc', 'st', 'ews', 'vjnt', 'sebc', 'tfws']
              .some((cat) => roundCutoff[cat] !== null && roundCutoff[cat] !== undefined);

            if (!hasAtLeastOneCutoff) continue;

            const existingRound = targetCourse.rounds.find(r => r.number === roundNum);
            if (!existingRound) {
              targetCourse.rounds.push({ number: roundNum, cutoff: roundCutoff });
            } else {
              mergeCutoff(existingRound.cutoff, roundCutoff);
            }

            let collegeRound = college.rounds.find(r => r.number === roundNum);
            if (!collegeRound) {
              collegeRound = { number: roundNum, cutoff: { ...roundCutoff } };
              college.rounds.push(collegeRound);
            } else {
              mergeCutoff(collegeRound.cutoff, roundCutoff);
            }

            updateCollegeCutoffs(college, {
              general: roundCutoff.general,
              obc: roundCutoff.obc,
              sc: roundCutoff.sc,
              st: roundCutoff.st,
              ews: roundCutoff.ews,
              vjnt: roundCutoff.vjnt,
              nt1: roundCutoff.nt1,
              nt2: roundCutoff.nt2,
              nt3: roundCutoff.nt3,
              sebc: roundCutoff.sebc,
              tfws: roundCutoff.tfws
            });
          }
        }

        processedLines++;
      } catch (error) {
        console.log(`⚠️  Error processing line ${i}:`, error.message);
        skippedLines++;
      }
    }

    const collegeArray = Array.from(colleges.values());
    console.log(`✅ Successfully parsed ${collegeArray.length} colleges`);
    console.log(`📊 Processed ${processedLines} lines, skipped ${skippedLines} lines`);

    if (collegeArray.length === 0) {
      console.log('❌ No colleges parsed, using fallback data');
      return fallbackCollegeData;
    }

    return collegeArray;

  } catch (error) {
    console.error('❌ Error parsing CSV data:', error.message);
    console.log('📁 Using fallback data instead');
    return fallbackCollegeData;
  }
};

// Helper function to parse CSV line with quoted fields
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

// Helper function to determine college type from name and type field
const determineCollegeType = (name, typeField) => {
  const lowerName = name.toLowerCase();
  const lowerType = (typeField || '').toLowerCase();

  if (lowerName.includes('government') || lowerName.includes('govt') || lowerType.includes('government')) {
    return 'Government';
  } else if (lowerType.includes('autonomous') || lowerName.includes('autonomous')) {
    return 'Autonomous';
  } else if (lowerType.includes('university') || lowerName.includes('university')) {
    return 'University';
  } else if (lowerType.includes('aided') || lowerType.includes('un-aided')) {
    return 'Private';
  } else if (lowerName.includes('deemed')) {
    return 'Deemed';
  } else {
    return 'Private';
  }
};

// Helper function to update college cutoffs
const updateCollegeCutoffs = (college, newCutoffs) => {
  Object.keys(newCutoffs).forEach(category => {
    const newCutoff = newCutoffs[category];
    if (newCutoff && (!college.cutoff[category] || newCutoff > college.cutoff[category])) {
      college.cutoff[category] = newCutoff;
    }
  });
};

// Helper functions
const extractLocationFromName = (name) => {
  const locations = [
    'Pune', 'Mumbai', 'Nagpur', 'Aurangabad', 'Nashik', 'Kolhapur', 'Amravati', 'Sangli',
    'Yavatmal', 'Akola', 'Pusad', 'Shegaon', 'Solapur', 'Nanded', 'Latur', 'Osmanabad',
    'Jalgaon', 'Dhule', 'Ahmednagar', 'Satara', 'Ratnagiri', 'Sindhudurg', 'Thane',
    'Raigad', 'Palghar', 'Wardha', 'Chandrapur', 'Gadchiroli', 'Gondia', 'Bhandara',
    'Buldhana', 'Washim', 'Hingoli', 'Parbhani', 'Jalna', 'Bid', 'Navi Mumbai'
  ];

  for (const location of locations) {
    if (name.toLowerCase().includes(location.toLowerCase())) {
      return location;
    }
  }
  return 'Maharashtra';
};

const extractCityFromName = (name) => {
  return extractLocationFromName(name);
};

const getEstablishedYear = (name) => {
  const establishedYears = {
    'College of Engineering Pune': 1854,
    'COEP': 1854,
    'Veermata Jijabai': 1887,
    'VJTI': 1887,
    'Government College of Engineering, Aurangabad': 1960,
    'Government College of Engineering, Nagpur': 1951,
    'Walchand': 1947
  };

  for (const [key, year] of Object.entries(establishedYears)) {
    if (name.includes(key)) return year;
  }
  return 1970; // Default year
};

const generateFees = (type) => {
  const fees = type === 'Government' ?
    Math.floor(Math.random() * 50000) + 80000 :
    Math.floor(Math.random() * 300000) + 200000;

  return {
    annual: fees,
    currency: 'INR',
    formatted: `₹${(fees / 100000).toFixed(1)} Lakh/year`
  };
};

const generatePlacements = (name) => {
  const isTopTier = name.includes('COEP') || name.includes('VJTI') || name.includes('College of Engineering Pune');

  const avgPackage = isTopTier ?
    Math.floor(Math.random() * 400000) + 800000 :
    Math.floor(Math.random() * 300000) + 400000;

  const highestPackage = isTopTier ?
    Math.floor(Math.random() * 2000000) + 3000000 :
    Math.floor(Math.random() * 1000000) + 1500000;

  const placementRate = isTopTier ?
    Math.floor(Math.random() * 10) + 90 :
    Math.floor(Math.random() * 20) + 70;

  return {
    averagePackage: {
      amount: avgPackage,
      formatted: `₹${(avgPackage / 100000).toFixed(1)} LPA`
    },
    highestPackage: {
      amount: highestPackage,
      formatted: `₹${(highestPackage / 100000).toFixed(1)} LPA`
    },
    placementRate,
    topRecruiters: getTopRecruiters(isTopTier),
    placementYear: 2024
  };
};

const getTopRecruiters = (isTopTier) => {
  const topTierRecruiters = ['Microsoft', 'Google', 'Amazon', 'Goldman Sachs', 'Morgan Stanley', 'Flipkart', 'Uber', 'Netflix'];
  const regularRecruiters = ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'Capgemini', 'HCL', 'Tech Mahindra'];

  if (isTopTier) {
    return [...topTierRecruiters.slice(0, 4), ...regularRecruiters.slice(0, 4)];
  }
  return regularRecruiters.slice(0, 6);
};

const getStandardFacilities = () => {
  return ['Library', 'Hostels', 'Sports Complex', 'Cafeteria', 'Computer Labs', 'Wi-Fi Campus', 'Auditorium', 'Medical Center'];
};

const getAccreditation = (name) => {
  const isTopTier = name.includes('COEP') || name.includes('VJTI');
  return [
    { body: 'NBA', grade: isTopTier ? 'A+' : 'A', year: 2023 },
    { body: 'NAAC', grade: isTopTier ? 'A++' : 'A+', year: 2022 }
  ];
};

const generateRanking = () => {
  return {
    nirf: Math.floor(Math.random() * 100) + 50,
    overall: Math.floor(Math.random() * 50) + 20,
    engineering: Math.floor(Math.random() * 40) + 15
  };
};

const generateContact = (name, location) => {
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  return {
    website: `https://www.${domain}.ac.in`,
    email: `info@${domain}.ac.in`,
    phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    address: `${location}, Maharashtra`
  };
};

const generateSeats = (branchName) => {
  const seatMap = {
    'Computer Engineering': 120,
    'Computer Science and Engineering': 120,
    'Information Technology': 60,
    'Electronics and Telecommunication': 120,
    'Mechanical Engineering': 120,
    'Civil Engineering': 60,
    'Electrical Engineering': 60
  };
  return seatMap[branchName] || 60;
};

const isFeaturedCollege = (name) => {
  const featuredNames = ['COEP', 'VJTI', 'College of Engineering Pune', 'Veermata Jijabai', 'Government College of Engineering, Aurangabad'];
  return featuredNames.some(featured => name.includes(featured));
};

// Fallback data in case CSV parsing fails
const fallbackCollegeData = [
  {
    name: "College of Engineering Pune (COEP)",
    location: "Pune, Maharashtra",
    city: "Pune",
    state: "Maharashtra",
    type: "Government",
    establishedYear: 1854,
    courses: [
      { name: "Computer Engineering", duration: "4 years", seats: 120, cutoff: { general: 99.8, obc: 99.2, sc: 97.5, st: 94.2, tfws: 99.9 } },
      { name: "Information Technology", duration: "4 years", seats: 60, cutoff: { general: 99.6, obc: 98.9, sc: 96.8, st: 93.5, tfws: 99.8 } },
      { name: "Electronics & Telecommunication", duration: "4 years", seats: 120, cutoff: { general: 99.2, obc: 98.2, sc: 94.5, st: 91.8 } },
      { name: "Mechanical Engineering", duration: "4 years", seats: 180, cutoff: { general: 98.5, obc: 97.2, sc: 92.5, st: 89.2 } },
      { name: "Civil Engineering", duration: "4 years", seats: 120, cutoff: { general: 97.8, obc: 96.5, sc: 90.2, st: 87.5 } }
    ],
    cutoff: { general: 99.5, obc: 98.8, sc: 95.2, st: 93.5, ews: 99.0 },
    fees: { annual: 100000, currency: "INR", formatted: "₹1,00,000/year" },
    placements: {
      averagePackage: { amount: 850000, formatted: "₹8.5 LPA" },
      highestPackage: { amount: 4200000, formatted: "₹42 LPA" },
      placementRate: 95,
      topRecruiters: ["Microsoft", "Amazon", "Google", "Infosys", "TCS", "Wipro", "L&T", "Bajaj Auto"],
      placementYear: 2024
    },
    facilities: ["Library", "Hostels", "Sports Complex", "Cafeteria", "Medical Center", "Wi-Fi Campus"],
    accreditation: [
      { body: "NBA", grade: "A+", year: 2023 },
      { body: "NAAC", grade: "A++", year: 2022 }
    ],
    ranking: { nirf: 45, overall: 12, engineering: 8 },
    contact: {
      website: "https://www.coep.org.in",
      email: "info@coep.org.in",
      phone: "+91-20-25507001",
      address: "Wellesley Road, Shivajinagar, Pune - 411005"
    },
    featured: true
  },
  {
    name: "Veermata Jijabai Technological Institute (VJTI)",
    location: "Mumbai, Maharashtra",
    city: "Mumbai",
    state: "Maharashtra",
    type: "Government",
    establishedYear: 1887,
    courses: [
      { name: "Computer Engineering", duration: "4 years", seats: 120, cutoff: { general: 99.7, obc: 99.0, sc: 97.2, st: 93.8, tfws: 99.9 } },
      { name: "Information Technology", duration: "4 years", seats: 60, cutoff: { general: 99.5, obc: 98.7, sc: 96.5, st: 93.0 } },
      { name: "Electronics Engineering", duration: "4 years", seats: 120, cutoff: { general: 98.9, obc: 97.8, sc: 93.8, st: 90.5 } },
      { name: "Civil Engineering", duration: "4 years", seats: 120, cutoff: { general: 97.2, obc: 95.8, sc: 89.5, st: 86.2 } }
    ],
    cutoff: { general: 99.3, obc: 98.5, sc: 94.8, st: 92.0, ews: 98.8 },
    fees: { annual: 95000, currency: "INR", formatted: "₹95,000/year" },
    placements: {
      averagePackage: { amount: 920000, formatted: "₹9.2 LPA" },
      highestPackage: { amount: 4500000, formatted: "₹45 LPA" },
      placementRate: 96,
      topRecruiters: ["Goldman Sachs", "Morgan Stanley", "Flipkart", "Wipro", "Cognizant", "Accenture", "Capgemini"],
      placementYear: 2024
    },
    facilities: ["Central Library", "Boys Hostel", "Girls Hostel", "Gymnasium", "Auditorium", "Computer Center"],
    accreditation: [
      { body: "NBA", grade: "A+", year: 2023 },
      { body: "NAAC", grade: "A+", year: 2022 }
    ],
    ranking: { nirf: 52, overall: 15, engineering: 12 },
    contact: {
      website: "https://www.vjti.ac.in",
      email: "principal@vjti.org.in",
      phone: "+91-22-24145616",
      address: "H.R. Mahajani Road, Matunga, Mumbai - 400019"
    },
    featured: true
  },
  {
    name: "Government College of Engineering, Aurangabad",
    location: "Aurangabad, Maharashtra",
    city: "Aurangabad",
    state: "Maharashtra",
    type: "Government",
    establishedYear: 1960,
    courses: [
      { name: "Computer Science & Engineering", duration: "4 years", seats: 120, cutoff: { general: 97.5, obc: 96.2, sc: 90.5, st: 88.0, ews: 97.0 } },
      { name: "Mechanical Engineering", duration: "4 years", seats: 120, cutoff: { general: 94.2, obc: 92.5, sc: 85.8, st: 82.5 } },
      { name: "Civil Engineering", duration: "4 years", seats: 60, cutoff: { general: 92.8, obc: 90.5, sc: 83.2, st: 80.2 } }
    ],
    cutoff: { general: 97.5, obc: 96.2, sc: 90.5, st: 88.0, ews: 97.0 },
    fees: { annual: 85000, currency: "INR", formatted: "₹85,000/year" },
    placements: {
      averagePackage: { amount: 650000, formatted: "₹6.5 LPA" },
      highestPackage: { amount: 2800000, formatted: "₹28 LPA" },
      placementRate: 88,
      topRecruiters: ["Infosys", "TCS", "Wipro", "Tech Mahindra", "Capgemini", "L&T", "Bajaj Auto"],
      placementYear: 2024
    },
    facilities: ["Library", "Hostels", "Canteen", "Sports Ground", "Computer Lab", "Workshop"],
    accreditation: [
      { body: "NBA", grade: "A", year: 2023 }
    ],
    ranking: { nirf: 85, overall: 45, engineering: 35 },
    contact: {
      website: "https://www.geca.ac.in",
      email: "principal@geca.ac.in",
      phone: "+91-240-2403501",
      address: "Station Road, Aurangabad - 431005"
    },
    featured: false
  }
];

export const seedColleges = async () => {
  try {
    console.log('🔄 Starting college seeding process...');

    // Clear existing colleges
    await College.deleteMany({});
    console.log('🗑️  Cleared existing colleges');

    // Parse real CSV data
    console.log('📊 Parsing MHT-CET 2025 CSV data...');
    const collegeData = parseCSVData();
    console.log(`📋 Parsed ${collegeData.length} colleges from CSV`);

    // Insert new college data
    const colleges = await College.insertMany(collegeData);
    console.log(`🏛️  Seeded ${colleges.length} colleges successfully`);

    // Log some statistics
    const govColleges = colleges.filter(c => c.type === 'Government').length;
    const privateColleges = colleges.filter(c => c.type === 'Private').length;
    const featuredColleges = colleges.filter(c => c.featured).length;

    console.log(`📈 Statistics:`);
    console.log(`   - Government Colleges: ${govColleges}`);
    console.log(`   - Private Colleges: ${privateColleges}`);
    console.log(`   - Featured Colleges: ${featuredColleges}`);

    return colleges;
  } catch (error) {
    console.error('❌ Error seeding colleges:', error);
    throw error;
  }
};

export default parseCSVData;