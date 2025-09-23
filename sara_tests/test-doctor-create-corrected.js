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
        'x-hospital-admin-id': 'test-admin-id', // Simulate authenticated admin
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

async function testDoctorCreation() {
  console.log('🧪 Testing Doctor Creation (Corrected)');
  console.log('=====================================\n');

  try {
    // Test validation errors
    console.log('📋 Test 1: Missing Required Fields');
    const response1 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'dr.smith@apollo.curekahealth.com'
      // Missing full_name, specialty, hospital_id
    });

    console.log(`Status: ${response1.statusCode}`);
    if (response1.statusCode === 400) {
      console.log('✅ Correctly rejected missing fields');
    } else {
      console.log(`❌ Should have rejected missing fields: ${response1.body.message || response1.body}`);
    }

    console.log('\n📋 Test 2: Invalid Email Format');
    const response2 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'invalid-email',
      full_name: 'Dr. Smith',
      specialty: 'Cardiology',
      hospital_id: '123e4567-e89b-12d3-a456-426614174000'
    });

    console.log(`Status: ${response2.statusCode}`);
    if (response2.statusCode === 400) {
      console.log('✅ Correctly rejected invalid email');
    } else {
      console.log(`❌ Should have rejected invalid email: ${response2.body.message || response2.body}`);
    }

    console.log('\n📋 Test 3: Wrong Email Domain');
    const response3 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'dr.smith@gmail.com', // Wrong domain
      full_name: 'Dr. Smith',
      specialty: 'Cardiology',
      hospital_id: '123e4567-e89b-12d3-a456-426614174000'
    });

    console.log(`Status: ${response3.statusCode}`);
    if (response3.statusCode === 400) {
      console.log('✅ Correctly rejected wrong email domain');
    } else {
      console.log(`❌ Should have rejected wrong email domain: ${response3.body.message || response3.body}`);
    }

    console.log('\n📋 Test 4: Short Name');
    const response4 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'dr.smith@apollo.curekahealth.com',
      full_name: 'A', // Too short
      specialty: 'Cardiology',
      hospital_id: '123e4567-e89b-12d3-a456-426614174000'
    });

    console.log(`Status: ${response4.statusCode}`);
    if (response4.statusCode === 400) {
      console.log('✅ Correctly rejected short name');
    } else {
      console.log(`❌ Should have rejected short name: ${response4.body.message || response4.body}`);
    }

    console.log('\n📋 Test 5: Invalid Specialty');
    const response5 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'dr.smith@apollo.curekahealth.com',
      full_name: 'Dr. Smith',
      specialty: 'Invalid Specialty',
      hospital_id: '123e4567-e89b-12d3-a456-426614174000'
    });

    console.log(`Status: ${response5.statusCode}`);
    if (response5.statusCode === 400) {
      console.log('✅ Correctly rejected invalid specialty');
    } else {
      console.log(`❌ Should have rejected invalid specialty: ${response5.body.message || response5.body}`);
    }

    console.log('\n📋 Test 6: Invalid Hospital ID');
    const response6 = await makeRequest('/api/v1/doctors', 'POST', {
      email: 'dr.smith@apollo.curekahealth.com',
      full_name: 'Dr. Smith',
      specialty: 'Cardiology',
      hospital_id: 'invalid-uuid'
    });

    console.log(`Status: ${response6.statusCode}`);
    if (response6.statusCode === 400) {
      console.log('✅ Correctly rejected invalid hospital ID');
    } else {
      console.log(`❌ Should have rejected invalid hospital ID: ${response6.body.message || response6.body}`);
    }

    console.log('\n📋 Test 7: Valid Doctor Creation Request');
    console.log('Note: Actual creation requires a valid hospital ID and proper admin authentication');

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
    testDoctorCreation();
  });
}

module.exports = { testDoctorCreation, makeRequest };