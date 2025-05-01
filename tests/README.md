# API Test Scripts

This directory contains test scripts for verifying the functionality of the API endpoints.

## Dialplan API Tests

### Overview
The `dialplan-api-test.js` script tests the dialplan-related API endpoints, allowing you to verify that the dialplan editor backend is working correctly.

### Requirements
- Node.js 18+
- npm or yarn

### Configuration
Before running the tests, you need to configure the API connection details in `app/utils/dialplanApiConfig.js`:

```js
module.exports = {
  // API base URL
  apiUrl: 'http://your-api-server:port/api',
  
  // Authentication token
  authToken: 'your-auth-token',
  
  // Enable detailed logging
  debug: true,
  
  // Timeout in milliseconds
  timeout: 10000
};
```

### Getting an Auth Token
You can use the `login-test.js` script in the root directory to get an authentication token:

```bash
node login-test.js
```

This will attempt to log in with the credentials provided in the script and display the auth token if successful.

### Running the Tests
To run the dialplan API tests:

```bash
node test-dialplan-api.js
```

### Test Features
The test script:

1. Tests the full lifecycle of dialplan management:
   - Creating projects
   - Updating projects
   - Managing contexts
   - Creating nodes 
   - Creating connections
   - Generating dialplans

2. Handles error conditions gracefully:
   - Falls back to mock data when endpoints are not available
   - Displays clear error messages for debugging
   - Continues testing even if some endpoints fail

### Test Results
A summary of the test results is available in `dialplan-api-test-summary.md` in the root directory.

## Adding New Tests
When adding new test scripts, follow these guidelines:

1. Use the existing pattern for safe API calls with mock data fallback
2. Include clear console output with section headers
3. Always clean up any test data created during the test
4. Handle authentication properly 