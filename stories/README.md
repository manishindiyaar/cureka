# Backend API User Stories

This directory contains detailed user stories for implementing the Cureka Healthcare Platform backend API. Each story is designed to be self-contained with all the technical context needed for a developer to implement it successfully.

## Stories by Epic

### Database Initialization
1. [Story DB01: Supabase Database Setup with Prisma](story-db01-supabase-setup.md)

### Epic A: Authentication & User Management
1. [Story A1: Patient Phone Number OTP Request](story-a1-patient-otp.md)
2. [Story A2: Patient OTP Verification](story-a2-patient-otp-verify.md)
3. [Story A3: Staff Email/Password Login](story-a3-staff-login.md)

### Epic B: AI Copilot & Session Management
1. [Story B1: AI Copilot Query Endpoint](story-b1-ai-copilot.md)

### Epic C: Staff & Hospital Management
1. [Story C1: Create Doctor Profile](story-c1-doctor-create.md)

### Epic D: Scheduling & Appointments
1. [Story D1: Create Doctor Appointment](story-d1-appointment-create.md)

### Epic E: Prescription Workflow
1. [Story E1: Create Prescription](story-e1-prescription-create.md)

### Epic F: External Service Webhooks
1. [Story F1: Vapi.ai Webhook Handler](story-f1-vapi-webhook.md)

## Implementation Priority

Based on dependencies and business value, here is the recommended implementation order:

1. **Database Initialization** - Foundation for all data storage
   - DB01: Supabase Database Setup with Prisma

2. **Epic A (Authentication)** - Foundation for all other features
   - A1: Patient OTP Request (Twilio Integration)
   - A2: Patient OTP Verification (Database OTP Verification)
   - A3: Staff Login

3. **Epic C (Staff Management)** - Required for other users to interact with
   - C1: Create Doctor Profile

4. **Epic D (Appointments)** - Core healthcare functionality
   - D1: Create Appointment

5. **Epic E (Prescriptions)** - Core healthcare functionality
   - E1: Create Prescription

6. **Epic B (AI Copilot)** - Enhancement features
   - B1: AI Copilot Query

7. **Epic F (Webhooks)** - Integration features
   - F1: Vapi Webhook Handler

## Authentication Flow Changes

As of the latest updates, the patient authentication flow has been modified to use Twilio instead of Firebase:

1. **OTP Request (Story A1)**: Patient requests OTP via phone number → System generates 4-digit code → Sends via Twilio SMS → Stores in database with 5-minute expiry

2. **OTP Verification (Story A2)**: Patient submits OTP → System verifies against database → Creates user if new → Generates JWT tokens

This change removes the dependency on Firebase and gives full control over the authentication process.

## Common Technical Standards

All stories follow these implementation standards:

### Security
- JWT-based authentication with role-based access control
- Input validation using express-validator
- Rate limiting to prevent abuse
- Sensitive data encryption at rest
- Secure webhook signature validation

### Performance
- API response time < 200ms for 95th percentile
- Database connection pooling
- Redis caching where appropriate
- Efficient database queries with proper indexing

### Testing
- Unit tests with >90% coverage
- Integration tests for external services
- Mock services for isolated testing
- Performance benchmarks

### Error Handling
- Standardized error response format
- Proper HTTP status codes
- Graceful degradation for external service failures
- Comprehensive logging

## Getting Started

To implement any story:

1. Read the entire story document carefully
2. Set up required environment variables
3. Install specified dependencies
4. Follow the implementation steps in order
5. Run all tests before submitting code
6. Validate against acceptance criteria

Each story includes:
- Detailed acceptance criteria
- Technical implementation guidance
- Required environment variables
- Database schema requirements
- Comprehensive testing requirements
- Security considerations