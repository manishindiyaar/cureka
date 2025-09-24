/**
 * Hospital Dashboard Test
 *
 * Tests the new hospital dashboard endpoints for managing doctors
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3000;

// Helper function to make HTTP requests
function makeRequest(path, method, data?, headers?) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
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
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testHospitalDashboard() {
  console.log('🏥 Testing Hospital Dashboard API Endpoints...');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as Hospital Admin to get token
    console.log('\n1️⃣ Logging in as Hospital Admin...');
    const loginData = {
      email: "admin@apollo.curekahealth.in",
      password: "admin12345" // Replace with actual password
    };

    const loginResponse = await makeRequest('/api/v1/auth/staff/login', 'POST', loginData);

    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed:', loginResponse.body.message);
      return;
    }

    const { access_token } = loginResponse.data;
    console.log('✅ Admin logged in successfully!');

    // Step 2: Get Dashboard Overview
    console.log('\n2️⃣ Getting Dashboard Overview...');
    const overviewResponse = await makeRequest(
      '/api/v1/hospitals/dashboard/overview',
      'GET',
      null,
      { 'Authorization': `Bearer ${access_token}` }
    );

    console.log('Dashboard Response:', JSON.stringify(overviewResponse.body, null, 2));

    // Step 3: Get Staff List
    console.log('\n3️⃣ Getting Staff List...');
    const staffResponse = await makeRequest(
      '/api/v1/hospitals/dashboard/staff',
      'GET',
      null,
      { 'Authorization': `Bearer ${access_token}` }
    );

    console.log('Staff Response:', JSON.stringify(staffResponse.body, null, 2));

    // Step 4: Add a New Doctor
    console.log('\n4️⃣ Adding New Doctor...');
    const newDoctorData = {
      first_name: "Dr. Ramesh",
      last_name: "Kumar",
      full_name: "Dr. Ramesh Kumar",
      specialization: "Orthopedics",
      license_number: "ORTHO2024/007",
      email: "dr.ramesh@apollo.curekahealth.pharm",
      phone: "+919876543215",
      gender: "male",
      date_of_birth: "1982-08-15",
      hospital_id: "hospital-uuid" // This will be checked server-side
    };

    const addDoctorResponse = await makeRequest(
      '/api/v1/hospitals/dashboard/doctors',
      'POST',
      newDoctorData,
      { 'Authorization': `Bearer ${access_token}` }
    );

    console.log('Add Doctor Response:', JSON.stringify(addDoctorResponse.body, null, 2));

    if (addDoctorResponse.statusCode === 201) {
      console.log('✅ New doctor added successfully!');
      console.log('Temporary Password:', addDoctorResponse.data.temporary_password);
      console.log('* Store this password securely for the doctor *');
    }

    console.log('\n🎉 Hospital Dashboard Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test the hospital dashboard
console.log('Testing Hospital Dashboard API...');
testHospitalDashboard().catch(console.error);