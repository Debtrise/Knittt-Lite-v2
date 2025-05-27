# Mock API Backup

This directory contains the original mock API implementations that were used during development before switching to real data.

## Contents

- `recordings/` - Mock recordings API endpoints
- `elevenlabs/` - Mock Eleven Labs API endpoints

## Purpose

These files were backed up when switching from mock data to real API endpoints. They can be used as:

1. **Reference** - To understand the expected API structure and responses
2. **Fallback** - If real API endpoints are unavailable during development
3. **Testing** - For unit tests that don't require real API calls

## Original Configuration

The mock APIs were originally configured in `app/lib/api.ts` using the `localApi` instance:

```typescript
const localApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Real API Configuration

The application now uses real API endpoints at:
- Base URL: `http://34.122.156.88:3001/api`
- Recordings: `/recordings/*`
- Eleven Labs: `/elevenlabs/*`

## Restoration

To restore mock APIs (for development/testing):

1. Copy the directories back to `app/api/`
2. Update `app/lib/api.ts` to use `localApi` instead of `api` for recordings endpoints
3. Restart the development server

## Date Backed Up

Created: May 26, 2024 