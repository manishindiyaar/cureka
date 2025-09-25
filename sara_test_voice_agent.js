#!/usr/bin/env node

// Complete Voice Agent Integration Test
// This test validates the entire voice agent workflow

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const WebSocket = require('ws');

// Test Configuration
const CONFIG = {
  // Backend configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  API_VERSION: 'v1',

  // User credentials (these will be filled after authentication)
  phoneNumber: '+919876543210',
  otp: '123456', // Will be different in actual test
  authToken: null,
  patientId: null,

  // Session tracking
  voiceSessionId: null,
  wsConnection: null,

  // Test results
  results: {
    auth: false,
    voiceStart: false,
    websocket: false,
    webhook: false,
    voiceEnd: false
  },

  // Test messages
  responses: []
};

// Utility functions
function log(message, data = null) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 23);
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {
        'Content-Type': 'application/json'
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    if (options.body) req.write(JSON.stringify(options.body));
    req.on('error', reject);
    req.end();
  });
}

// Step 1: Patient Authentication
async function authenticatePatient() {
  log('Step 1: Authenticating patient with phone number');

  try {
    // Note: In real implementation, you'd first request OTP, then submit OTP
    // For this test, we're simulating direct login
    const url = `${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/auth/patient/login`;

    const response = await makeRequest({
      method: 'POST',
      url: url,
      body: {
        phone: CONFIG.phoneNumber,
        otp: CONFIG.otp
      }
    });

    if (response.status === 200 && response.data.success) {
      CONFIG.authToken = response.data.data.accessToken;
      CONFIG.patientId = response.data.data.user?.id || 'patient_test_id';
      CONFIG.results.auth = true;
      log('✓ Authentication successful', { token: CONFIG.authToken.substr(0,20)+'...' });
      return true;
    } else {
      throw new Error(`Authentication failed: ${response.data.message}`);
    }

  } catch (error) {
    log('✗ Authentication failed', error.message);
    return false;
  }
}

// Step 2: Start Voice Session
async function startVoiceSession() {
  log('Step 2: Starting voice session');

  try {
    const url = `${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/sessions/vapi/start`;

    const response = await makeRequest({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.authToken}`
      },
      body: {
        assistant_id: process.env.VAPI_ASSISTANT_ID || 'asst_test_id'
      }
    });

    if (response.status === 200 && response.data.success) {
      CONFIG.voiceSessionId = response.data.data.session_id;
      const vapiConfig = response.data.data.vapi_config;

      CONFIG.results.voiceStart = true;
      log('✓ Voice session started', {
        sessionId: CONFIG.voiceSessionId,
        tokenPreview: vapiConfig.jwt?.substr(0, 20) + '...'
      });
      return true;
    } else {
      throw new Error(`Voice session start failed: ${response.data.message}`);
    }

  } catch (error) {
    log('✗ Voice session start failed', error.message);
    return false;
  }
}

// Step 3: Connect to WebSocket
async function connectWebSocket() {
  log('Step 3: Connecting to WebSocket for real-time voice events');

  return new Promise((resolve) => {
    const wsUrl = CONFIG.API_BASE_URL.replace('http', 'ws').replace(/([0-9]+)/, (match, port) => {
      const p = parseInt(port);
      return p === 3000 ? '3000' : match;
    }) + '/socket.io/?EIO=4&transport=websocket';

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      log('✓ WebSocket connected');
      CONFIG.wsConnection = ws;

      // Authenticate
      ws.send(JSON.stringify({
        auth: { token: CONFIG.authToken },
        eventType: 'join_patient_room',
        patientId: CONFIG.patientId
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.eventType === 'voice_event') {
          CONFIG.responses.push(message);
          log('📢 Received voice transcript:', message.data);
        } else if (message.type === 'connection-status') {
          CONFIG.results.websocket = true;
          log('✓ WebSocket voice stream active');
        }
      } catch (e) {
        // Non-JSON messages from socket.io
      }
    });

    ws.on('error', (error) => {
      log('✗ WebSocket error:', error.message);
      resolve(false);
    });

    ws.on('close', () => {
      log('WebSocket disconnected');
      resolve(CONFIG.results.websocket);
    });
  });
}

// Step 4: Simulate Webhook (Vapi sending data)
async function testWebhook() {
  log('Step 4: Simulating Vapi webhook');

  try {
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET || 'test_secret';
    const payload = JSON.stringify({
      type: 'message',
      data: {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    // Generate webhook signature
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const url = `${CONFIG.API_BASE_URL}/api/${CONFIG.API_VERSION}/sessions/vapi/webhook`;

    const response = await makeRequest({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'X-Vapi-Signature': signature
      },
      body: JSON.parse(payload)
    });

    if (response.status === 200) {
      CONFIG.results.webhook = true;
      log('✓ Webhook processed successfully');
      return true;
    } else {
      throw new Error(`Webhook failed: ${response.status}`);
    }

  } catch (error) {
    log('✗ Webhook test failed', error.message);
    return false;
  }
}

// Main Test Runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🎙️ VOICE AGENT INTEGRATION TEST');
  console.log('===============================\n');
  console.log(`Phone Number: ${CONFIG.phoneNumber}`);
  console.log(`API URL: ${CONFIG.API_BASE_URL}`);
  console.log(`Patient ID: ${CONFIG.patientId || 'Will be set after auth'}`);
  console.log('\n'.repeat(2));

  // Run tests sequentially
  await authenticatePatient();
  if (CONFIG.results.auth) {
    await startVoiceSession();
    if (CONFIG.results.voiceStart) {
      await connectWebSocket();
      if (CONFIG.wsConnection) {
        await testWebhook();
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));

  Object.entries(CONFIG.results).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✓ PASS' : '✗ FAIL'}`);
  });

  const allPassed = Object.values(CONFIG.results).every(v => v === true);
  console.log(`\nOVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (CONFIG.responses.length > 0) {
    console.log(`\nVOICE RESPONSES RECEIVED: ${CONFIG.responses.length}`);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});