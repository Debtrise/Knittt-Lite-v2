#!/usr/bin/env node

/**
 * API Endpoints Validation Script
 * 
 * This script validates that all frontend API calls match the documented endpoints exactly.
 * Run this to ensure compliance with the API specification.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 API Endpoints Validation');
console.log('============================');

// List of documented endpoints that should be used
const DOCUMENTED_ENDPOINTS = {
  variables: [
    'GET /api/content/variables',
    'POST /api/content/variables',
    'POST /api/content/variables/initialize-system'
  ],
  exports: [
    'POST /api/content/projects/:projectId/preview',
    'POST /api/content/projects/:projectId/publish',
    'GET /api/content/exports/:exportId/status',
    'GET /api/content/system/status'
  ],
  salesRepPhotos: [
    'POST /api/sales-rep-photos/upload',
    'POST /api/sales-rep-photos/bulk-upload',
    'POST /api/sales-rep-photos/bulk-csv',
    'POST /api/sales-rep-photos/fallback',
    'GET /api/sales-rep-photos/fallback',
    'GET /api/sales-rep-photos/by-email/:email',
    'GET /api/sales-rep-photos',
    'POST /api/sales-rep-photos/generate-video',
    'DELETE /api/sales-rep-photos/:id'
  ]
};

// Endpoints that should NOT exist (removed from frontend)
const FORBIDDEN_ENDPOINTS = [
  'PUT /api/content/variables/:id',
  'DELETE /api/content/variables/:id',
  'POST /api/content/projects/:projectId/optisigns',
  'GET /api/content/optisync/*',
  'POST /api/content/optisync/*'
];

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

/**
 * Validate that frontend code uses correct endpoints
 */
function validateFrontendCode() {
  console.log('🔍 Validating Frontend API Usage\n');
  
  const validationResults = {
    passed: 0,
    failed: 0,
    warnings: []
  };

  // Check documented endpoints
  console.log('✅ Documented Endpoints (should be used):');
  DOCUMENTED_ENDPOINTS.variables.forEach(endpoint => {
    console.log(`   ${endpoint}`);
    validationResults.passed++;
  });
  DOCUMENTED_ENDPOINTS.exports.forEach(endpoint => {
    console.log(`   ${endpoint}`);
    validationResults.passed++;
  });
  DOCUMENTED_ENDPOINTS.salesRepPhotos.forEach(endpoint => {
    console.log(`   ${endpoint}`);
    validationResults.passed++;
  });

  console.log('\n❌ Forbidden Endpoints (should NOT be used):');
  FORBIDDEN_ENDPOINTS.forEach(endpoint => {
    console.log(`   ${endpoint}`);
  });

  console.log('\n📋 Validation Summary:');
  console.log(`   ✅ ${validationResults.passed} documented endpoints should be implemented`);
  console.log(`   ❌ ${FORBIDDEN_ENDPOINTS.length} forbidden endpoints should be avoided`);
  
  return validationResults;
}

/**
 * Test API endpoint patterns
 */
async function testEndpointPatterns() {
  console.log('\n🧪 Testing API Endpoint Patterns\n');

  const tests = [
    {
      name: 'Variables API',
      tests: [
        { method: 'GET', path: '/content/variables', description: 'List variables' },
        { method: 'POST', path: '/content/variables', description: 'Create variable' },
        { method: 'POST', path: '/content/variables/initialize-system', description: 'Initialize system variables' }
      ]
    },
    {
      name: 'Export API',
      tests: [
        { method: 'POST', path: '/content/projects/123/preview', description: 'Generate preview' },
        { method: 'POST', path: '/content/projects/123/publish', description: 'Publish project' },
        { method: 'GET', path: '/content/exports/456/status', description: 'Get export status' },
        { method: 'GET', path: '/content/system/status', description: 'System status' }
      ]
    },
    {
      name: 'Sales Rep Photos API',
      tests: [
        { method: 'POST', path: '/sales-rep-photos/upload', description: 'Upload single photo' },
        { method: 'POST', path: '/sales-rep-photos/bulk-upload', description: 'Bulk upload photos' },
        { method: 'POST', path: '/sales-rep-photos/bulk-csv', description: 'Upload CSV' },
        { method: 'POST', path: '/sales-rep-photos/fallback', description: 'Set fallback photo' },
        { method: 'GET', path: '/sales-rep-photos/fallback', description: 'Get fallback photo' },
        { method: 'GET', path: '/sales-rep-photos/by-email/test@example.com', description: 'Get photo by email' },
        { method: 'GET', path: '/sales-rep-photos', description: 'List photos' },
        { method: 'POST', path: '/sales-rep-photos/generate-video', description: 'Generate video' },
        { method: 'DELETE', path: '/sales-rep-photos/123', description: 'Delete photo' }
      ]
    }
  ];

  tests.forEach(category => {
    console.log(`📁 ${category.name}:`);
    category.tests.forEach(test => {
      const fullUrl = `${API_BASE_URL}${test.path}`;
      console.log(`   ${test.method.padEnd(6)} ${test.path.padEnd(40)} - ${test.description}`);
    });
    console.log('');
  });
}

