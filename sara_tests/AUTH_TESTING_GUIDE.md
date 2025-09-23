# Authentication API Testing Guide

## Overview
This guide covers how to test authentication APIs for patient and staff authentication using OTP-based flow.

## Prerequisites
1. API server running on localhost:3000 or configured host
2. Test database seeded with test data
3. Environment variables configured for testing

## Test Environment Setup

### Environment Variables
```bash
export API_HOST=localhost
export API_PORT=3000
export TEST_PHONE_PREFIX=+91
export OTP_DEFAULT=1234  # For local testing where SMS is mocked
```

### Test Database
Ensure your test database is separated from production. Supabase provides ways to:
- Reset test data between tests
- Use a separate test branch/project
- Run tests in isolated environment

## Authentication Flow Testing

### 1. OTP Request Flow
Tests sending OTP to phone numbers:

```javascript
// Test valid phone number
const response = await makeRequest('/auth/patient/otp/request', 'POST', {
  phone_number: '+919876543210',
  user_type: 'patient'
});
// Expected: 200 status with success message
```

### 2. OTP Verification Flow
Tests verifying OTP and receiving tokens:

```javascript
// Test successful verification
const response = await makeRequest('/auth/patient/otp/verify', 'POST', {
  phone_number: '+919876543210',
  otp_code: '1234'
});
// Expected: 200 status with access and refresh tokens
```

## Testing Categories

### A. Input Validation Tests
Test various input scenarios:

1. **Valid Inputs**
   - Valid Indian phone number: `+919876543210`
   - Valid OTP: `1234`

2. **Invalid Phone Numbers**
   ```javascript
   const invalidNumbers = [
     '+9198765',           // Too short
     '+9198765432101',     // Too long
     '+110123456789',      // Wrong country code
     '9876543210',         // Missing +91
     '',                   // Empty
     null                  // Null
   ];
   ```

3. **Invalid OTP Codes**
   ```javascript
   const invalidOtpCodes = [
     '123',        // Too short
     '12345',      // Too long
     'abcd',       // Non-numeric
     '',           // Empty
   ];
   ```

### B. Security Tests

1. **SQL Injection Prevention**
   ```javascript
   const sqlInjection = {
     phone_number: "+91'; DROP TABLE users; --",
     otp_code: '1234'
   };
   ```

2. **XSS Prevention**
   ```javascript
   const xssAttempt = {
     phone_number: '+91<script>alert("xss")</script>',
     otp_code: '1234'
   };
   ```

3. **Rate Limiting**
   - Test multiple rapid requests
   - Test max attempts limit
   - Test rate limiting headers

### C. Edge Cases

1. **Expired OTP**
   - Wait for OTP to expire
   - Try verification
   - Check expiry status

2. **Concurrent Requests**
   - Send multiple OTP requests simultaneously
   - Verify multiple times in parallel
   - Test race conditions

3. **Boundary Conditions**
   - Exact 5-minute expiry time
   - Last minute of expiry
   - Midnight rollovers

## API Testing Guidelines

### 1. Request Format
```javascript
// Request OTP
POST /api/v1/auth/patient/otp/request
Content-Type: application/json
{
  "phone_number": "+919876543210",
  "user_type": "patient"
}

// Verify OTP
POST /api/v1/auth/patient/otp/verify
Content-Type: application/json
{
  "phone_number": "+919876543210",
  "otp_code": "1234"
}
```

### 2. Response Expectations

**Successful OTP Request:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Successful Verification:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "user_id": "uuid",
      "phone_number": "+919876543210",
      "full_name": null
    },
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

**Error Responses:**
```json
// Validation Error
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Phone number must be in E.164 format with +91 prefix"
}

// Invalid OTP
{
  "success": false,
  "code": "INVALID_OTP",
  "message": "Invalid OTP"
}
```

## Running Tests

### Single Test File
```bash
node sara_tests/test-auth-patient-otp-flow.js
```

### Run Specific Test
```bash
node sara_tests/test-utils-auth.js  # Test utilities
```

### Environment-specific Testing
```bash
# Local development
export API_HOST=localhost
export API_PORT=3000
node sara_tests/test-auth-patient-otp-flow.js

# Staging environment
export API_HOST=staging-api.cureka.com
export API_PORT=443
export NODE_TLS_REJECT_UNAUTHORIZED=0
node sara_tests/test-auth-patient-otp-flow.js
```

## Key Testing Scenarios

### 1. First-time User Registration
- Request OTP for new phone number
- Verify OTP
- Confirm user is created
- Verify token validity
- Check profile creation

### 2. Returning User Login
- Request OTP for existing user
- Verify OTP
- Confirm existing user is returned
- Check updated timestamps

### 3. OTP Expiry
- Request OTP
- Wait for expiry
- Try to verify
- Confirm expiry error

### 4. Rate Limiting
- Send multiple rapid requests
- Check rate limiting kicks in
- Verify rate limit headers
- Test after rate limit period

### 5. Security Tests
- SQL injection attempts
- XSS attempts
- Special characters in inputs
- Boundary value tests

## Automating Authentication Tests

### Continuous Integration
Set up tests to run on:
- Every commit
- Daily scheduled runs
- Before deployments
- After infrastructure changes

### Test Data Management
- Use dedicated test database
- Seed and cleanup test data
- Use consistent test phone numbers
- Isolate test from production

### Performance Testing
- Measure OTP generation time
- Measure verification time
- Test under load
- Monitor database performance

## Common Issues & Solutions

### Test Phone Numbers
Use dedicated test phone number ranges:
- `+9199999XXXXX` - Internal testing
- `+919876543210` - Common test number
- Avoid real customer numbers

### OTP Handling
- Use fixed OTP for testing (e.g., 1234)
- Mock SMS service
- Extract OTP when needed
- Time-sensitive OTP handling

### Database Connections
- Use separate test database
- Reset data between test runs
- Use transactions for rollback
- Clean up after tests

## Monitoring & Logging

### Test Logging
- Log all test results
- Capture response times
- Track failure rates
- Monitor error patterns

### Production Monitoring
- Track OTP success rates
- Monitor login patterns
- Alert on anomalies
- Analyze user feedback

## References
- BaseUrl: https://auth0.com/docs/test/authentication-tests
- Test files location: `/sara_tests/`
- Follow your existing `test-utils-auth.js` pattern for new tests