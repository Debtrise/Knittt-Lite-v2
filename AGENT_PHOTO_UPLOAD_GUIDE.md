# Agent Photo Upload Test Scripts

This guide explains how to use the agent photo upload test scripts to login and test the upload functionality.

## Prerequisites

1. **Required dependencies** (already installed in package.json):
   - `axios` - for HTTP requests
   - `form-data` - for file uploads

2. **Test image**: Ensure you have `loading-icon.png` in the project root directory

3. **Server access**: The scripts connect to `http://34.122.156.88:3001/api`

## Available Scripts

### 1. Simple Agent Photo Test (`simple-agent-photo-test.js`)

**Basic usage:**
```bash
node simple-agent-photo-test.js
```

**Login only test:**
```bash
node simple-agent-photo-test.js --login-only
```

**What it does:**
- ✅ Authenticates with admin credentials
- ✅ Uploads a test agent photo
- ✅ Verifies the upload by retrieving the photo
- ✅ Provides detailed step-by-step output

**Test agent data:**
- Email: `test.agent@company.com`
- Name: `Test Agent`

### 2. Comprehensive Agent Photo Test (`test-agent-photo-upload.js`)

**Usage:**
```bash
node test-agent-photo-upload.js
```

**What it does:**
- ✅ Authenticates with admin credentials
- ✅ Tests single photo upload
- ✅ Tests duplicate upload prevention
- ✅ Tests photo replacement
- ✅ Tests bulk photo upload
- ✅ Tests photo retrieval
- ✅ Tests input validation
- ✅ Tests fallback photo functionality
- ✅ Provides comprehensive test summary

## Expected Output

### Successful Login:
```
🔐 STEP 1: Authenticating...
📍 Login URL: http://34.122.156.88:3001/api/login
👤 Username: admin
✅ Authentication successful!
🎫 JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
👤 User ID: 1
🏢 Tenant ID: N/A
🎭 Role: admin
```

### Successful Photo Upload:
```
📸 STEP 2: Uploading agent photo...
👤 Agent: Test Agent (test.agent@company.com)
🖼️ Image: ./loading-icon.png
📏 Image size: 12.34 KB
📤 Upload URL: http://34.122.156.88:3001/api/sales-rep-photos/upload
✅ Photo upload successful!
🆔 Photo ID: 1
📧 Agent Email: test.agent@company.com
👤 Agent Name: Test Agent
📁 File Name: sales-rep-test.agent_at_company.com.png
💾 File Size: 12632 bytes
🕒 Uploaded At: 2024-12-20T10:30:00.000Z
```

## API Endpoints Tested

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login` | POST | Authentication |
| `/api/sales-rep-photos/upload` | POST | Upload single photo |
| `/api/sales-rep-photos/bulk-upload` | POST | Upload multiple photos |
| `/api/sales-rep-photos` | GET | Get all photos |
| `/api/sales-rep-photos/by-email/{email}` | GET | Get photo by email |
| `/api/sales-rep-photos/fallback` | POST/GET | Fallback photo management |

## Configuration

Both scripts use the same configuration:

```javascript
const BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};
const TEST_IMAGE_PATH = './loading-icon.png';
```

## Error Handling

The scripts handle various error scenarios:

- **Authentication failures** - Invalid credentials
- **Missing files** - Test image not found
- **Duplicate uploads** - Photo already exists for email
- **Invalid data** - Malformed emails, missing required fields
- **Network errors** - Server unavailable

## Customization

To test with different data, modify these variables in the scripts:

```javascript
// In simple-agent-photo-test.js
const TEST_AGENT = {
  email: 'your.agent@company.com',
  name: 'Your Agent Name'
};

// In test-agent-photo-upload.js
const testAgents = [
  { email: 'agent1@company.com', name: 'Agent One' },
  { email: 'agent2@company.com', name: 'Agent Two' },
  // Add more agents as needed
];
```

## Troubleshooting

### Common Issues:

1. **"Test image not found"**
   - Ensure `loading-icon.png` exists in the project root
   - Update `TEST_IMAGE_PATH` if using a different image

2. **"Authentication failed"**
   - Verify server is running at `http://34.122.156.88:3001`
   - Check if login credentials are correct

3. **"Photo already exists"**
   - Normal behavior for duplicate prevention
   - Use different email or enable replace mode

4. **Network errors**
   - Check server availability
   - Verify firewall/network access

### Debug Mode:

For more verbose output, both scripts log full request/response data including:
- Request URLs
- Response status codes
- Complete response bodies
- Error details

## Module Usage

Both scripts can also be imported as modules:

```javascript
const { loginAndGetToken, uploadAgentPhoto } = require('./simple-agent-photo-test');

async function customTest() {
  const token = await loginAndGetToken();
  if (token) {
    await uploadAgentPhoto(token, 'custom@email.com', 'Custom Agent', './my-image.png');
  }
}
``` 