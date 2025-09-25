#!/usr/bin/env node

// Voice Agent Test Server Setup & Execution
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const color = type === 'error' ? colors.red :
               type === 'success' ? colors.green :
               type === 'warning' ? colors.yellow :
               colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

// Function to generate secure JWT secret
function generateJWTSecret() {
  // Create a 256-bit (32 characters) secure random string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!@#$%^&*()';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Function to setup backend credentials
function setupBackendCredentials() {
  log('\n🔧 Setting up Backend Credentials...', 'info');

  const backendEnvPath = path.join(__dirname, 'apps', 'api', '.env');
  const backendExamplePath = path.join(__dirname, 'apps', 'api', '.env.example');

  if (!fs.existsSync(backendEnvPath) && !fs.existsSync(backendExamplePath)) {
    // Create basic .env file for testing
    const jwtSecret = generateJWTSecret();
    const envContent = `# Auto-generated for testing
NODE_ENV=development
PORT=3000
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${generateJWTSecret()}
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
VAPI_ASSISTANT_ID=test_assistant_id_123
VAPI_WEBHOOK_SECRET=whsec_test_webhook_secret
`;
    fs.writeFileSync(backendEnvPath, envContent);
    log('✓ Created backend .env with test credentials', 'success');
    return jwtSecret;
  } else if (fs.existsSync(backendEnvPath)) {
    // Read existing JWT secret
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    const jwtMatch = content.match(/JWT_SECRET=(.+)/);
    if (jwtMatch) {
      log('✓ Using existing backend JWT secret', 'success');
      return jwtMatch[1];
    }
  } else if (fs.existsSync(backendExamplePath)) {
    // Copy from example
    const content = fs.readFileSync(backendExamplePath, 'utf8');
    const jwtSecret = generateJWTSecret();
    const updatedContent = content.replace('your_vapi_api_key_here', 'test_vapi_key')
                                   .replace('your_vapi_assistant_id_here', 'test_assistant_id')
                                   .replace('your_webhook_secret_here', 'whsec_test_secret');
    fs.writeFileSync(backendEnvPath, updatedContent);
    log('✓ Created backend .env from example', 'success');
    return jwtSecret;
  }
  return generateJWTSecret();
}

// Function to setup mobile app credentials
function setupMobileCredentials() {
  log('\n📱 Setting up Mobile App Credentials...', 'info');

  const mobileEnvPath = path.join(__dirname, 'apps', 'mobile_app', 'cureka', '.env');
  const mobileExamplePath = path.join(__dirname, 'apps', 'mobile_app', 'cureka', '.env.example');

  if (!fs.existsSync(mobileEnvPath) && fs.existsSync(mobileExamplePath)) {
    // Copy from example
    const content = fs.readFileSync(mobileExamplePath, 'utf8');
    fs.writeFileSync(mobileEnvPath, content);
    log('✓ Created mobile app .env from example', 'success');
  }
}

// Function to generate JWT secret for mobile app
function generateMobileJWTSecret() {
  const mobileEnvPath = path.join(__dirname, 'apps', 'mobile_app', 'cureka', '.env');
  const backendEnvPath = path.join(__dirname, 'apps', 'api', '.env');

  // Read backend JWT secret
  if (fs.existsSync(backendEnvPath)) {
    const backendContent = fs.readFileSync(backendEnvPath, 'utf8');
    const jwtMatch = backendContent.match(/JWT_SECRET=(.+)/);
    if (jwtMatch) {
      const jwtSecret = jwtMatch[1];

      // Update mobile env if it exists
      if (fs.existsSync(mobileEnvPath)) {
        let mobileContent = fs.readFileSync(mobileEnvPath, 'utf8');
        if (!mobileContent.includes('EXPO_PUBLIC_JWT_SECRET')) {
          mobileContent += '\nEXPO_PUBLIC_JWT_SECRET=' + jwtSecret;
          fs.writeFileSync(mobileEnvPath, mobileContent);
          log('✓ Added EXPO_PUBLIC_JWT_SECRET to mobile .env (same as backend JWT)', 'success');
        }
      }
      return jwtSecret;
    }
  }
  return generateJWTSecret();
}

// Function to check and install WebSocket dependency
function checkWebSocketDependency() {
  log('\n📡 Checking WebSocket dependency...', 'info');

  try {
    require.resolve('ws');
    log('✓ WebSocket module found', 'success');
    return true;
  } catch (e) {
    log('Installing WebSocket module...', 'warning');
    exec('npm install ws', (error, stdout, stderr) => {
      if (error) {
        log('✗ Failed to install WebSocket: ' + error.message, 'error');
        return false;
      }
      log('✓ WebSocket module installed', 'success');
      return true;
    });
  }
}

// Function to start backend server
function startBackendServer() {
  log('\n🚀 Starting Backend Server...', 'info');
  return new Promise((resolve) => {
    // Check if backend exists
    const backendPath = path.join(__dirname, 'apps', 'api');
    if (!fs.existsSync(backendPath)) {
      log('✗ Backend API directory not found at: ' + backendPath, 'error');
      resolve(false);
      return;
    }

    // Check if server.js exists
    const serverPath = path.join(backendPath, 'src', 'server.ts');
    if (!fs.existsSync(serverPath)) {
      log('✗ Server file not found at: ' + serverPath, 'error');
      resolve(false);
      return;
    }

    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: 'inherit'
    });

    backendProcess.on('error', (error) => {
      log('✗ Failed to start backend: ' + error.message, 'error');
      resolve(false);
    });

    // Give server time to start
    setTimeout(() => {
      resolve(true);
    }, 3000);
  });
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  log('VOICE AGENT TEST SERVER SETUP', 'info');
  console.log('='.repeat(60) + '\n');

  // Check prerequisites
  if (!checkWebSocketDependency()) {
    return;
  }

  // Setup credentials
  const jwtSecret = setupBackendCredentials();
  setupMobileCredentials();
  generateMobileJWTSecret();

  // Show instructions
  console.log('\n' + '='.repeat(60));
  log('NEXT STEPS:', 'info');
  console.log('1. Ensure your database is running (PostgreSQL)');
  console.log('2. Ensure your supabase credentials are set in apps/api/.env');
  console.log('3. Get Vapi credentials from https://dashboard.vapi.ai');
  console.log('\nThen run the test:');
  console.log('node sara_test_voice_agent.js');
  console.log('\n' + '='.repeat(60));

  // Optionally start backend
  const startBackend = process.argv.includes('--start-backend');
  if (startBackend) {
    await startBackendServer();
  }
}

// Run setup
main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});