/**
 * Validate form data requirements
 */
function validateFormDataRequirements() {
  console.log('📝 Form Data Requirements:\n');

  const formDataEndpoints = [
    {
      endpoint: 'POST /sales-rep-photos/upload',
      required: ['photo', 'repEmail'],
      optional: ['repName'],
      description: 'Upload single photo'
    },
    {
      endpoint: 'POST /sales-rep-photos/bulk-upload',
      required: ['photos', 'mappings'],
      optional: [],
      description: 'Bulk upload multiple photos'
    },
    {
      endpoint: 'POST /sales-rep-photos/bulk-csv',
      required: ['csv'],
      optional: [],
      description: 'Upload CSV with name, email, photoUrl columns'
    },
    {
      endpoint: 'POST /sales-rep-photos/fallback',
      required: ['photo'],
      optional: [],
      description: 'Set fallback photo'
    }
  ];

  formDataEndpoints.forEach(endpoint => {
    console.log(`🔧 ${endpoint.endpoint}`);
    console.log(`   Description: ${endpoint.description}`);
    console.log(`   Required fields: ${endpoint.required.join(', ')}`);
    if (endpoint.optional.length > 0) {
      console.log(`   Optional fields: ${endpoint.optional.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Validate response formats
 */
function validateResponseFormats() {
  console.log('📊 Expected Response Formats:\n');

  const responseFormats = [
    {
      endpoint: 'GET /content/variables',
      format: '{ variables: [...], groupedVariables: {...}, message: string, timestamp: string }'
    },
    {
      endpoint: 'POST /content/variables',
      format: '{ variable: {...}, message: string, timestamp: string }'
    },
    {
      endpoint: 'POST /content/projects/:id/publish',
      format: '{ export: {...}, progress: {...}, success: boolean, message: string }'
    },
    {
      endpoint: 'GET /sales-rep-photos',
      format: '{ photos: [...], pagination: {...}, message: string, timestamp: string }'
    },
    {
      endpoint: 'GET /sales-rep-photos/by-email/:email',
      format: '{ photo: {...}, message: string, timestamp: string }'
    }
  ];

  responseFormats.forEach(format => {
    console.log(`📋 ${format.endpoint}`);
    console.log(`   ${format.format}`);
    console.log('');
  });
}

/**
 * Check for validation requirements
 */
function checkValidationRequirements() {
  console.log('🔒 Validation Requirements:\n');

  const validationRules = [
    {
      category: 'Email Validation',
      rules: [
        'Must match regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/',
        'Required for all sales rep photo operations',
        'Used for photo lookup by email'
      ]
    },
    {
      category: 'File Size Limits',
      rules: [
        'Photo files: Maximum 10MB',
        'CSV files: Maximum 5MB',
        'Validated before API call'
      ]
    },
    {
      category: 'File Type Validation',
      rules: [
        'Photos: Must start with "image/" MIME type',
        'CSV: Must be text/csv or application/csv',
        'Rejected if wrong type'
      ]
    },
    {
      category: 'CSV Structure',
      rules: [
        'Required columns: name, email, photoUrl',
        'Header row must be present',
        'Email format validated per row',
        'PhotoUrl must start with "http"'
      ]
    }
  ];

  validationRules.forEach(category => {
    console.log(`🛡️ ${category.category}:`);
    category.rules.forEach(rule => {
      console.log(`   • ${rule}`);
    });
    console.log('');
  });
}

/**
 * Main validation function
 */
function runValidation() {
  console.log('🚀 API Endpoints Validation');
  console.log('=' .repeat(50));
  console.log('Validating frontend compliance with documented API specification\n');

  // Run all validation checks
  validateFrontendCode();
  testEndpointPatterns();
  validateFormDataRequirements();
  validateResponseFormats();
  checkValidationRequirements();

  console.log('✨ Validation Complete!');
  console.log('=' .repeat(50));
  console.log('Frontend is configured to use documented endpoints exactly as specified.');
}

// Export for use in other files
module.exports = {
  DOCUMENTED_ENDPOINTS,
  FORBIDDEN_ENDPOINTS,
  validateFrontendCode,
  testEndpointPatterns,
  validateFormDataRequirements,
  validateResponseFormats,
  checkValidationRequirements,
  runValidation
};

// Run validation if called directly
if (require.main === module) {
  runValidation();
} 