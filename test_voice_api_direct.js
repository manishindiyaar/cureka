#!/usr/bin/env node

// Direct Voice Agent API Test - Bypasses WebSocket/Webpack issues
const http = require('http');
const crypto = require('crypto');

// Test with simple fetch
const testPort = 3001;

console.log('🎙️ VOICE AGENT DIRECT API TEST\n');
console.log('This test validates the voice agent endpoints without dependencies');

// Mock test results
const results = {
  auth: false,
  startSession: false,
  webhook: false
};

// Simple test runner
function testEndpoint(name, method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Check if server is running first
    const healthCheck = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // Server is running, proceed with test
        runTest();
      } else {
        console.log('❌ Backend server not running on port 3000');
        process.exit(1);
      }
    });

    healthCheck.on('error', (err) => {
      console.log('❌ Cannot connect to backend:', err.message);
      console.log('\nPlease ensure:');
      console.log('1. Backend is running (npm run dev in apps/api)');
      console.log('2. PostgreSQL is running');
      process.exit(1);
    });

    healthCheck.end();

    function runTest() {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = data ? JSON.parse(data) : {};
            console.log(`\n✅ ${name}:`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Success: ${response.success || 'N/A'}`);
            results[name] = response.success === true;
            resolve(response);
          } catch (e) {
            console.log(`   Response: ${data}`);
            results[name] = res.statusCode === 200 || res.statusCode === 201;
            resolve(data);
          }
        });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.on('error', (err) => {
        console.log(`❌ ${name} failed: ${err.message}`);
        results[name] = false;
        resolve({ error: err.message });
      });

      req.end();
    }
  });
}

// Mock authentication token (simulate patient auth)
const mockPatientToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJyb2xlIjoiUEFUSUVOVCIsImlhdCI6MTYwOTQ1OTIwMH0.BogusTokenForTesting1234567890';

async function runDirectTest() {
  console.log('Testing voice agent infrastructure...\n');

  // Note: You'll need to authenticate properly or skip auth for testing
  await testEndpoint('Health Check', 'GET', '/health');

  // Simulate voice session creation
  await testEndpoint(
    'Voice Session Start',
    'POST',
    '/api/v1/sessions/vapi/start',
    {
      assistant_id: 'test_assistant_id'
    },
    { 'Authorization': `Bearer ${mockPatientToken}` }
  );

  // Skip webhook test if auth fails
  if (results.startSession) {
    await testWebhookEvent();
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Voice Session Start: ${results.startSession ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook: ${results.webhook ? '✅ PASS' : '❌ FAIL / Skipped'}`);

  const successCount = Object.values(results).filter(v => v === true).length;
  console.log(`\nTotal Passed: ${successCount}/3`);
}

// Webhook test functions
async function testWebhookEvent() {
  console.log('\n📡 Testing webhook (simulating Vapi calling your backend)...\n');

  // Generate test webhook signature
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET || 'test_webhook_secret';
  const testPayload = JSON.stringify({
    type: 'message',
    data: {
      callId: 'test-call-123',
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    },
    timestamp: new Date().toISOString()
  });

  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(testPayload)
    .digest('hex');

  await testEndpoint(
    'Vapi Webhook',
    'POST',
    '/api/v1/sessions/vapi/webhook',
    JSON.parse(testPayload),
    {
      'X-Vapi-Signature': signature,
      'Content-Type': 'application/json'
    }
  );
}

// Run the test
console.log('\nStarting voice agent test...\n');
runDirectTest().then(() => {
  console.log('\n✨ Test completed!\n');
  process.exit(0);
});