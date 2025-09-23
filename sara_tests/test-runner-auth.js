/**
 * Master Test Runner for Authentication APIs
 *
 * This script runs all authentication tests and verifies the setup
 */

const {
  verifyDatabaseConnection,
  setupTestEnvironment,
  clearTestData
} = require('./test-db-utils.js');

const {
  runAllTests
} = require('./test-auth-patient-otp-flow.js');

/**
 * Run all authentication tests
 */
async function runAllAuthTests() {
  console.log('🚀 Starting Authentication Test Suite');
  console.log('====================================');

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Step 1: Verify database connection
    console.log('\n📊 Step 1: Testing Database Connection');
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database tests will be skipped or mocked');
    }

    // Step 2: Setup test environment
    console.log('\n🔧 Step 2: Setting up Test Environment');
    try {
      const users = await setupTestEnvironment();
      console.log(`✅ Test environment ready with ${users?.length || 0} test users`);
    } catch (error) {
      console.warn('⚠️  Test environment setup failed:', error.message);
      console.log('ℹ️  Continuing with existing data...');
    }

    // Step 3: Run authentication tests
    console.log('\n🧪 Step 3: Running Authentication Tests');
    console.log('\n' + '='.repeat(60));

    await runAllTests();

    console.log('\n✅ All authentication tests completed!');

    // Step 4: Cleanup
    console.log('\n🧹 Step 4: Cleaning up Test Data');
    try {
      await clearTestData();
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }

    const duration = Date.now() - startTime;
    console.log(`\n📊 Test suite completed in ${duration}ms`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

/**
 * Check if server is running
 */
function checkServerStatus() {
  const http = require('http');
  return new Promise((resolve) => {
    const req = http.request({
      hostname: process.env.API_HOST || 'localhost',
      port: process.env.API_PORT || 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Main execution
 */
if (require.main === module) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Show info
  console.log('\n🎯 Authentication API Test Runner');
  console.log('================================');
  console.log('This will run all authentication tests including:');
  console.log('• OTP request and verification');
  console.log('• Input validation');
  console.log('• Security checks');
  console.log('• Edge cases');
  console.log('');

  readline.question('Make sure your API server is running on port 3000. Press Enter to continue...', async () => {
    readline.close();

    // Check if server is running
    const isServerRunning = await checkServerStatus();
    if (!isServerRunning) {
      console.error('\n❌ API server is not responding on http://localhost:3000');
      console.log('Please start your API server before running tests.');
      process.exit(1);
    }

    console.log('\n✅ API server is running');
    runAllAuthTests();
  });
}

module.exports = { runAllAuthTests };