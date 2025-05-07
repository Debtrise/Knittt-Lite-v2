const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const SMS_API_URL = 'http://34.122.156.88:3100';
const campaignId = 5; // Use the ID from the previous test

// Create a sample CSV file
const sampleCsv = 'name,phone,email\nJohn Doe,+1234567890,john@example.com\nJane Smith,+0987654321,jane@example.com';
fs.writeFileSync('test-contacts.csv', sampleCsv);

// Try different field names for file upload
async function testUpload(fieldName) {
  try {
    console.log(`Testing upload with field name: "${fieldName}"`);
    
    const formData = new FormData();
    formData.append(fieldName, fs.createReadStream('test-contacts.csv'));
    
    const response = await axios.post(
      `${SMS_API_URL}/campaigns/${campaignId}/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        }
      }
    );
    
    console.log('Success!');
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error with field "${fieldName}":`, 
      error.response?.status,
      error.response?.data || error.message);
    return false;
  }
}

// Try various common field names
async function runTests() {
  const fieldNames = ['file', 'csv', 'contacts', 'csvFile', 'contactsFile', 'upload', 'data'];
  
  for (const fieldName of fieldNames) {
    const success = await testUpload(fieldName);
    if (success) {
      console.log(`\n✅ Found working field name: "${fieldName}"`);
      break;
    }
  }
  
  // Clean up
  if (fs.existsSync('test-contacts.csv')) {
    fs.unlinkSync('test-contacts.csv');
  }
}

runTests(); 