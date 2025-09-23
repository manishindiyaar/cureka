/**
 * Authentication Testing Utilities
 *
 * Common utilities for testing authentication endpoints
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

/**
 * Make HTTP request to API
 */
function makeRequest(path, method = 'POST', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          };

          // Calculate response time from Date header
          if (res.headers.date) {
            const requestTime = Date.now();
            response.responseTime = requestTime - new Date(res.headers.date).getTime();
          }

          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Test assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Generate valid India phone number for testing
 */
function generateTestPhoneNumber() {
  // Generate random 10-digit number
  const number = Math.floor(1000000000 + Math.random() * 9000000000);
  return `+91${number}`;
}

/**
 * Generate invalid phone numbers for negative testing
 */
function generateInvalidPhoneNumbers() {
  return [
    '9876543210',           // Missing +91
    '+9198765',             // Too short
    '+9198765432101',       // Too long
    '+1101234567890',       // Wrong country code
    '+91',                  // Just country code
    '+91abcdefg',           // Non-numeric
    '',                     // Empty
    null,                   // Null
    undefined               // Undefined
  ];
}

/**
 * Generate invalid OTP codes for testing
 */
function generateInvalidOtpCodes() {
  return [
    '123',        // Too short
    '12345',      // Too long
    '12',         // Too short
    '123456',     // Too long
    'abcd',       // Non-numeric
    'ABCD',       // Non-numeric
    '12a4',       // Mixed
    '',           // Empty
    null,         // Null
    undefined     // Undefined
  ];
}

/**
 * Create test user data
 */
function createTestUserData() {
  return {
    phone: generateTestPhoneNumber(),
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`
  };
}

/**
 * Validate JWT token structure
 */
function validateJwtToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  // Basic structure validation
  try {
    parts.forEach(part => {
      Buffer.from(part, 'base64url').toString();
    });
  } catch (e) {
    throw new Error('Invalid JWT base64 encoding');
  }

  return true;
}

/**
 * Wait for specified milliseconds
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract test results
 */
function formatTestResults(results) {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    skipped: results.filter(r => r.skipped).length
  };

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${summary.total}`);
  console.log(`   ✅ Passed: ${summary.passed}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  console.log(`   ⏭️  Skipped: ${summary.skipped}`);

  return summary;
}

/**
 * Test helper function
 */
async function test(description, testFn, skip = false) {
  console.log(`\n📋 Testing: ${description}`);

  if (skip) {
    console.log('   ⏭️  Skipped');
    return { passed: false, skipped: true, description };
  }

  try {
    await testFn();
    console.log('   ✅ Passed');
    return { passed: true, skipped: false, description };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { passed: false, skipped: false, description, error };
  }
}

/**
 * Clean up test data
 */
async function cleanupTestUser(phone) {
  try {
    // Delete OTP records
    await makeRequest('/auth/patient/otp/delete', 'POST', { phone_number: phone });
    // Delete user records
    await makeRequest('/auth/patient/user/delete', 'POST', { phone_number: phone });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Check server health
 */
async function checkServerHealth() {
  try {
    const response = await makeRequest('/health', 'GET');
    return response.statusCode === 200;
  } catch (error) {
    return false;
  }
}

module.exports = {
  makeRequest,
  assert,
  generateTestPhoneNumber,
  generateInvalidPhoneNumbers,
  generateInvalidOtpCodes,
  createTestUserData,
  validateJwtToken,
  wait,
  formatTestResults,
  test,
  cleanupTestUser,
  checkServerHealth,
  API_HOST,
  API_PORT
};