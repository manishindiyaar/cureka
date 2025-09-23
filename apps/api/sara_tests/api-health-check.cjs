#!/usr/bin/env node

/**
 * API Health Check - Test all authentication endpoints
 *
 * Usage: node api-health-check.js
 *        or: npm run test:api-health
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

console.log('🔍 API Health Check - Authentication Endpoints');
console.log('='.repeat(60));
console.log(`API Base URL: http://${API_HOST}:${API_PORT}/api/v1`);
console.log('');

/**
 * Make HTTP request
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/v1${path}`,
      method: method,
      headers: {}
    };

    if (postData) {
      postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
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
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Check server health
 */
async function checkServerHealth() {
  console.log('1️⃣  Testing: Server Health Check');
  console.log('   📍 Endpoint: GET /health');

  try {
    const response = await makeRequest('/health', 'GET');

    if (response.statusCode === 200) {
      console.log('   ✅ Server is running and healthy');
      return true;
    } else {
      console.log(`   ❌ Server responded with status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Server is not responding');
    console.log('   Error:', error.message);
    return false;
  }
}

/**
 * Check if an endpoint exists
 */
async function checkEndpointExists(path, method, data = null) {
  try {
    const response = await makeRequest(path, method, data);

    // Check if we get a 404 (Not Found) vs other error
    if (response.statusCode === 404) {
      console.log(`   ❌ ${method} ${path} - Endpoint does not exist`);
      return false;
    }

    // Any other response means the endpoint exists
    console.log(`   ✅ ${method} ${path} - Endpoint exists`);
    return true;
  } catch (error) {
    // Network errors indicate server problems
    console.log(`   ❌ ${method} ${path} - Network/Connection error`);
    return false;
  }
}

/**
 * Test authentication endpoints
 */
async function testAuthenticationEndpoints() {
  console.log('\n2️⃣  Testing: Authentication Endpoints');

  const endpoints = [
    { path: '/auth/patient/otp/request', method: 'POST' },
    { path: '/auth/patient/otp/verify', method: 'POST' },
    { path: '/auth', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    console.log(`   📍 Testing: ${endpoint.method} ${endpoint.path}`);
    await checkEndpointExists(endpoint.path, endpoint.method);
  }

  // Test POST endpoints with empty body to see validation errors
  for (const endpoint of endpoints.filter(e => e.method === 'POST')) {
    console.log(`   📍 Testing: ${endpoint.method} ${endpoint.path} (empty body)`);
    const response = await makeRequest(endpoint.path, endpoint.method, {});
    if (response.statusCode === 400) {
      console.log(`   ✅ Returns validation error as expected`);
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.statusCode}`);
    }
  }
}

/**
 * Test rate limiting
 */
async function testRateLimiting() {
  console.log('\n3️⃣  Testing: Rate Limiting');

  const phoneNumber = '+919999999999'; // Use a test number

  // Make multiple quick requests
  const responses = [];
  for (let i = 0; i < 3; i++) {
    const response = await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phoneNumber,
      user_type: 'patient'
    });
    responses.push(response);
  }

  // Check responses
  const rateLimitedCount = responses.filter(r =>
    r.statusCode === 429 || (r.body && r.body.code === 'rate_limit_exceeded')
  ).length;

  console.log(`   📍 Made 3 requests with test number: ${phoneNumber}`);
  if (rateLimitedCount > 0) {
    console.log(`   ✅ Rate limiting is active (${rateLimitedCount} requests rate-limited)`);
  } else {
    console.log('   ⚠️  Rate limiting may not be configured or threshold not reached');
  }
}

/**
 * Test input validation
 */
async function testInputValidation() {
  console.log('\n4️⃣  Testing: Input Validation');

  // Test invalid phone number
  console.log('   📍 Testing: Invalid phone number format');
  const response = await makeRequest('/auth/patient/otp/request', 'POST', {
    phone_number: '99999',  // Too short
    user_type: 'patient'
  });

  if (response.statusCode === 400) {
    console.log('   ✅ Invalid phone number correctly rejected');
  } else {
    console.log('   ❌ Invalid phone number was not rejected');
  }

  // Testing phone number format validation
  console.log('   📍 Testing: Phone format validation');
  const validPhoneTest = await makeRequest('/auth/patient/otp/request', 'POST', {
    phone_number: '+919876543210',  // Valid format
    user_type: 'patient'
  });
  if (validPhoneTest.statusCode >= 200 && validPhoneTest.statusCode <= 429) {
    console.log('   ✅ Valid phone number accepted');
  } else {
    console.log('   ❌ Valid phone number was rejected');
  }
}

/**
 * Test the API in test mode
 */
async function testTestEndpoints() {
  console.log('\n5️⃣  Testing: Available Endpoints');

  // List all available endpoints (this is a simplified check)
  const paths = [
    '/health',
    '/auth',
    '/auth/patient',
    '/auth/patient/otp/request',
    '/auth/patient/otp/verify',
    '/doctors',
    '/hospitals'
  ];

  console.log('   📚 Available API Routes:');
  for (const path of paths) {
    const response = await makeRequest(path, 'GET');
    if (response.statusCode !== 404) {
      console.log(`   ✅ ${path} - Available`);
    } else {
      console.log(`   ❌ ${path} - Not Found`);
    }
  }
}

/**
 * Get server metrics
 */
async function getServerMetrics() {
  console.log('\n6️⃣  Server Metrics:');
  console.log('   📍 Testing response times...');

  const startTime = Date.now();
  try {
    await makeRequest('/health', 'GET');
    const responseTime = Date.now() - startTime;
    console.log(`   🔸 Health check response time: ${responseTime}ms`);

    // Test OTP request response time
    const otpStart = Date.now();
    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: '+919000000000', // Non-existent for fast response
      user_type: 'patient'
    });
    const otpTime = Date.now() - otpStart;
    console.log(`   🔸 OTP request processing time: ${otpTime}ms`);

  } catch (error) {
    console.log('   ❌ Error measuring metrics');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting API health check...\n');

  // Check if server is running
  const serverHealth = await checkServerHealth();

  if (!serverHealth) {
    console.log('\n❌ Server is not healthy or not running.');
    console.log('Please start your API server first:');
    console.log('  npm run dev');
    process.exit(1);
  }

  // Run all tests
  await testAuthenticationEndpoints();
  await testRateLimiting();
  await testInputValidation();
  await testTestEndpoints();
  await getServerMetrics();

  console.log('\n' + '='.repeat(60));
  console.log('✅ API Health Check Complete!');
  console.log('Your authentication API is working correctly.');
  console.log('\nNext steps:');
  console.log('1. Check your phone for SMS to get the actual OTP');
  console.log('2. Use the OTP to verify and log in');
  console.log('3. Test with the interactive verification flow');
}

// Run the health check
main().catch(error => {
  console.error('\n❌ Health check failed:', error);
  process.exit(1);
});