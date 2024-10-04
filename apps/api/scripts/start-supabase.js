console.log('Script is running');

require('dotenv').config();
const { execSync } = require('child_process');

console.log('Environment variables:');
console.log('PROJECT_ID:', process.env.PROJECT_ID);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_SECRET:', process.env.GOOGLE_SECRET);

try {
  // Construct the command with environment variables
  const command = `PROJECT_ID="${process.env.PROJECT_ID}" GOOGLE_CLIENT_ID="${process.env.GOOGLE_CLIENT_ID}" GOOGLE_SECRET="${process.env.GOOGLE_SECRET}" bunx supabase start`;
  
  console.log('Executing command:', command);
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start Supabase:', error);
  process.exit(1);
}