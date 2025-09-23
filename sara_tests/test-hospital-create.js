const http = require('http');

const API_HOST = 'localhost';
const API_PORT = process.env.PORT || 3000;

function makeRequest(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(data && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function testHospitalCreation() {
  console.log('🧪 Testing Hospital Creation');
  console.log('===========================\n');

  try {
    // Test validation errors
    console.log('📋 Test 1: Missing Required Fields');
    const response1 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'Test Hospital'
      // Missing admin_email and admin_full_name
    });

    console.log(`Status: ${response1.statusCode}`);
    if (response1.statusCode === 400) {
      console.log('✅ Correctly rejected missing fields');
    } else {
      console.log(`❌ Should have rejected missing fields: ${response1.body.message || response1.body}`);
    }

    console.log('\n📋 Test 2: Invalid Hospital Name Length');
    const response2 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'AB', // Too short
      admin_email: 'admin@test.curekahealth.in',
      admin_full_name: 'Test Admin'
    });

    console.log(`Status: ${response2.statusCode}`);
    if (response2.statusCode === 400) {
      console.log('✅ Correctly rejected short hospital name');
    } else {
      console.log(`❌ Should have rejected short hospital name: ${response2.body.message || response2.body}`);
    }

    console.log('\n📋 Test 3: Invalid Admin Email Format');
    const response3 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'Test Hospital',
      admin_email: 'invalid-email',
      admin_full_name: 'Test Admin'
    });

    console.log(`Status: ${response3.statusCode}`);
    if (response3.statusCode === 400) {
      console.log('✅ Correctly rejected invalid email');
    } else {
      console.log(`❌ Should have rejected invalid email: ${response3.body.message || response3.body}`);
    }

    console.log('\n📋 Test 4: Wrong Admin Email Domain');
    const response4 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'Test Hospital',
      admin_email: 'admin@test.com', // Wrong domain
      admin_full_name: 'Test Admin'
    });

    console.log(`Status: ${response4.statusCode}`);
    if (response4.statusCode === 400) {
      console.log('✅ Correctly rejected wrong email domain');
    } else {
      console.log(`❌ Should have rejected wrong email domain: ${response4.body.message || response4.body}`);
    }

    console.log('\n📋 Test 5: Short Admin Name');
    const response5 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'Test Hospital',
      admin_email: 'admin@test.curekahealth.in',
      admin_full_name: 'A' // Too short
    });

    console.log(`Status: ${response5.statusCode}`);
    if (response5.statusCode === 400) {
      console.log('✅ Correctly rejected short admin name');
    } else {
      console.log(`❌ Should have rejected short admin name: ${response5.body.message || response5.body}`);
    }

    console.log('\n📋 Test 6: Hospital Name Mismatch');
    const response6 = await makeRequest('/api/v1/hospitals', 'POST', {
      hospital_name: 'Apollo Hospitals',
      admin_email: 'admin@test.curekahealth.in', // Different hospital name in email
      admin_full_name: 'Test Admin'
    });

    console.log(`Status: ${response6.statusCode}`);
    if (response6.statusCode === 400) {
      console.log('✅ Correctly rejected hospital name mismatch');
    } else {
      console.log(`❌ Should have rejected hospital name mismatch: ${response6.body.message || response6.body}`);
    }

    console.log('\n✅ All validation tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
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
    console.log('\n');
    testHospitalCreation();
  });
}

module.exports = { testHospitalCreation, makeRequest };