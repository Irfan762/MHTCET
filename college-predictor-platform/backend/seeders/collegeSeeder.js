import College from '../models/College.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read and parse the real MHT-CET CSV data
const parseCSVData = () => {
  try {
    const csvPath = path.join(__dirname, '../../../maharashtra_cap_round_all_2025.csv');
    
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
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 CSV Headers:', headers.slice(0, 10)); // Show first 10 headers
    
    const colleges = new Map();
    let processedLines = 0;
    let skippedLines = 0;
    
    // Process each line of CSV data (process more lines for production)
    for (let i = 1; i < Math.min(lines.length, 5000); i++) { // Increased to 5000 lines
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
        const collegeId = values[0]?.trim();
        const collegeName = values[1]?.replace(/"/g, '').trim();
        const collegeCode = values[2]?.trim();
        const branchName = values[3]?.replace(/"/g, '').trim();
        const branchCode = values[4]?.trim();
        
        // Parse cutoffs with better error handling - handle empty strings
        const generalCutoff = values[5] && values[5].trim() !== '' ? parseFloat(values[5]) : null;
        const obcCutoff = values[6] && values[6].trim() !== '' ? parseFloat(values[6]) : null;
        const scCutoff = values[7] && values[7].trim() !== '' ? parseFloat(values[7]) : null;
        const stCutoff = values[8] && values[8].trim() !== '' ? parseFloat(values[8]) : null;
        const ewsCutoff = values[9] && values[9].trim() !== '' ? parseFloat(values[9]) : null;
        const vjntCutoff = values[10] && values[10].trim() !== '' ? parseFloat(values[10]) : null;
        const sbcCutoff = values[11] && values[11].trim() !== '' ? parseFloat(values[11]) : null;
        
        // Skip if essential data is missing
        if (!collegeId || !collegeName || !branchName) {
          skippedLines++;
          continue;
        }
        
        const location = extractLocationFromName(collegeName);
        const collegeType = determineCollegeType(collegeName);
        
        const collegeKey = collegeName; // Use college name as key instead of ID
        
        if (!colleges.has(collegeKey)) {
          colleges.set(collegeKey, {
            name: collegeName,
            location: location + ', Maharashtra',
            city: location,
            state: 'Maharashtra',
            type: collegeType,
            establishedYear: getEstablishedYear(collegeName),
            courses: [],
            cutoff: {
              general: generalCutoff,
              obc: obcCutoff,
              sc: scCutoff,
              st: stCutoff,
              ews: ewsCutoff,
              vjnt: vjntCutoff,
              sbc: sbcCutoff
            },
            fees: generateFees(collegeType),
            placements: generatePlacements(collegeName),
            facilities: getStandardFacilities(),
            accreditation: getAccreditation(collegeName),
            ranking: generateRanking(),
            contact: generateContact(collegeName, location),
            featured: isFeaturedCollege(collegeName)
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
            cutoff: {
              general: generalCutoff,
              obc: obcCutoff,
              sc: scCutoff,
              st: stCutoff,
              ews: ewsCutoff,
              vjnt: vjntCutoff,
              sbc: sbcCutoff
            }
          });
        }
        
        // Update college overall cutoff to be the best among all branches
        updateCollegeCutoffs(college, {
          general: generalCutoff,
          obc: obcCutoff,
          sc: scCutoff,
          st: stCutoff,
          ews: ewsCutoff,
          vjnt: vjntCutoff,
          sbc: sbcCutoff
        });
        
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

// Helper function to determine college type from name
const determineCollegeType = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('government') || lowerName.includes('govt')) {
    return 'Government';
  } else if (lowerName.includes('autonomous')) {
    return 'Autonomous';
  } else if (lowerName.includes('deemed') || lowerName.includes('university')) {
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
  const locations = ['Pune', 'Mumbai', 'Nagpur', 'Aurangabad', 'Nashik', 'Kolhapur', 'Amravati', 'Sangli', 'Yavatmal', 'Akola', 'Pusad', 'Shegaon'];
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
      { name: "Computer Engineering", duration: "4 years", seats: 120 },
      { name: "Information Technology", duration: "4 years", seats: 60 },
      { name: "Electronics & Telecommunication", duration: "4 years", seats: 120 },
      { name: "Mechanical Engineering", duration: "4 years", seats: 180 },
      { name: "Civil Engineering", duration: "4 years", seats: 120 },
      { name: "Electrical Engineering", duration: "4 years", seats: 120 }
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
      { name: "Computer Engineering", duration: "4 years", seats: 120 },
      { name: "Information Technology", duration: "4 years", seats: 60 },
      { name: "Electronics Engineering", duration: "4 years", seats: 120 },
      { name: "Civil Engineering", duration: "4 years", seats: 120 },
      { name: "Mechanical Engineering", duration: "4 years", seats: 120 },
      { name: "Electrical Engineering", duration: "4 years", seats: 60 }
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
      { name: "Computer Science & Engineering", duration: "4 years", seats: 120 },
      { name: "Mechanical Engineering", duration: "4 years", seats: 120 },
      { name: "Civil Engineering", duration: "4 years", seats: 60 },
      { name: "Electrical Engineering", duration: "4 years", seats: 60 },
      { name: "Electronics & Telecommunication", duration: "4 years", seats: 60 }
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
  },
  {
    name: "Walchand College of Engineering, Sangli",
    location: "Sangli, Maharashtra",
    city: "Sangli",
    state: "Maharashtra",
    type: "Government",
    establishedYear: 1947,
    courses: [
      { name: "Computer Science & Engineering", duration: "4 years", seats: 120 },
      { name: "Electronics Engineering", duration: "4 years", seats: 60 },
      { name: "Mechanical Engineering", duration: "4 years", seats: 120 },
      { name: "Civil Engineering", duration: "4 years", seats: 60 }
    ],
    cutoff: { general: 96.8, obc: 95.5, sc: 89.2, st: 86.5, ews: 96.2 },
    fees: { annual: 80000, currency: "INR", formatted: "₹80,000/year" },
    placements: {
      averagePackage: { amount: 680000, formatted: "₹6.8 LPA" },
      highestPackage: { amount: 3200000, formatted: "₹32 LPA" },
      placementRate: 90,
      topRecruiters: ["Accenture", "Infosys", "TCS", "L&T", "Persistent", "Cognizant", "Wipro"],
      placementYear: 2024
    },
    facilities: ["Central Library", "Hostels", "Cafeteria", "Playground", "Labs", "Auditorium"],
    accreditation: [
      { body: "NBA", grade: "A", year: 2022 }
    ],
    ranking: { nirf: 95, overall: 55, engineering: 42 },
    contact: {
      website: "https://www.walchandsangli.ac.in",
      email: "principal@walchandsangli.ac.in",
      phone: "+91-233-2300394",
      address: "Vishrambag, Sangli - 416415"
    },
    featured: false
  },
  {
    name: "Government College of Engineering, Nagpur",
    location: "Nagpur, Maharashtra",
    city: "Nagpur",
    state: "Maharashtra",
    type: "Government",
    establishedYear: 1951,
    courses: [
      { name: "Computer Science & Engineering", duration: "4 years", seats: 120 },
      { name: "Information Technology", duration: "4 years", seats: 60 },
      { name: "Electronics & Communication", duration: "4 years", seats: 120 },
      { name: "Mechanical Engineering", duration: "4 years", seats: 120 },
      { name: "Civil Engineering", duration: "4 years", seats: 60 }
    ],
    cutoff: { general: 96.2, obc: 94.8, sc: 88.5, st: 85.2, ews: 95.8 },
    fees: { annual: 82000, currency: "INR", formatted: "₹82,000/year" },
    placements: {
      averagePackage: { amount: 620000, formatted: "₹6.2 LPA" },
      highestPackage: { amount: 2500000, formatted: "₹25 LPA" },
      placementRate: 85,
      topRecruiters: ["TCS", "Infosys", "Wipro", "Tech Mahindra", "HCL", "Cognizant"],
      placementYear: 2024
    },
    facilities: ["Library", "Hostels", "Canteen", "Sports Complex", "Computer Center"],
    accreditation: [
      { body: "NBA", grade: "A", year: 2023 }
    ],
    ranking: { nirf: 105, overall: 65, engineering: 48 },
    contact: {
      website: "https://www.gcoen.ac.in",
      email: "principal@gcoen.ac.in",
      phone: "+91-712-2801001",
      address: "Hingna Road, Nagpur - 440016"
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