# API Endpoints Update Summary

## Overview
This document summarizes the frontend updates to use the exact API endpoints as documented in your provided specifications. All API calls have been updated to match the documented endpoints exactly, with enhanced authentication and authorization features.

## Updated Endpoints

### Variables and Exporting API
- `GET /api/content/variables` - List user variables
- `POST /api/content/variables` - Create or update a variable
- `POST /api/content/variables/initialize-system` - Create built-in variables for new tenant
- `POST /api/content/projects/:projectId/preview` - Generate preview HTML page
- `POST /api/content/projects/:projectId/publish` - Export project and make it public
- `GET /api/content/exports/:exportId/status` - Check export processing status
- `GET /api/content/system/status` - Service health check

### Sales Rep Photos API (All with Authentication)
- `POST /api/sales-rep-photos/upload` - Upload single photo (with role-based access)
- `POST /api/sales-rep-photos/bulk-upload` - Bulk upload multiple photos (authenticated users)
- `POST /api/sales-rep-photos/bulk-csv` - Upload CSV with photos (authenticated users)
- `POST /api/sales-rep-photos/fallback` - Set/replace default fallback photo (admin only)
- `GET /api/sales-rep-photos/fallback` - Retrieve current fallback photo
- `GET /api/sales-rep-photos/by-email/:email` - Fetch photo by rep email
- `GET /api/sales-rep-photos` - List photos with pagination
- `POST /api/sales-rep-photos/generate-video` - Generate celebration video (authenticated users)
- `DELETE /api/sales-rep-photos/:id` - Delete photo by ID (authenticated users)
- `GET /api/sales-rep-photos/upload-history` - Get user's upload history (authenticated users)
- `GET /api/sales-rep-photos/usage-stats` - Get usage statistics (admin only)

## Authentication Enhancements

### Role-Based Access Control
- **Admin users**: Full access to all features including:
  - Setting/changing fallback photos
  - Viewing usage statistics
  - Managing all photos
  - Access to upload history
  
- **Authenticated users**: Access to:
  - Upload single/bulk photos
  - Generate celebration videos
  - View upload history
  - Delete their own photos
  
- **Unauthenticated users**: Read-only access to:
  - View existing photos
  - Look up photos by email

### Security Features
- **JWT Token Authentication**: All requests include Bearer token in Authorization header
- **Permission Validation**: Server-side role checking before API calls
- **User Context**: Requests include current user information where relevant
- **Error Handling**: Proper authentication error handling with user-friendly messages
- **Token Refresh**: Graceful handling of token expiration

### UI Enhancements
- **Role Indicators**: User role badges displayed in interface
- **Conditional Features**: UI elements shown/hidden based on user permissions
- **Authentication Prompts**: Clear login prompts for unauthenticated users
- **Upload History**: Authenticated users can view their upload activity
- **Usage Statistics**: Admin dashboard for system-wide analytics

## Files Updated

### API Configuration
- `app/lib/api.ts` - Enhanced with authentication headers and role-based access methods
- `app/services/contentApi.ts` - Updated to use correct endpoints with auth
- `app/services/exportApi.ts` - Updated publish methods with authentication

### UI Components
- `app/components/content-creator/SalesRepPhotosPanel.tsx` - Enhanced with:
  - Role-based UI features
  - Authentication checks
  - Upload history dialog
  - Usage statistics dialog (admin only)
  - Improved error handling

### Stores
- `app/store/contentStore.ts` - Already using correct authenticated methods

### Documentation
- `docs/API_ENDPOINTS_UPDATE_SUMMARY.md` - Comprehensive summary with auth details
- `examples/enhanced-publish-api-demo.ts` - Updated examples with authentication
- `tests/api-endpoints-validation.js` - Validation script for endpoint compliance

## Key Changes

### Authentication Infrastructure
- **Automatic Token Injection**: Axios interceptor adds Bearer token to all requests
- **Permission Helpers**: Utility functions for checking user roles and permissions
- **User Context Addition**: FormData requests include current user information
- **Enhanced Error Handling**: Specific handling for 401, 403, and other auth errors

### API Compliance
- All endpoints use exact documented paths
- Removed non-existent variable update/delete endpoints
- Updated publish methods to use `/publish` endpoint
- Maintained backward compatibility with legacy method names
- Added comprehensive validation and error handling

### User Experience
- Clear visual indicators of user authentication status
- Role-based feature availability
- Helpful error messages for authentication issues
- Upload history tracking for transparency
- Admin analytics for system monitoring

## Content Creator Integration

### Sales Rep Photo Elements
- Elements with `elementType: "sales_rep_photo"` automatically bind to `{rep_photo}` variable
- Frontend creates these elements when photos are dropped on canvas
- Variable binding ensures correct representative's image displays when deals are closed
- Authentication ensures only authorized users can upload/manage photos

### Variable System
- Secure variable creation and management with user context
- System variable initialization for new tenants
- Project publishing with proper authentication

## Validation and Testing

### Input Validation
- Email format validation for all photo operations
- File type and size validation (10MB limit for photos, 5MB for CSV)
- CSV structure validation with required columns: name, email, photoUrl
- Role permission validation before UI action availability

### Error Handling
- Comprehensive error messages for validation failures
- Authentication-specific error handling
- Network error resilience
- User-friendly error display

The frontend is now fully compliant with the documented API specification and includes robust authentication and authorization features, ready for secure backend integration. 