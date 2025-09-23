// Node.js test script for patient OTP request endpoint
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
async function testPatientOtpRequest() {
  console.log('\n🧪 Testing Patient OTP Request Endpoint\n');

  // Test 1: Valid Indian phone number
  console.log('Test 1: Valid Indian phone number (+919876543210)');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '+919373675705'
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

  // Test 2: Non-Indian phone number
  console.log('\nTest 2: Non-Indian phone number (+1234567890)');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '+1234567890'
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
  console.log('\nTest 3: Invalid phone format (9876543210)');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/patient/otp/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone_number: '9876543210'
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

  // Test 4: Rate limiting
  console.log('\nTest 4: Rate limiting (6 requests in quick succession)');
  for (let i = 0; i < 6; i++) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/patient/otp/request',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        phone_number: '+91987654321' + (i % 2) // Alternate between 2 numbers
      });

      console.log(`Request ${i + 1} - Status: ${response.statusCode}`);

      if (i >= 4 && response.statusCode === 429) {
        console.log('✅ Rate limiting working correctly');
      }
    } catch (err) {
      console.error(`Request ${i + 1} FAILED with error:`, err.message);
    }
  }
}

// Run tests
console.log('🚀 Running patient OTP request tests...\n');
testPatientOtpRequest().then(() => {
  console.log('\n✨ All tests completed!');
}).catch((err) => {
  console.error('\n❌ Test suite failed:', err);
});