# Authentication Test Scripts Guide

This guide explains how to use the authentication test scripts to verify login functionality with the external IP `34.122.156.88:3001`.

## 📁 Available Scripts

### 1. `test-auth-simple.js` - Quick Authentication Test
A lightweight script for basic login testing.

**Features:**
- Tests basic server connectivity
- Tries multiple common credential combinations
- Validates JWT tokens with protected endpoints
- Tests invalid credentials (security check)
- Clear, readable output

**Usage:**
```bash
node test-auth-simple.js
```

### 2. `test-auth-comprehensive.js` - Complete Authentication Test Suite
A full-featured test suite covering all authentication scenarios.

**Features:**
- Complete connectivity testing
- Valid login attempts with multiple credentials
- Invalid login attempts (negative testing)
- JWT token validation and verification
- Invalid token handling tests
- User registration testing
- Session persistence testing
- Detailed reporting and statistics

**Usage:**
```bash
node test-auth-comprehensive.js

# With custom API URL
API_BASE_URL=http://localhost:3001/api node test-auth-comprehensive.js

# Show help
node test-auth-comprehensive.js --help
```

## 🔧 Configuration

Both scripts are pre-configured to use the external IP:

- **API Base URL**: `http://34.122.156.88:3001/api`
- **Login URL**: `http://34.122.156.88:3001/api/auth/login`
- **Register URL**: `http://34.122.156.88:3001/api/auth/register`

## 🔑 Test Credentials

The scripts test these credential combinations:

| Username | Password | Description |
|----------|----------|-------------|
| `admin` | `admin123` | Default admin credentials |
| `admin` | `admin` | Alternative admin credentials |
| `test` | `test123` | Test user credentials |
| `demo` | `demo123` | Demo user credentials |

## 📊 Output Examples

### Simple Test Success Output:
```
🔐 Simple Authentication Test
📡 Testing against: http://34.122.156.88:3001/api
🕒 Started at: 2024-12-20T10:30:00.000Z

🔍 Testing server connectivity...
✅ Server is reachable - Status: 200

🔍 Testing login with: admin / admin123
📍 URL: http://34.122.156.88:3001/api/auth/login
✅ SUCCESS! Login successful for admin
⏱️  Response time: 245ms
🔑 Token received: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
👤 User ID: 1
👤 Username: admin
🏢 Tenant ID: 1
🎭 Role: admin

🔍 Testing token with protected endpoint...
✅ Token validation successful - Status: 200
📊 Protected endpoint accessible

🎉 Authentication test PASSED for admin!

🚫 Testing invalid credentials (negative test)...
✅ GOOD: Invalid credentials correctly rejected (401)

============================================================
📋 Test Summary:
   Server: http://34.122.156.88:3001/api
   Authentication: ✅ PASSED
   Working Credentials: admin / admin123
   Token: eyJhbGciOiJIUzI1NiIsI...
   Completed: 2024-12-20T10:30:05.123Z
============================================================
```

### Comprehensive Test Report:
```
📋 Authentication Test Report

📊 Test Summary:
   Total Tests: 15
   ✅ Passed: 12
   ❌ Failed: 1
   ⏭️  Skipped: 2
   ⚠️  Unexpected Pass: 0
   📈 Success Rate: 92.3%

📋 Detailed Results:
   1. ✅ Connectivity
   2. ✅ Login - admin
   3. ❌ Login - test
   4. ✅ Invalid Login - Invalid username and password
   5. ✅ Token Validation
   6. ✅ Invalid Token - Malformed JWT token
   7. ⏭️  Registration
   8. ✅ Session Persistence

🔧 Configuration Used:
   API Base URL: http://34.122.156.88:3001/api
   Login URL: http://34.122.156.88:3001/api/auth/login
   Register URL: http://34.122.156.88:3001/api/auth/register
   Valid Token Found: Yes
   User Info: {
     "userId": 1,
     "username": "admin",
     "tenantId": "1",
     "role": "admin"
   }
```

## 🚨 Troubleshooting

### Connection Refused Error
```
❌ Cannot reach server: connect ECONNREFUSED 34.122.156.88:3001
```

**Possible Causes:**
1. **Server is down** - The backend server is not running
2. **Network issues** - Firewall or network connectivity problems
3. **Wrong port** - Server is running on a different port
4. **IP change** - The external IP has changed

**Solutions:**
1. Verify the server is running at `34.122.156.88:3001`
2. Check network connectivity: `ping 34.122.156.88`
3. Try alternative ports if available
4. Contact server administrator

### Authentication Failures
```
❌ FAILED! Login error for admin: Request failed with status code 401
```

**Possible Causes:**
1. **Wrong credentials** - Default credentials have been changed
2. **Server misconfiguration** - Authentication system not working properly
3. **Database issues** - User database is not accessible

**Solutions:**
1. Verify correct credentials with system administrator
2. Check server logs for authentication errors
3. Test with known working credentials

### Token Validation Failures
```
❌ Token validation failed: Request failed with status code 401
```

**Possible Causes:**
1. **Token expiration** - JWT tokens have expired
2. **Invalid token format** - Token corruption during transmission
3. **Server key mismatch** - JWT signing key has changed

**Solutions:**
1. Re-authenticate to get fresh token
2. Check token format and encoding
3. Verify server JWT configuration

## 🔒 Security Considerations

1. **Test Credentials**: These scripts use common test credentials. In production, use strong, unique passwords.

2. **Token Security**: Tokens are displayed in logs for debugging. In production, avoid logging sensitive authentication data.

3. **Network Security**: Tests are performed over HTTP. In production, use HTTPS for all authentication.

4. **Rate Limiting**: Multiple login attempts may trigger rate limiting. Add delays if needed.

## 📝 Customization

### Adding New Test Credentials
Edit the `CREDENTIALS` array in either script:

```javascript
const CREDENTIALS = [
  { username: 'admin', password: 'admin123' },
  { username: 'your_user', password: 'your_pass' },  // Add your credentials
  // ... existing credentials
];
```

### Changing API Endpoints
Modify the configuration section:

```javascript
const API_BASE_URL = 'http://your-server:port/api';
const LOGIN_URL = 'http://your-server:port/api/auth/login';
```

### Custom Environment Variables
Use environment variables for flexible configuration:

```bash
# Custom API URL
API_BASE_URL=http://localhost:3001/api node test-auth-comprehensive.js

# Custom timeout
TIMEOUT=30000 node test-auth-simple.js
```

## 🎯 Use Cases

### Development Testing
- Verify authentication works after code changes
- Test new credential combinations
- Validate token generation and validation

### Production Monitoring
- Health checks for authentication system
- Verify external API connectivity
- Monitor authentication response times

### Security Auditing
- Test invalid credential handling
- Verify proper error responses
- Check token security measures

### Debugging
- Diagnose authentication failures
- Verify server connectivity
- Test specific credential combinations

## 📞 Support

If you encounter issues with these test scripts:

1. **Check server status**: Ensure `34.122.156.88:3001` is running
2. **Verify credentials**: Confirm the correct username/password combinations
3. **Review logs**: Check both script output and server logs
4. **Network connectivity**: Test basic connectivity to the server
5. **Contact support**: Provide the test output for faster troubleshooting

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Compatible with**: Knittt Authentication System using external IP 34.122.156.88:3001 