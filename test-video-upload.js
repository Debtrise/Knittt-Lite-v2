const fs = require('fs');
const path = require('path');

// Test the video upload API endpoint
async function testVideoUpload() {
  console.log('🎬 Testing Video Upload API...\n');

  try {
    // Create a mock video file (small test file)
    const mockVideoContent = 'mock video content for testing';
    const testVideoPath = path.join(__dirname, 'test-video.mp4');
    fs.writeFileSync(testVideoPath, mockVideoContent);

    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testVideoPath), 'test-video.mp4');
    formData.append('name', 'Test Video Upload');
    formData.append('tags', 'test,video,upload');

    // Make the request
    const response = await fetch('http://localhost:3000/api/content/assets/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Video upload successful!');
      console.log('Asset ID:', result.asset.id);
      console.log('Asset Name:', result.asset.name);
      console.log('Asset Type:', result.asset.assetType);
      console.log('File Size:', result.asset.fileSize);
      console.log('Public URL:', result.asset.publicUrl.substring(0, 50) + '...');
      console.log('Tags:', result.asset.tags);
    } else {
      console.log('❌ Video upload failed:', result.error);
    }

    // Clean up test file
    fs.unlinkSync(testVideoPath);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test getting assets
async function testGetAssets() {
  console.log('\n📚 Testing Get Assets API...\n');

  try {
    const response = await fetch('http://localhost:3000/api/content/assets');
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Get assets successful!');
      console.log('Total assets:', result.pagination.totalCount);
      console.log('Assets retrieved:', result.assets.length);
      
      if (result.assets.length > 0) {
        console.log('\nSample assets:');
        result.assets.slice(0, 3).forEach(asset => {
          console.log(`- ${asset.name} (${asset.assetType}) - ${asset.fileSize} bytes`);
        });
      }
    } else {
      console.log('❌ Get assets failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Video Upload API Tests\n');
  
  await testVideoUpload();
  await testGetAssets();
  
  console.log('\n✨ Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testVideoUpload, testGetAssets }; 