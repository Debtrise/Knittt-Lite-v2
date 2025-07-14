# OptiSigns API Backend Fixes Required

## Test Results Summary
- **Overall Success Rate**: 15% (3/20 endpoints working)
- **Test Date**: June 22, 2025
- **API Base URL**: `http://34.122.156.88:3001/api/optisigns`
- **Authentication**: Working with admin/admin123 JWT tokens

---

## 🔴 CRITICAL DATABASE SCHEMA ISSUES

### Missing Columns in Database Tables

#### 1. `OptisignsDisplay` Table
**Error**: `column OptisignsDisplay.tenant_id does not exist`

**Affected Endpoints**:
- `GET /displays` (all variants)
- `GET /analytics` (all variants)

**Fix Required**: Add `tenant_id` column to `OptisignsDisplay` table
```sql
ALTER TABLE OptisignsDisplay ADD COLUMN tenant_id VARCHAR(255);
```

#### 2. `OptisignsContent` Table  
**Error**: `column OptisignsContent.tenant_id does not exist`

**Affected Endpoints**:
- `GET /assets` (all variants)
- `GET /analytics` (content-related)

**Fix Required**: Add `tenant_id` column to `OptisignsContent` table
```sql
ALTER TABLE OptisignsContent ADD COLUMN tenant_id VARCHAR(255);
```

#### 3. Display Table (Schedules)
**Error**: `column display.is_online does not exist`

**Affected Endpoints**:
- `GET /schedules` (all variants)

**Fix Required**: Add `is_online` column to display table
```sql
ALTER TABLE display ADD COLUMN is_online BOOLEAN DEFAULT false;
```

#### 4. Generic Tenant ID Issues
**Error**: `column "tenant_id" does not exist`

**Affected Endpoints**:
- Various asset and content endpoints

**Fix Required**: Ensure all OptiSigns-related tables have proper `tenant_id` columns

---

## 🔴 OPTISIGNS API INTEGRATION ISSUES

### 1. Token Format Incompatibility
**Error**: `GraphQL Error: invalid algorithm`

**Affected Endpoints**:
- `POST /config/test`
- `PUT /config`

**Issue**: The internal JWT tokens are not compatible with OptiSigns GraphQL API
**Fix Required**: 
- Implement proper OptiSigns API token handling
- Don't send internal JWT tokens to OptiSigns API
- Use actual OptiSigns API tokens for external calls

### 2. OptiSigns API Connection Failures
**Error**: `Request failed with status code 400`

**Affected Endpoints**:
- `POST /displays/sync`
- `POST /assets/sync`
- `POST /playlists`
- `POST /tags`

**Issue**: OptiSigns API calls are failing with 400 errors
**Fix Required**:
- Verify OptiSigns API endpoint URLs
- Check request format and headers
- Implement proper error handling for OptiSigns API responses
- Add logging to debug OptiSigns API communication

### 3. Device Pairing Logic
**Error**: `This device is already paired`

**Affected Endpoints**:
- `POST /devices/pair`

**Issue**: Device pairing logic doesn't handle already-paired devices properly
**Fix Required**:
- Check device status before attempting to pair
- Return appropriate response for already-paired devices
- Implement device status management

---

## 🔴 ENDPOINT-SPECIFIC ISSUES

### 1. File Upload Endpoints
**Error**: `Invalid JSON response`

**Affected Endpoints**:
- `POST /assets/upload`
- `GET /content` (legacy)

**Issue**: Endpoints returning non-JSON responses
**Fix Required**:
- Ensure all API endpoints return valid JSON
- Fix content-type headers
- Implement proper error response formatting

### 2. Missing Endpoint Implementations
**Status**: Many endpoints from the API documentation are not implemented

**Missing Endpoints**:
- `POST /devices/{id}` (device updates)
- `POST /playlists/{id}/assets` (asset assignment)
- `POST /tags/{id}/apply` (tag application)
- `POST /schedules` (content scheduling)
- `DELETE /assets/{id}` (asset deletion)
- `DELETE /devices/{id}` (device deletion)

**Fix Required**: Implement missing endpoints per API documentation

---

## ✅ WORKING ENDPOINTS (Keep These)

1. **GET `/config`** - Configuration retrieval ✅
2. **GET `/playlists`** - Playlist listing ✅  
3. **GET `/tags`** - Tag listing ✅

---

## 🔧 IMPLEMENTATION PRIORITY

### High Priority (Blocking Core Functionality)
1. **Fix database schema issues** - Add missing `tenant_id` and `is_online` columns
2. **Fix OptiSigns API token handling** - Stop sending JWT tokens to OptiSigns
3. **Implement proper OptiSigns API communication** - Fix 400 errors

### Medium Priority (Feature Completion)
4. **Implement missing endpoints** - Complete API per documentation
5. **Fix file upload responses** - Return proper JSON
6. **Improve error handling** - Better error messages and logging

### Low Priority (Polish)
7. **Add comprehensive logging** - For debugging OptiSigns integration
8. **Implement rate limiting** - Per API documentation
9. **Add validation** - Request/response validation

---

## 🧪 TESTING RECOMMENDATIONS

### 1. Database Schema Testing
```sql
-- Test queries to verify schema fixes
SELECT tenant_id FROM OptisignsDisplay LIMIT 1;
SELECT tenant_id FROM OptisignsContent LIMIT 1;  
SELECT is_online FROM display LIMIT 1;
```

### 2. OptiSigns API Testing
- Test with real OptiSigns API credentials
- Verify GraphQL API communication
- Test device listing and content sync

### 3. Endpoint Testing
- Use the provided test suite: `test-optisigns-complete-api.js`
- Test with actual OptiSigns API token
- Verify all CRUD operations

---

## 📋 ACCEPTANCE CRITERIA

### Database Schema ✅ Complete When:
- All queries run without "column does not exist" errors
- Tenant isolation works properly
- Display status tracking functions

### OptiSigns Integration ✅ Complete When:
- Display sync returns actual displays (not empty arrays)
- Asset sync returns actual assets
- Content creation works end-to-end
- No "invalid algorithm" or "Request failed" errors

### API Completeness ✅ Complete When:
- Success rate > 80% in test suite
- All documented endpoints implemented
- File uploads return proper JSON responses
- CRUD operations work for all resources

---

## 🔍 TEST COMMAND

Run this command to test fixes:
```bash
node test-optisigns-complete-api.js
```

Target: **80%+ success rate** (16+ out of 20 endpoints working)

---

## 📞 SUPPORT

If you need clarification on any of these issues:
1. Run the test suite and share specific error messages
2. Check database logs for schema-related errors
3. Review OptiSigns API documentation for proper request formats
4. Test with actual OptiSigns credentials (not internal JWT tokens)

**Current Status**: 🔴 Critical issues blocking core functionality
**Target Status**: 🟢 Production-ready OptiSigns integration 