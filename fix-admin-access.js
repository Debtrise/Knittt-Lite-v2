#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Admin Access...\n');

// Create .env.local file
const envContent = `# Development Environment Variables
NEXT_PUBLIC_API_URL=http://34.122.156.88:3001/api
NEXT_PUBLIC_SMS_API_URL=http://34.122.156.88:3100

# Development Admin Access (only for development)
NEXT_PUBLIC_DEV_ADMIN_ACCESS=true
NEXT_PUBLIC_DEV_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI0dXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxNTYzODg2LCJleHAiOjE3NTE2NTAyODZ9.PwbgwJX2TGLL9lIeGzQo77AA1wE5lw6atd3GTQsYWVg
`;

try {
  // Write .env.local file
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file with admin access settings');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Refresh your browser');
  console.log('3. You should now have admin access!');
  console.log('\n💡 Alternative: Visit the users page and click the red "Quick Admin Login" button');
  
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  
  console.log('\n🔄 Manual alternative:');
  console.log('1. Create a file named ".env.local" in your project root');
  console.log('2. Copy the content from "env.local.dev" to ".env.local"');
  console.log('3. Restart your development server');
}

console.log('\n📋 All available solutions:');
console.log('• API transformation (automatic)');
console.log('• Quick Admin button (red button on access denied page)');
console.log('• Environment auto-login (restart server after running this script)');
console.log('• Browser console fix (if you prefer that method)'); 