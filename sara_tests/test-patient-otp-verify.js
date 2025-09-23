const http = require('http');
const crypto = require('crypto');

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

async function testOtpVerification() {
  console.log('🧪 Testing Patient OTP Verification');
  console.log('=====================================\n');

  test('1. Valid OTP Verification', async () => {
    const phoneNumber = '+919876543210';
    const otpCode = '1234';

    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
      phone_number: phoneNumber,
      otp_code: otpCode
    });

    assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
    assert(response.body.success === true, 'Expected success to be true');
    assert(response.body.data.access_token, 'Expected access_token in response');
    assert(response.body.data.refresh_token, 'Expected refresh_token in response');
    assert(response.body.data.user.phone_number === phoneNumber, 'Expected phone number to match');

    console.log(`✅ Response time: ${response.responseTime || 'N/A'}ms`);
  });

  test('2. Invalid OTP Format', async () => {
    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
      phone_number: '+919876543210',
      otp_code: '12345'
    });

    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
    assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    assert(response.body.message === 'OTP must be 4 digits', 'Expected specific OTP validation message');
  });

  test('3. Invalid Phone Number Format', async () => {
    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
      phone_number: '9876543210',
      otp_code: '1234'
    });

    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
    assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    assert(response.body.message === 'Phone number must be in E.164 format with +91 prefix', 'Expected specific phone validation message');
  });

  test('4. Missing Required Fields', async () => {
    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {});

    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
    assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
  });

  test('5. Non-Indian Phone Number', async () => {
    const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
      phone_number: '+12345678901',
      otp_code: '1234'
    });

    assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
    assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
  });
}

async function testOtpVerification() {
  console.log('🧪 Testing Patient OTP Verification');
  console.log('=====================================\n');

  try {
    test('1. Valid OTP Verification', async () => {
      const phoneNumber = '+919876543210';
      const otpCode = '1234';

      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
        phone_number: phoneNumber,
        otp_code: otpCode
      });

      assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
      assert(response.body.success === true, 'Expected success to be true');
      assert(response.body.data.access_token, 'Expected access_token in response');
      assert(response.body.data.refresh_token, 'Expected refresh_token in response');
      assert(response.body.data.user.phone_number === phoneNumber, 'Expected phone number to match');

      const authToken = response.body.data.access_token;
      console.log('✅ Auth Token saved for future tests');
    });

    test('2. Invalid OTP Format', async () => {
      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
        phone_number: '+919876543210',
        otp_code: '12345'
      });

      assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
      assert(response.body.message === 'OTP must be 4 digits', 'Expected specific OTP validation message');
    });

    test('3. Invalid Phone Number Format', async () => {
      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
        phone_number: '9876543210',
        otp_code: '1234'
      });

      assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
      assert(response.body.message === 'Phone number must be in E.164 format with +91 prefix', 'Expected specific phone validation message');
    });

    test('4. Missing Required Fields', async () => {
      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {});

      assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    });

    test('5. Non-Indian Phone Number', async () => {
      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
        phone_number: '+12345678901',
        otp_code: '1234'
      });

      assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
      assert(response.body.code === 'VALIDATION_ERROR', 'Expected validation error');
    });

    test('6. Wrong OTP Code', async () => {
      const response = await makeRequest('/api/v1/auth/patient/otp/verify', 'POST', {
        phone_number: '+919876543210',
        otp_code: '0000'
      });

      assert(response.statusCode === 400, `Expected 400, got ${response.statusCode}`);
      assert(response.body.code === 'INVALID_OTP', 'Expected invalid OTP error');
      assert(response.body.message === 'Invalid OTP', 'Expected specific invalid OTP message');
    });

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

function test(name, fn) {
  console.log(`\n📋 ${name}`);
  try {
    fn();
    console.log('✅ Passed');
  } catch (error) {
    console.log('❌ Failed:', error.message);
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
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
    testOtpVerification();
  });
}

module.exports = { testOtpVerification, makeRequest };