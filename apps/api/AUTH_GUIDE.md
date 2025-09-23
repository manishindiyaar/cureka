Authentication Guide

  Overview

  This guide explains our authentication system based on One-Time Passwords (OTP) with JSON Web Tokens (JWT). This approach was
  chosen specifically for a healthcare platform where patients access services primarily through mobile devices.

  Authentication Strategy

  Our system uses a two-factor authentication approach:
  1. Phone Number Verification - identifies the user
  2. OTP Confirmation - proves possession of the device
  3. Token-Based Authorization - enables seamless API access

  Workflow Architecture

  sequenceDiagram
      participant P as Patient
      participant C as Client/App
      participant S as Server
      participant D as Database
      participant T as Twilio

      P->>C: Enter phone number
      C->>S: POST /otp/request {phone}
      S->>D: Generate OTP & Store
      D-->>S: OTP Stored
      S->>T: Send SMS (commented for dev)
      S-->>C: {"success": true}

      P->>C: Enter received OTP
      C->>S: POST /otp/verify {phone, otp}
      S->>D: Verify OTP Match
      alt OTP Correct
          S->>D: Delete OTP (single-use)
          S->>S: Generate Tokens
          S-->>C: {"access_token": "eyJ...", "refresh_token": "eyJ..."}
          C-->>P: You're logged in!
      else OTP Incorrect
          S-->>C: {"code": "INVALID_OTP"}
      end

      loop Every API Call
          C->>S: Authorization: Bearer eyJ...
          S->>S: JWT.verify(token, secret)
          S-->>C: Data Response
      end

  Technical Implementation

  1. OTP Request Endpoint

  URL: POST /api/v1/auth/patient/otp/request

  Request Body:
  {
    "phone_number": "+919876543210"
  }

  Response:
  {
    "success": true,
    "message": "OTP sent successfully"
  }

  Backend Process:
  1. Validate phone number format (E.164 with +91)
  2. Generate 4-digit random OTP
  3. Store in database (overwriting any existing OTP)
  4. Send via Twilio SMS (optional in development)
  5. Return success response

  2. OTP Verification Endpoint

  URL: POST /api/v1/auth/patient/otp/verify

  Request Body:
  {
    "phone_number": "+919876543210",
    "otp_code": "1234"
  }

  Response:
  {
    "success": true,
    "data": {
      "user": {
        "user_id": "uuid-here",
        "phone_number": "+919876543210",
        "full_name": null
      },
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "Bearer",
      "expires_in": 86400
    }
  }

  Backend Process:
  1. Validate phone number and OTP format
  2. Check OTP exists in database
  3. Verify OTP not expired (5-minute window)
  4. Validate OTP code matches
  5. Delete OTP (single-use requirement)
  6. Create/update user in database
  7. Generate access and refresh tokens
  8. Return tokens to client

  3. Token Refresh Endpoint

  URL: POST /api/v1/auth/token/refresh

  Request Body:
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }

  Response: New access token
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGc...",
      "token_type": "Bearer",
      "expires_in": 86400
    }
  }

  Token Storage

  Access Token

  - Web: Local Storage or Session Storage
  - Mobile: Temporary in-memory storage
  - Expiry: 24 hours

  Refresh Token

  - Web: Local Storage (with encryption consideration)
  - Mobile: Secure storage (Keychain, KeyStore, SecureStore)
  - Expiry: 7 days

  Example mobile storage:
  // React Native
  await SecureStore.setItem('refresh_token', refreshToken);
  const refreshToken = await SecureStore.getItem('refresh_token');

  Security Features

  1. OTP Security

  - Temporary: Expires in 5 minutes
  - Single-use: Deleted after successful verification
  - Rate-limited: Maximum 5 requests per 15 minutes per phone number

  2. Token Security

  - Signed: Cryptographically secured with JWT_SECRET
  - Time-bounded: Access tokens expire in 24h
  - Refresh mechanism: Separate long-lived refresh tokens

  3. Request Protection

  // Sample API call with token
  fetch('/api/v1/appointments', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  Database Schema

  -- Users table
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'PATIENT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- OTPs table
  CREATE TABLE otps (
    id BIGSERIAL PRIMARY KEY,
    number VARCHAR(15) NOT NULL,
    otp INTEGER NOT NULL CHECK (otp >= 1000 AND otp <= 9999),
    created_at TIMESTAMP DEFAULT NOW()
  );

  Environment Configuration

  # Database
  DATABASE_URL="postgresql://user:pass@localhost:5432/cureka"
  DIRECT_URL="postgresql://user:pass@localhost:5432/cureka"

  # Tokens
  JWT_SECRET=your-256-bit-secret
  JWT_REFRESH_SECRET=your-refresh-secret
  OTP_EXPIRY_MINUTES=5
  MAX_OTP_ATTEMPTS=5

  # Twilio (optional for SMS)
  TWILIO_ACCOUNT_SID=your-account-sid
  TWILIO_AUTH_TOKEN=your-auth-token
  TWILIO_PHONE_NUMBER=your-number

  Why This Approach? (First Principles)

  Problem: Passwords Don't Work in Healthcare Mobile

  1. Forgotten Passwords: Patients forget credentials
  2. Phone-First: Most users on mobile apps
  3. Simplicity Needed: Elderly patients need simple flow
  4. Security Critical: Medical data requires strong auth

  Solution Benefits

  1. No Passwords to Forget: Phone is the identity
  2. Mobile Friendly: Natural SMS-based auth
  3. Stateless: No server sessions, scales infinitely
  4. Fast: JWT verification is mathematical operation O(1)
  5. Secure: Cryptographic signatures can't be forged

  Why Not Use Session Cookies?

  1. Mobile Limitations: Poor cookie support in mobile apps
  2. Cross-Origin Issues: Cookies don't work across domains
  3. Distributed Systems: Cookie-based sessions don't scale
  4. Performance: Database lookups on every request slow

  Common Workflows

  User Registration (First Login)

  1. Request OTP → Verify OTP → Get tokens → User created
  2. User profile can be completed later

  Returning User

  1. Same process automatically picks up existing user
  2. Updates last login timestamp

  Token Expired

  1. Use refresh_token to get new access_token
  2. If refresh_token also expired → must re-login

  Testing the Authentication

  Run the Node.js test:
  cd /Users/manish/Desktop/cureka
  node sara_tests/test-patient-otp-request.js
  node sara_tests/test-patient-otp-verify.js

  See individual test files for specific scenarios.

  Summary

  Our authentication system:
  - Identifies users with phone numbers
  - Verifies device possession with OTP
  - Authorizes API access with JWT tokens
  - Scales horizontally without shared state
  - Performs at mathematical speed O(1)
  - Secures medical data with cryptographic guarantees

  Perfect for a healthcare platform serving millions of mobile users.
