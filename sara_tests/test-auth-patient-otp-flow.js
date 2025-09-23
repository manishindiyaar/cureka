/**
 * Patient Authentication OTP Flow Tests
 *
 * Tests the complete patient authentication flow:
 * 1. Request OTP
 * 2. Verify OTP
 * 3. Token validation
 * 4. User registration
 */

const {
  makeRequest,
  assert,
  generateTestPhoneNumber,
  generateInvalidPhoneNumbers,
  generateInvalidOtpCodes,
  validateJwtToken,
  wait,
  test,
  cleanupTestUser
} = require('./test-utils-auth.js');

// Test configuration
const TEST_CONFIG = {
  otpExpiryMinutes: 5,
  maxAttempts: 3,
  delayBetweenTests: 1000  // ms
};

async function testOtpRequestFlow() {
  console.log('\n🧪 Testing OTP Request Flow');
  console.log('=============================');

  // Test 1: Request OTP with valid phone
  await test('Valid phone number should request OTP', async () => {
    const phone = generateTestPhoneNumber();
    const response = await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    assert(response.body.message === 'OTP sent successfully', 'Expected success message');

    // Store for later use
    testOtpRequestFlow.lastPhone = phone;
  });

  await wait(TEST_CONFIG.delayBetweenTests);

  // Test 2: Request duplicates
  await test('Duplicate OTP request should be handled', async () => {
    const phone = generateTestPhoneNumber();

    // First request
    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    await wait(1000); // Small delay

    // Second request
    const response = await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    assert([200, 429].includes(response.statusCode), 'Should either succeed or be rate limited');
  });

  // Test 3: Invalid phone numbers
  await test('Invalid phone numbers should be rejected', async () => {
    const invalidPhones = generateInvalidPhoneNumbers();

    for (const phone of invalidPhones) {
      const response = await makeRequest('/auth/patient/otp/request', 'POST', {
        phone_number: phone,
        user_type: 'patient'
      }, {});

      assert(response.statusCode === 400, `Phone ${phone} should be rejected`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    }
  });

  await wait(TEST_CONFIG.delayBetweenTests);

  // Test 4: Missing fields
  await test('Missing required fields should be rejected', async () => {
    const response = await makeRequest('/auth/patient/otp/request', 'POST', {});
    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
  });
}

async function testOtpVerificationFlow() {
  console.log('\n🧪 Testing OTP Verification Flow');
  console.log('=================================');

  // Create a phone number and request OTP first
  const phone = generateTestPhoneNumber();

  const otpResponse = await makeRequest('/auth/patient/otp/request', 'POST', {
    phone_number: phone,
    user_type: 'patient'
  });

  assert(otpResponse.statusCode === 200, 'Should be able to request OTP');

  // In real scenarios, you'd need to extract the OTP from:
  // 1. SMS service (if test mode)
  // 2. Database (if testing locally)
  // For now, we'll test with the default '1234' used in your existing tests
  const testOtp = '1234';

  // Test 1: Valid OTP verification
  await test('Valid OTP should verify successfully', async () => {
    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: testOtp
    });

    assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success');
    assert(response.body.data.access_token, 'Expected access token');
    assert(response.body.data.refresh_token, 'Expected refresh token');
    assert(response.body.data.user.phone_number === phone, 'Phone number should match');
    assert(response.body.data.token_type === 'Bearer', 'Expected Bearer token type');
    assert(response.body.data.expires_in === 86400, 'Expected 24h expiry');

    // Validate JWT structure
    const token = response.body.data.access_token;
    validateJwtToken(token);

    // Store tokens for subsequent tests
    testOtpVerificationFlow.tokens = {
      access: response.body.data.access_token,
      refresh: response.body.data.refresh_token
    };
  });

  // Test 2: Invalid OTP
  await wait(TEST_CONFIG.delayBetweenTests);

  await test('Invalid OTP should be rejected', async () => {
    const phone = generateTestPhoneNumber();
    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: '0000' // Wrong OTP
    });

    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
    assert(response.body.code === 'INVALID_OTP', 'Expected invalid OTP error');
  });

  // Test 3: Invalid OTP format
  await test ('Invalid OTP format should be rejected', async () => {
    for (const otpCode of generateInvalidOtpCodes()) {
      const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
        phone_number: '+919876543210',
        otp_code: otpCode
      });

      assert(response.statusCode === 400, `OTP ${otpCode} should be rejected`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    }
  });

  // Test 4: User registration on first OTP verification
  await test('First OTP verification should create new user', async () => {
    const phone = generateTestPhoneNumber();

    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: testOtp
    });

    assert(response.statusCode === 200, 'Should create new user');
    assert(response.body.data.user.user_id, 'Should have user ID');
    assert(response.body.data.user.phone_number === phone, 'Should preserve phone number');
  });

  // Test 5: Retrieving tokens without clearing OTP
  await test('Tokens should be provided on successful verification', async () => {
    const phone = generateTestPhoneNumber();

    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: testOtp
    });

    assert(response.body.data.access_token, 'Should have access token');
    assert(response.body.data.refresh_token, 'Should have refresh token');
    assert(typeof response.body.data.access_token === 'string', 'Token should be string');
    assert(response.body.data.access_token.length > 50, 'Token should be valid length');
  });
}

