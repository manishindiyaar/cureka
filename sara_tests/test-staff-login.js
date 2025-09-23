const http = require('http');

const API_HOST = 'localhost';
const API_PORT = process.env.PORT || 3000;

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

    req.write(postData);
    req.end();
  });
}

async function testStaffLogin() {
  console.log('🧪 Testing Staff Login');
  console.log('=====================\n');

  try {
    // Test valid staff login
    console.log('📋 Test 1: Valid Hospital Admin Login');
    const response1 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'admin@apollo.curekahealth.in',
      password: 'SecurePass123!'
    });

    console.log(`Status: ${response1.statusCode}`);
    if (response1.statusCode === 200) {
      console.log('✅ Login successful');
      console.log(`User: ${response1.body.data.user.email}`);
      console.log(`Role: ${response1.body.data.user.role}`);
      console.log(`Hospital: ${response1.body.data.user.hospital_name}`);
      console.log('Tokens received');
    } else {
      console.log(`❌ Login failed: ${response1.body.message || response1.body}`);
    }

    // Test invalid domain
    console.log('\n📋 Test 2: Invalid Email Domain');
    const response2 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'admin@gmail.com',
      password: 'SecurePass123!'
    });

    console.log(`Status: ${response2.statusCode}`);
    if (response2.statusCode === 401) {
      console.log('✅ Correctly rejected invalid domain');
    } else {
      console.log(`❌ Should have rejected invalid domain: ${response2.body.message || response2.body}`);
    }

    // Test invalid credentials
    console.log('\n📋 Test 3: Invalid Credentials');
    const response3 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'admin@apollo.curekahealth.in',
      password: 'WrongPassword'
    });

    console.log(`Status: ${response3.statusCode}`);
    if (response3.statusCode === 401) {
      console.log('✅ Correctly rejected invalid credentials');
    } else {
      console.log(`❌ Should have rejected invalid credentials: ${response3.body.message || response3.body}`);
    }

    // Test validation errors
    console.log('\n📋 Test 4: Missing Password');
    const response4 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'admin@apollo.curekahealth.in'
    });

    console.log(`Status: ${response4.statusCode}`);
    if (response4.statusCode === 400) {
      console.log('✅ Correctly rejected missing password');
    } else {
      console.log(`❌ Should have rejected missing password: ${response4.body.message || response4.body}`);
    }

    // Test doctor login
    console.log('\n📋 Test 5: Valid Doctor Login');
    const response5 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'dr.smith@apollo.curekahealth.com',
      password: 'DoctorPass123!'
    });

    console.log(`Status: ${response5.statusCode}`);
    if (response5.statusCode === 200) {
      console.log('✅ Doctor login successful');
      console.log(`Role: ${response5.body.data.user.role}`);
      console.log(`Permissions: ${response5.body.data.user.permissions.join(', ')}`);
    } else {
      console.log(`❌ Doctor login failed: ${response5.body.message || response5.body}`);
    }

    // Test pharmacist login
    console.log('\n📋 Test 6: Valid Pharmacist Login');
    const response6 = await makeRequest('/api/v1/auth/staff/login', 'POST', {
      email: 'pharm.jones@apollo.curekahealth.pharm',
      password: 'PharmacistPass123!'
    });

    console.log(`Status: ${response6.statusCode}`);
    if (response6.statusCode === 200) {
      console.log('✅ Pharmacist login successful');
      console.log(`Role: ${response6.body.data.user.role}`);
    } else {
      console.log(`❌ Pharmacist login failed: ${response6.body.message || response6.body}`);
    }

    console.log('\n✅ All tests completed!');
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
    testStaffLogin();
  });
}

module.exports = { testStaffLogin, makeRequest };