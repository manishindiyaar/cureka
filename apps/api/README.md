# Cureka API Setup Guide (Local Development)

Welcome! This guide walks you through setting up the Cureka API with local Supabase database and running/calling all API endpoints.

## 🎯 What's Included
- Supabase local setup (Windows & macOS)
- Prisma ORM setup and connection
- Environment configuration
- All API endpoints with curl commands
- Database schema overview

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/manishindiyaar/cureka.git
cd cureka/apps/api

# Install dependencies
pnpm install

# Start Supabase locally
supabase start

# Push database schema
pnpx prisma db push

# Run API server
pnpm dev
```

---

## 📦 Installation

### Prerequisites
- [pnpm](https://pnpm.io/installation)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/installation)

### Step 1: Install pnpm
```bash
# macOS
brew install pnpm

# Windows (PowerShell as admin)
pm install -g pnpm@latest
```

### Step 2: Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## 🔧 Supabase Local Setup

### Start Supabase Locally
```bash
# Go to API directory
cd apps/api

# Start Supabase (this takes 2-3 minutes)
supabase start

# Check status - should show running containers
supabase status
```

**Expected output:**
```
API URL: http://localhost:3000
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### Stop Supabase
```bash
supabase stop
```

### Restart Supabase after stopping
```bash
supabase start
```

---

## 📋 Environment Setup

### Copy .env.example to .env
```bash
# Create local .env file
touch .env
```

### Copy these exact values to your .env file:
```env
# Server
PORT=3000
NODE_ENV=development

# Local Supabase (from supabase status output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYnNlIiwicmVmIjoibG9jYWwiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODU4MzIwMCwiZXhwIjozMjY4MzQ3MjAwfQ.YgNkwcYlUc4xQ8mU7cQY4YlUc4xQ8mU7cQY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYnNlIiwicmVmIjoibG9jYWwiLCJyb2xlIjoiZnJhbmsiLCJpYXQiOjE2OTg1ODMyMDAsImV4cCI6MzI2ODM0NzIwMH0.YgNkwcYlUc4xQ8mU7cQY4YlUcQY
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# JWT
JWT_SECRET=something-secret
JWT_REFRESH_SECRET=something-secret-refresh

# OTP Settings
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=5
```

---

## 🔌 Prisma Setup

### Reset and Sync Database
```bash
# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Check database tables
npx prisma db pull --schema-only
```

---

## 🗄️ SQL Database Schema

Here are the tables created automatically by Prisma:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    role ROLE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OTPs table
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    otp INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Hospitals table
CREATE TABLE hospitals (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialization TEXT,
    license_number TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    date_of_birth DATE,
    hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Run the API Server

```bash
# Start the API server
pnpm dev
```

**Success message:**
```
Server running on port 3000
prisma:info Starting a postgresql pool with 17 connections.
```

---

## 📡 Testing API Endpoints

### 0. Health Check
```bash
curl http://localhost:3000/health
```

### 1. Request OTP for Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/request \
-H "Content-Type: application/json" \
-d '{
  "phone_number": "+919373675705",
  "user_type": "patient"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### 2. Verify OTP and Get Tokens
Replace `7383` with the actual OTP from your SMS:
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/verify \
-H "Content-Type: application/json" \
-d '{
  "phone_number": "+919373675705",
  "otp_code": "7383"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid-here",
      "phone_number": "+919373675705",
      "full_name": null
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer"
  }
}
```

### 3. Staff Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@apollo.curekahealth.in",
  "password": "your-password"
}'
```

### 4. Create Hospital
```bash
curl -X POST http://localhost:3000/api/v1/hospitals \
-H "Content-Type: application/json" \
-d '{
  "hospital_name": "Apollo Hospital",
  "admin_email": "admin@apollo.curekahealth.in",
  "admin_full_name": "Dr. Smith"
}'
```

### 5. Get Hospital (replace {id})
```bash
curl http://localhost:3000/api/v1/hospitals/hospital-id
```

### 6. Create Doctor (replace hospital_id)
```bash
curl -X POST http://localhost:3000/api/v1/doctors \
-H "Content-Type: application/json" \
-d '{
  "first_name": "Dr. Sarah",
  "last_name": "Johnson",
  "specialization": "Cardiology",
  "license_number": "CARD2024/001",
  "email": "drsarah.j@email.com",
  "phone": "+919876543211",
  "gender": "female",
  "date_of_birth": "1985-05-15",
  "hospital_id": "hospital-id"
}'
```

### 7. Get Doctor (replace {id})
```bash
curl http://localhost:3000/api/v1/doctors/{doctor-id}
```

---

## 🧪 Testing Tips

### Error Cases to Test
```bash
# Wrong phone format
curl -X POST ... -d '{"phone_number":"919373675705"...}' # Missing +91

# Rate limited
curl -X POST ... -d '{"phone_number":"+919000000000"...}' # Too many requests
```

### Get OTP from Console
When you request OTP, watch terminal output:
```
Sending OTP 7383 to +919373675705
OTP SMS sent successfully: SMxxxxxxxxxx
```

---

## 🛠️ Common Issues

1. **"supabase command not found"**
   - Install: `npm install -g @supabase/cli`

2. **"OTP sent but SMS not received"**
   - Check Twilio credentials
   - Ensure phone can receive international SMS

3. **"Database connection failed"**
   - Check if Supabase is running: `supabase status`
   - Verify DATABASE_URL matches output of `supabase status`

4. **"TypeScript import errors"**
   - Ensure all imports use `.js` extension for local files
   - Restart VS Code TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"

5. **"JWT errors" after login**
   - Update `/Users/manish/Desktop/cureka/apps/api/.env` with proper JWT_SECRET values

---

## 🎉 Success Checklist

✅ Supabase running locally
✅ Database connected successfully
✅ Server running on port 3000
✅ OTP request returns success
✅ SMS received on phone
✅ OTP verification returns tokens

**You're ready to go! The API is fully functional.** 🚀

---

## Next Steps
- Build React/Vue frontend to interact with these APIs
- Add more endpoints as per requirements
- Deploy to production when ready

Need help? Check the terminal output for detailed logs.