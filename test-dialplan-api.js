const { execSync } = require('child_process');
const path = require('path');

// Function to run the tests
function runTests() {
  console.log('Running Dialplan API Tests...');
  try {
    // Use node to execute the JavaScript test file
    const output = execSync('node tests/dialplan-api-test.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

// Execute the tests
runTests(); 