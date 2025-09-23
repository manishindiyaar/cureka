/**
 * Test OTP Verification for specific number
 */

import http from 'http';

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

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

async function testOtpVerification(phoneNumber, otpCode, testName = 'Verification Test') {
  console.log(`\n🧪 ${testName}`);
  console.log(`Testing OTP Verification for: ${phoneNumber}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log('=====================================');

  try {
    console.log('📱 Verifying OTP...');
    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
      phone_number: phoneNumber,
      otp_code: otpCode
    });

    console.log(`🔍 Response Status: ${response.statusCode}`);
    console.log(`📦 Response Body:`, JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('✅ OTP verification successful!');

      if (response.body.success) {
        console.log('🎉 Login/Registration successful!');
        console.log(`🆔 User ID: ${response.body.data.user.user_id}`);
        console.log(`🔑 Access Token: ${response.body.data.access_token.substring(0, 20)}...`);
        console.log(`🔄 Refresh Token: ${response.body.data.refresh_token.substring(0, 20)}...`);
      }
    } else {
      console.log(`❌ OTP verification failed with status: ${response.statusCode}`);
      if (response.body.code) {
        console.log(`🐛 Error Code: ${response.body.code}`);
      }
      if (response.body.message) {
        console.log(`📞 Error Message: ${response.body.message}`);
      }
    }

    return response;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function runTest() {
  const phoneNumber = '+919373675705';
  const testOtpCode = '1234'; // Assuming test OTP code

  console.log('🚀 Testing OTP Verification');
  console.log('==============================\n');

  // First, request an OTP
  console.log('Step 1: Requesting OTP...');
  await makeRequest('/api/v1/auth/patient/otp/request', 'POST', {
    phone_number: phoneNumber,
    user_type: 'patient'
  });

  console.log('\nStep 2: Verifying OTP...');
  await testOtpVerification(phoneNumber, testOtpCode, 'Test Current OTP');

  // Test with different scenarios
  console.log('\n' + '='.repeat(50));
  console.log('Testing Different Scenarios:');

  // Test 1: Wrong OTP
  await testOtpVerification(phoneNumber, '0000', 'Test Wrong OTP');

  // Test 2: Invalid format
  await testOtpVerification(phoneNumber, '12345', 'Test Invalid Format');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().catch(console.error);
}

export { testOtpVerification };