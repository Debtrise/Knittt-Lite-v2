// Configuration for the dialplan API tests
module.exports = {
  // API base URL - change this to point to your actual API server
  apiUrl: 'http://34.122.156.88:3001/api',
  
  // Authentication token if needed
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NjAzMzEyNywiZXhwIjoxNzQ2MTE5NTI3fQ.26gVfL5PJjrQ6VnAp9mapjNvF5bHSV9QJaHxMSCTBmY',
  
  // Set to true to enable detailed logging
  debug: true,
  
  // Timeout in milliseconds for API requests
  timeout: 10000
}; 