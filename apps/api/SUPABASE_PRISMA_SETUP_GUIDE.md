# Supabase + Prisma Setup Guide

This guide documents how to set up Prisma with local Supabase for the Cureka API project.

## Prerequisites
- Docker installed and running
- Node.js and pnpm installed
- Supabase CLI installed (`npm install -g supabase`)
- Working in the `apps/api` directory

## Step 1: Initialize Supabase (If not already done)

```bash
cd apps/api
supabase init
```

## Step 2: Start Local Supabase Services

```bash
supabase start
```

This will start all Supabase services including:
- Database: `127.0.0.1:54322`
- Studio: `http://127.0.0.1:54323`
- API Gateway: `http://127.0.0.1:54321`

## Step 3: Configure Environment Variables

Update your `.env` file with local Supabase connection strings:

```env
# Local Supabase Database URLs
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Existing Supabase credentials for hosted version (keep these)
SUPABASE_URL=https://vyihxepdwhmenbaitgdd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWh4ZXBkd2htZW5iYWl0Z2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTEzNzgsImV4cCI6MjA3NDE4NzM3OH0.wj4DvKAmqQC8NNy6RmVRiUQSgN7VrbHdNvDgXnIlyLM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWh4ZXBkd2htZW5iYWl0Z2RkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1MzQxOCwiZXhwIjoyMDg4NTI5NDE4fQ.7aY4nBzNfXHjKq8wZq9hJm6Kx2r9mXx5yQq2nX2zQ3Z4W6vF8gHj9kLm3p
DB_PASSWORD=Cureka@7791
```

## Step 4: Push Prisma Schema to Database

```bash
pnpm dlx prisma db push
# or
pnpx prisma db push
```

This creates all tables defined in `prisma/schema.prisma`

## Step 5: Generate Prisma Client

```bash
pnpm dlx prisma generate
```

## File Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Database schema definitions
│   └── migrations/              # Database migrations
├── sara_tests/
│   └── test-supabase-connection.js  # Node.js test file
├── supabase/                 # Supabase configuration
│   ├── config.toml          # Local Supabase configuration
│   └── seed.sql              # Database seed data
├── .env                      # Environment variables (see above)
└── package.json              # Project dependencies
```

## Testing Connection

Run the test file to verify connection:

```bash
node sara_tests/test-supabase-connection.js
```

Expected output:
```
Testing connection to Supabase...
✅ Successfully connected to Supabase
📊 Database info:
- Database: postgres
- User: postgres
- PostgreSQL version: 15.x
📋 Found tables:
- users
- appointments
- ai_sessions
✅ All tests passed!
🔌 Connection closed.
```

## Common Issues

1. **Port conflicts**: If you get port 54322 "already allocated" error:
   ```bash
   supabase stop --project-id api
   supabase start
   ```

2. **Docker not running**: Ensure Docker is started before running `supabase start`

3. **Schema changes not reflecting**:
   ```bash
   pnpm dlx prisma db push --force-reset
   ```

## Project Structure

The application follows this structure:
- Backend API in `apps/api`
- Frontend in `apps/web`
- Tests in `sara_tests` directory using Node.js (no frameworks)

## Key Files
- `prisma/schema.prisma`: Defines the database schema
- `.env`: Contains environment variables
- `supabase/config.toml`: Supabase local configuration

## Next Steps

1. Create your first API endpoint
2. Write tests in `sara_tests/` directory
3. Use the generated Prisma client for database operations


To push to the cloud version, you would need to make these changes:

  .env file changes:
  - Replace the local connection strings with your hosted Supabase credentials
  - DATABASE_URL: Use the connection string from Supabase Cloud (includes pooler)
  - DIRECT_URL: Use direct connection without pooler

  Command changes:
  - Replace local commands (no special setup needed)
  - You'll need to run pnpm dlx prisma db push against the hosted database

  Connection string format:
  - Local: postgresql://postgres:postgres@127.0.0.1:54322/postgres
  - Cloud: postgresql://postgres.[your-ref]:[password]@aws-[region].pooler.supabase.com:5432/postgres

  No code changes needed - the schema remains the same, just the database endpoint changes.