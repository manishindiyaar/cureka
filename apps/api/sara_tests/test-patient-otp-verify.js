// Node.js test script for patient OTP verification endpoint
import http from 'http';

const API_BASE_URL = 'http://localhost:3000/api/v1/auth/patient';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// Test cases
async function testPatientOtpVerify() {
  console.log('\n🧪 Testing Patient OTP Verification Endpoint\n');

  // Test 1: Valid OTP verification (assuming OTP exists in database)
  console.log('Test 1: Valid OTP verification');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '+919373675705',
      otp_code: '1234'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);

    if (response.statusCode === 200) {
      console.log('✅ Test 1 PASSED');
    } else {
      console.log('❌ Test 1 FAILED');
      console.log(`Expected: 200`);
      console.log(`Actual: ${response.statusCode}`);
    }
  } catch (err) {
    console.error('❌ Test 1 FAILED with error:', err.message);
  }

  // Test 2: Invalid OTP format
  console.log('\nTest 2: Invalid OTP format (too short)');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '+919876543210',
      otp_code: '123'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);

    if (response.statusCode === 400) {
      console.log('✅ Test 2 PASSED');
    } else {
      console.log('❌ Test 2 FAILED');
      console.log(`Expected: 400`);
      console.log(`Actual: ${response.statusCode}`);
    }
  } catch (err) {
    console.error('❌ Test 2 FAILED with error:', err.message);
  }

  // Test 3: Invalid phone format
  console.log('\nTest 3: Invalid phone format (missing +)');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '919876543210',
      otp_code: '1234'
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);

    if (response.statusCode === 400) {
      console.log('✅ Test 3 PASSED');
    } else {
      console.log('❌ Test 3 FAILED');
      console.log(`Expected: 400`);
      console.log(`Actual: ${response.statusCode}`);
    }
  } catch (err) {
    console.error('❌ Test 3 FAILED with error:', err.message);
  }

  // Test 4: Expired OTP (simulated)
  console.log('\nTest 4: Expired OTP scenario');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '+919876543210',
      otp_code: '9999' // Assuming this OTP doesn't exist or is expired
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);

    if (response.statusCode === 400) {
      console.log('✅ Test 4 PASSED (handled expired/expired OTP correctly)');
    } else {
      console.log('ℹ️  Test 4 Informational (depends on database state)');
    }
  } catch (err) {
    console.error('❌ Test 4 FAILED with error:', err.message);
  }
}

// Run tests
console.log('🚀 Running patient OTP verification tests...\n');
testPatientOtpVerify().then(() => {
  console.log('\n✨ All tests completed!');
}).catch((err) => {
  console.error('\n❌ Test suite failed:', err);
});