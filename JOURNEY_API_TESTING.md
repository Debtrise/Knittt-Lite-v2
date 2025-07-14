# Journey API Testing Scripts

This directory contains comprehensive testing scripts to verify the journey-related APIs are working correctly with the backend at `34.122.156.88:3001`.

## Test Scripts

### 1. Quick Test (`test-journey-quick.js`)
A fast test that covers the most critical journey endpoints:

```bash
node test-journey-quick.js
```

**Tests:**
- Authentication
- List journeys
- Create journey
- Get journey details
- Create journey step
- List journey steps
- Get journey statistics
- Delete journey step
- Delete journey

**Duration:** ~30 seconds

### 2. Comprehensive Test (`test-journey-apis.js`)
A thorough test suite that covers all journey-related functionality:

```bash
node test-journey-apis.js
```

**Test Categories:**
- **Authentication:** User login and token validation
- **Journey Management:** CRUD operations for journeys
- **Journey Steps:** Creating, updating, and managing journey steps
- **Lead Management:** Lead enrollment and journey tracking
- **Statistics:** Journey analytics and reporting
- **Enrollment:** Auto-enrollment and criteria-based enrollment
- **Advanced Features:** Reporting and analytics
- **Cleanup:** Removes test data

**Duration:** ~2-3 minutes

## Prerequisites

1. **Node.js** installed on your system
2. **Backend server** running at `34.122.156.88:3001`
3. **Admin credentials** (username: `admin`, password: `admin123`)

## Running the Tests

### Option 1: Quick Verification
```bash
# Run the quick test to verify basic functionality
./test-journey-quick.js
```

### Option 2: Full Test Suite
```bash
# Run comprehensive tests
./test-journey-apis.js
```

## Expected Output

### Successful Test Run
```
🚀 Quick Journey API Test
=========================

🧪 Authentication...
✅ Authentication - PASSED

🧪 List Journeys...
   Found 5 journeys
✅ List Journeys - PASSED

🧪 Create Journey...
   Created journey ID: 123
✅ Create Journey - PASSED

... (more tests)

✅ ALL TESTS PASSED!
Journey APIs are working correctly with backend at 34.122.156.88:3001
```

### Failed Test Example
```
🧪 Authentication...
❌ Authentication - FAILED: Request failed with status code 401
   Status: 401
   Error: {
     "error": "Invalid credentials"
   }
```

## Test Coverage

The comprehensive test suite verifies:

### Core Journey APIs
- `GET /api/journeys` - List journeys
- `POST /api/journeys` - Create journey
- `GET /api/journeys/:id` - Get journey details
- `PUT /api/journeys/:id` - Update journey
- `DELETE /api/journeys/:id` - Delete journey

### Journey Steps APIs
- `GET /api/journeys/:id/steps` - List journey steps
- `POST /api/journeys/:id/steps` - Create journey step
- `PUT /api/journeys/:journeyId/steps/:stepId` - Update journey step
- `DELETE /api/journeys/:journeyId/steps/:stepId` - Delete journey step

### Lead Management APIs
- `GET /api/journeys/:id/leads` - Get journey leads
- `POST /api/journeys/:id/enroll` - Enroll leads in journey
- `POST /api/journeys/:id/enroll-by-criteria` - Auto-enroll leads
- `GET /api/leads/:id/journeys` - Get lead's journeys
- `PUT /api/leads/:leadId/journeys/:journeyId/status` - Update lead journey status
- `POST /api/leads/:leadId/journeys/:journeyId/execute` - Execute journey step

### Statistics APIs
- `GET /api/journeys/stats` - Get journey statistics
- `GET /api/journeys/:id/matching-stats` - Get journey matching stats
- `GET /api/stats/journeys/by-brand` - Get journey stats by brand
- `GET /api/stats/journeys/by-source` - Get journey stats by source
- `GET /api/executions/upcoming` - Get upcoming executions

### Reporting APIs
- `POST /api/reports/journey-analytics` - Generate journey analytics report
- `POST /api/reports/journey-overview` - Get journey overview
- `GET /api/journeys/:id/enrollment-stats` - Get journey enrollment stats

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend server is running at `34.122.156.88:3001`
   - Check network connectivity

2. **Authentication Failed**
   - Verify admin credentials are correct
   - Check if user account exists in the system

3. **API Endpoint Not Found**
   - Verify backend has the required endpoints implemented
   - Check API version compatibility

4. **Permission Denied**
   - Ensure the admin user has the required permissions
   - Check tenant configuration

### Debug Mode
Add debug logging by setting the environment variable:
```bash
DEBUG=1 node test-journey-apis.js
```

## Validation Checklist

After running the tests, verify:

- [ ] All authentication tests pass
- [ ] Journey CRUD operations work
- [ ] Journey steps can be created and managed
- [ ] Lead enrollment functions correctly
- [ ] Statistics endpoints return data
- [ ] No test data remains in the system (cleanup successful)

## Integration with Frontend

These tests verify the same API endpoints that the frontend journey builder uses:

- **Journey List Page:** `/journeys` uses `GET /api/journeys`
- **Journey Builder:** `/journeys/[id]` uses journey and step APIs
- **Lead Management:** `/journeys/[id]/leads` uses lead enrollment APIs
- **Statistics:** Dashboard uses statistics APIs

If these tests pass, the frontend journey builder should work correctly with the backend.

## Continuous Testing

Consider running these tests:
- Before deploying frontend changes
- After backend API updates
- As part of CI/CD pipeline
- During system health checks

## Support

If tests fail consistently:
1. Check backend logs for errors
2. Verify database connectivity
3. Ensure all required services are running
4. Check API documentation for any changes 