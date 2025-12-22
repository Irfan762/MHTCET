import College from '../models/College.js';

const collegeData = [
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
    // Clear existing colleges
    await College.deleteMany({});
    console.log('🗑️  Cleared existing colleges');

    // Insert new college data
    const colleges = await College.insertMany(collegeData);
    console.log(`🏛️  Seeded ${colleges.length} colleges successfully`);

    return colleges;
  } catch (error) {
    console.error('❌ Error seeding colleges:', error);
    throw error;
  }
};

export default collegeData;