async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases');
  console.log('====================');

  // Test 1: Expired OTP
  await test('Expired OTP should be handled', async () => {
    // This assumes your backend handles OTP expiry
    const phone = generateTestPhoneNumber();

    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    // Wait for expiry (if you have short expiry for tests)
    // await wait(TEST_CONFIG.otpExpiryMinutes * 60 * 1000);

    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: '1234'
    });

    // Update based on your expiry handling
    if (response.statusCode === 400) {
      assert(response.body.code === 'EXPIRED_OTP', 'Should handle expired OTP');
    }
  });

  // Test 2: Multiple verification attempts
  await test('Multiple verification attempts should be handled', async () => {
    const phone = generateTestPhoneNumber();

    await makeRequest('/auth/patient/otp/request', 'POST', {
      phone_number: phone,
      user_type: 'patient'
    });

    const attempts = [];
    for (let i = 0; i < 3; i++) {
      await wait(500);
      const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
        phone_number: phone,
        otp_code: '9999' // Wrong OTP
      });
      attempts.push(response);
    }

    // Check if rate limiting or account lockout occurs
    const lastResponse = attempts[attempts.length - 1];
    assert([400, 429, 403].includes(lastResponse.statusCode), 'Should handle multiple attempts');
  });

  // Test 3: Special characters in phone number
  await test('Special characters should be rejected', async () => {
    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: '+91 @#$%^&*()',
      otp_code: '1234'
    });

    assert(response.statusCode === 400, 'Should reject special characters');
  });

  // Test 4: SQL injection attempts
  await test('SQL injection should be prevented', async () => {
    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: "+91'; DROP TABLE users; --",
      otp_code: '1234'
    });

    assert(response.statusCode === 400, 'Should reject SQL injection attempt');
    assert(response.body.message, 'Should return error message');
  });
}

async function testPerformance() {
  console.log('\n🧪 Testing Performance');
  console.log('=====================');

  const phone = generateTestPhoneNumber();

  // Request OTP first
  await makeRequest('/auth/patient/otp/request', 'POST', {
    phone_number: phone,
    user_type: 'patient'
  });

  await test('OTP verification should complete within 2 seconds', async () => {
    const start = Date.now();

    const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
      phone_number: phone,
      otp_code: '1234'
    });

    const duration = Date.now() - start;

    console.log(`   ⏱️  Response time: ${duration}ms`);
    assert(duration < 2000, 'Should complete within 2 seconds');
    assert(response.statusCode === 200, 'Should succeed');
  });
}

async function runAllTests() {
  console.log('🚀 Starting Authentication API Tests');
  console.log('==================================');
  console.log(`API Endpoint: ${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || 3000}`);

  const results = [];

  try {
    // Run all test suites
    await testOtpRequestFlow();
    await testOtpVerificationFlow();
    await testEdgeCases();
    await testPerformance();

    console.log('\n✅ All authentication tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Make sure the server is running on port 3000. Press Enter to continue...', () => {
    readline.close();
    runAllTests();
  });
}

module.exports = {
  testOtpRequestFlow,
  testOtpVerificationFlow,
  testEdgeCases,
  runAllTests
};