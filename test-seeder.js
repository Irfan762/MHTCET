// Test script to verify CSV parsing works
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test CSV parsing function
const testCSVParsing = () => {
  try {
    console.log('🔄 Testing CSV Parsing...');
    
    const csvPath = path.join(__dirname, 'maharashtra_cap_round_all_2025.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found at:', csvPath);
      return;
    }
    
    console.log('📂 Reading CSV file from:', csvPath);
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    
    if (lines.length < 2) {
      console.log('❌ CSV file appears to be empty or invalid');
      return;
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 CSV Headers:', headers);
    
    // Parse first few data lines
    console.log('\n📄 Sample Data:');
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      const line = lines[i].trim();
      const values = parseCSVLine(line);
      
      console.log(`\nLine ${i}:`);
      console.log(`  College ID: ${values[0]}`);
      console.log(`  College Name: ${values[1]?.replace(/"/g, '')}`);
      console.log(`  Branch: ${values[3]?.replace(/"/g, '')}`);
      console.log(`  General Cutoff: ${values[5]}`);
      console.log(`  OBC Cutoff: ${values[6]}`);
    }
    
    // Count unique colleges
    const collegeIds = new Set();
    const collegeNames = new Set();
    
    for (let i = 1; i < Math.min(1000, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length > 1) {
        collegeIds.add(values[0]);
        collegeNames.add(values[1]?.replace(/"/g, ''));
      }
    }
    
    console.log(`\n📊 Statistics (first 1000 lines):`);
    console.log(`  Unique College IDs: ${collegeIds.size}`);
    console.log(`  Unique College Names: ${collegeNames.size}`);
    
    console.log('\n🏛️ Sample College Names:');
    Array.from(collegeNames).slice(0, 10).forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    console.log('\n✅ CSV parsing test completed successfully!');
    
  } catch (error) {
    console.error('❌ CSV parsing test failed:', error);
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

testCSVParsing();