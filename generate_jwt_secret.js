#!/usr/bin/env node

// Generate JWT Secret for both backend and mobile app
const crypto = require('crypto');

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .slice(0, length)
    .replace(/[+/=]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

// Generate JWT secret for backend
const jwtSecret = generateSecureSecret(32);

console.log('\n🔐 Generated JWT Secret:', jwtSecret);
console.log('\n📁 Add to apps/api/.env:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${generateSecureSecret(32)}`);

console.log('\n📱 Add to apps/mobile_app/cureka/.env:');
console.log(`EXPO_PUBLIC_JWT_SECRET=${jwtSecret}`);
console.log('\n💡 IMPORTANT: EXPO_PUBLIC_JWT_SECRET must be EXACTLY THE SAME as backend JWT_SECRET!');

// Save to .env files if they exist
const fs = require('fs');

// Backend
const backendEnv = 'apps/api/.env';
const mobileEnv = 'apps/mobile_app/cureka/.env';

if (fs.existsSync(mobileEnv)) {
  let content = fs.readFileSync(mobileEnv, 'utf8');
  if (content.includes('EXPO_PUBLIC_JWT_SECRET')) {
    content = content.replace(/EXPO_PUBLIC_JWT_SECRET=.*/, `EXPO_PUBLIC_JWT_SECRET=${jwtSecret}`);
  } else {
    content += `\nEXPO_PUBLIC_JWT_SECRET=${jwtSecret}`;
  }
  fs.writeFileSync(mobileEnv, content);
  console.log(`\n✅ Updated ${mobileEnv} with EXPO_PUBLIC_JWT_SECRET`);
}

console.log('\n🎉 Done! Your JWT secrets are ready for use.');

// Run: node generate_jwt_secret.js