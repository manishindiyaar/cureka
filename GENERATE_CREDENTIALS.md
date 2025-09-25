# Voice Agent Credentials Generation Guide

## 🔑 Backend Credentials (apps/api/.env)

### 1. JWT Secrets
```bash
# Generate 32-character secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### 2. JWT Secret for Mobile App
The `EXPO_PUBLIC_JWT_SECRET` should be **EXACTLY THE SAME** as your backend `JWT_SECRET`:
```javascript
// From mobile app
EXPO_PUBLIC_JWT_SECRET=${JWT_SECRET}  // Copy from backend JWT_SECRET
```

### 3. Vapi Credentials
1. Go to https://dashboard.vapi.ai
2. Create account → Go to Assistants
3. Create new assistant or use existing
4. Copy these values:
```bash
VAPI_API_KEY=sk_abc123...          # Your secret API key
VAPI_ASSISTANT_ID=asst_xyz789...     # Assistant ID
VAPI_WEBHOOK_SECRET=whsec_test123...   # For webhook security
VAPI_VOICE_PROFILE_ID=vvp_456...       # Voice profile
```

## 📱 Mobile App Credentials (apps/mobile_app/cureka/.env)

### Use same JWT secret from backend:
```bash
EXPO_PUBLIC_JWT_SECRET=${same_as_backend_JWT_SECRET}
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_VAPI_ASSISTANT_ID=copy_from_backend
```

## 🗄️ Database Credentials

### Supabase
```bash
# From Supabase dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Local PostgreSQL
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/cureka_db
```

## 🔒 Example Generated Credentials

```bash
# Backend (.env)
JWT_SECRET=3f8d4b2a1c9e785a4b6d8f2c9e1a8b7d6f5g4h3i2j1k
JWT_REFRESH_SECRET=4g7h1k2l9m8n7o6p5q4r3s2t1u0v9w8x7y6z5a4b3c
VAPI_API_KEY=sk_1234567890abcdef
VAPI_ASSISTANT_ID=asst_patient_assistant_001
VAPI_WEBHOOK_SECRET=whsec_9876543210fedcba
VAPI_VOICE_PROFILE_ID=vvp_sonya_profile_001

# Mobile (.env)
EXPO_PUBLIC_JWT_SECRET=3f8d4b2a1c9e785a4b6d8f2c9e1a8b7d6f5g4h3i2j1k  # Same as backend!
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_VAPI_ASSISTANT_ID=asst_patient_assistant_001
```

## 🚀 Quick Generation Script

Create `generate_secrets.sh`:
```bash
#!/bin/bash

# Generate secrets
echo "Generating secure secrets..."

# Backend
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> apps/api/.env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> apps/api/.env

# Mobile (same JWT)
echo "EXPO_PUBLIC_JWT_SECRET=$JWT_SECRET" >> apps/mobile_app/cureka/.env
echo "✅ Done! JWT secret copied from backend to mobile app"

# Add placeholder for Vapi
echo "VAPI_API_KEY=sk_your_key_here" >> apps/api/.env
echo "VAPI_ASSISTANT_ID=asst_your_id_here" >> apps/api/.env
echo "VAPI_WEBHOOK_SECRET=whsec_your_secret_here" >> apps/api/.env
```

Make it executable:
```bash
chmod +x generate_secrets.sh
./generate_secrets.sh
```

## ⚠️ Important Notes

1. **Never expose** `VAPI_API_KEY` to frontend
2. **Use same** JWT secret for backend and mobile app
3. **Generate new** secrets for production
4. **Use environment** variables, never hardcode credentials
5. **Webhook secret** should be at least 32 characters

## 🧪 Test with Generated Secrets

```bash
# 1. Start backend with new credentials
node start_voice_test_server.js

# 2. Run integration test
node sara_test_voice_agent.js

# 3. Monitor output for:
# ✅ Authentication successful
# ✅ Voice session started
# ✅ WebSocket connected
# ✅ Webhook processed
```