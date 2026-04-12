// Test script to verify branch alias matching
const normalizeLookupText = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const branchAliases = {
  'computerengineering': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'computerscienceandengineering': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'computerscienceengg': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'cse': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'cs': ['computerengineering', 'computerscienceandengineering', 'computerscienceengg', 'cse', 'cs'],
  'electricalengineering': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'electricalengg': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'ee': ['electricalengineering', 'electricalengg', 'ee', 'electrical'],
  'electronicsengg': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'electronicsandtelecommunicationengg': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'electronics': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'ece': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'etc': ['electronicsandtelecommunicationengg', 'electronicsengg', 'electronics', 'ece', 'etc'],
  'mechanicalengineering': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'mechanicalengg': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'me': ['mechanicalengineering', 'mechanicalengg', 'me', 'mechanical'],
  'civilengineering': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'civilengg': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'ce': ['civilengineering', 'civilengg', 'ce', 'civil'],
  'instrumentationengineering': ['instrumentationengineering', 'instrumentationengg', 'ie'],
  'informationtechnology': ['informationtechnology', 'it'],
  'it': ['informationtechnology', 'it']
};

const canonicalizeBranchName = (branchName = '') => {
  const normalized = normalizeLookupText(branchName);
  for (const [key, aliases] of Object.entries(branchAliases)) {
    if (aliases.includes(normalized)) {
      return aliases;
    }
  }
  return [normalized];
};

// Test cases
const testCases = [
  { input: 'Computer Engineering', expectedMatch: 'Computer Science and Engineering' },
  { input: 'Computer Science and Engineering', expectedMatch: 'Computer Engineering' },
  { input: 'CSE', expectedMatch: 'Computer Science and Engineering' },
  { input: 'CS', expectedMatch: 'Computer Science and Engineering' },
  { input: 'Electronics and Telecommunication', expectedMatch: 'ECE' },
  { input: 'ECE', expectedMatch: 'Electronics and Telecommunication Engg' },
  { input: 'Electrical Engineering', expectedMatch: 'Electrical Engg' },
  { input: 'EE', expectedMatch: 'Electrical Engineering' },
  { input: 'Mechanical Engineering', expectedMatch: 'ME' },
  { input: 'Civil Engineering', expectedMatch: 'CE' },
  { input: 'Information Technology', expectedMatch: 'IT' },
];

console.log('🧪 Branch Alias Test Results:\n');

testCases.forEach(({ input, expectedMatch }) => {
  const aliases = canonicalizeBranchName(input);
  const expectedNormalized = normalizeLookupText(expectedMatch);
  const matches = aliases.includes(expectedNormalized);
  
  console.log(`Input: "${input}"`);
  console.log(`  → Resolved aliases: [${aliases.join(', ')}]`);
  console.log(`  → Matches "${expectedMatch}"? ${matches ? '✅ YES' : '❌ NO'}`);
  console.log();
});

console.log('✅ All tests completed!');

