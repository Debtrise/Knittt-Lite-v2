const fs = require('fs');

// Fresh token from login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxNTY5MjgzLCJleHAiOjE3NTE2NTU2ODN9.LDCHD0hqxLy0Qj3J6L0GzY7-bvokGVB0mQWXNvFafYQ';

console.log('🧪 Quick Photo Upload Test');
console.log('=========================');

// Test with curl since Node.js fetch FormData is tricky
const { exec } = require('child_process');

const testImagePath = './loading-icon.png';

if (!fs.existsSync(testImagePath)) {
  console.log('❌ Test image not found at', testImagePath);
  process.exit(1);
}

console.log('✅ Test image found:', testImagePath);

const curlCommand = `curl -X POST http://34.122.156.88:3001/api/sales-rep-photos/upload \\
  -H "Authorization: Bearer ${token}" \\
  -F "photo=@${testImagePath}" \\
  -F "repEmail=test@example.com" \\
  -F "repName=Test Agent"`;

console.log('📤 Uploading photo with curl...');
console.log('Command:', curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Upload error:', error.message);
    return;
  }
  if (stderr) {
    console.log('⚠️ Upload stderr:', stderr);
  }
  
  console.log('📡 Upload Response:');
  console.log(stdout);
  
  // Now test getting photos
  const getCommand = `curl -H "Authorization: Bearer ${token}" http://34.122.156.88:3001/api/sales-rep-photos`;
  
  console.log('\n🔍 Checking photos list...');
  exec(getCommand, (error2, stdout2, stderr2) => {
    if (error2) {
      console.log('❌ Get error:', error2.message);
      return;
    }
    
    console.log('📡 Photos List Response:');
    console.log(stdout2);
    
    try {
      const data = JSON.parse(stdout2);
      if (data.assets && data.assets.length > 0) {
        console.log('\n🎉 SUCCESS! Found', data.assets.length, 'photo(s)');
        data.assets.forEach((photo, i) => {
          console.log(`📷 Photo ${i+1}: ${photo.repEmail} - ${photo.repName || 'No name'}`);
        });
      } else {
        console.log('\n⚠️ Still no photos found');
      }
    } catch (parseError) {
      console.log('❌ Failed to parse response:', parseError.message);
    }
  });
}); 