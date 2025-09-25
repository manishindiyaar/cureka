# Cureka Voice Agent - Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview
Based on analysis of the project structure, Cureka is a healthcare platform with:
- Backend: Node.js/Express API in `apps/api` directory
- Database: Supabase hosted database
- Authentication: JWT-based token authentication
- Existing API structure with various endpoints for patient management

### Enhancement Scope Definition

#### Enhancement Type
☑ New Feature Addition
☐ Major Feature Modification
☐ Integration with New Systems
☐ Performance/Scalability Improvements
☐ UI/UX Overhaul
☐ Technology Stack Upgrade
☐ Bug Fix and Stability Improvements

#### Enhancement Description
Integration of Vapi.ai voice assistant for in-app voice conversations. This enhancement adds voice AI capabilities allowing patients to have real-time voice conversations with an AI assistant within the mobile app, eliminating the need for phone calls while maintaining the existing telephony-based system for fallback scenarios.

#### Impact Assessment
☐ Minimal Impact (isolated additions)
☑ Moderate Impact (some existing code changes)
☐ Significant Impact (substantial existing code changes)
☐ Major Impact (architectural changes required)

### Goals and Background Context

#### Goals
- Enable patients to communicate with AI assistant via voice within the app
- Provide secure proxy endpoint to protect Vapi API key from frontend
- Maintain existing authentication and security patterns
- Ensure seamless integration with current patient authentication flow
- Support real-time voice conversations without degrading app performance

#### Background Context
Currently, Cureka provides healthcare services through a mobile application with backend API support. While voice calling exists, there's no integrated voice AI assistant capability. Patients must interact through text or make phone calls. This enhancement adds in-app voice conversation capability using Vapi.ai's platform, providing more natural and accessible interaction methods for patients while maintaining security by keeping API keys server-side.

## Requirements

### Functional Requirements
FR1: The system shall provide a secure endpoint `POST /api/v1/sessions/vapi/start`
FR2: The endpoint shall require valid JWT authentication from authenticated patients
FR3: The endpoint shall use server-side VAPI_API_KEY to communicate with Vapi service
FR4: The endpoint shall request web/app-based (not telephony) sessions from Vapi
FR5: The endpoint shall return public session URL to the mobile app
FR6: The system shall handle Vapi API failures with appropriate error messages
FR7: The current functionality shall remain intact during and after implementation

### Non-Functional Requirements
NFR1: Session creation shall complete within 3 seconds
NFR2: The endpoint shall handle at least 100 concurrent session requests
NFR3: API key shall never be exposed to the frontend
NFR4: Error messages shall not expose internal system details
NFR5: The enhancement shall maintain existing audit logging patterns

### Compatibility Requirements
CR1: The new endpoint shall follow existing API naming conventions and patterns
CR2: The endpoint shall integrate with existing JWT authentication middleware
CR3: Session response format shall be consistent with existing API response standards
CR4: Error handling shall use existing error response format

## Technical Constraints and Integration Requirements

### Existing Technology Stack
**Languages**: JavaScript/Node.js
**Frameworks**: Express.js with custom middleware patterns
**Database**: Supabase hosted database
**Infrastructure**: Node.js backend with Express framework
**External Dependencies**: JWT for authentication, Supabase client

### Integration Approach
**API Integration Strategy**: Add new route following existing route patterns in `/api/v1` namespace
**Testing Integration Strategy**: Implement tests in `sara_tests` directory using node.js native
**Configuration Management**: Add VAPI_API_KEY to existing environment variable pattern

### Code Organization and Standards
**File Structure Approach**: Add new endpoint file in routes directory following existing file organization
**Naming Conventions**: `vapiSessionsRoutes.js` following kebab-case convention
**Coding Standards**: Follow existing async/await patterns, 2-space indentation
**Documentation Standards**: Add JSDoc comments following existing documentation patterns

### Risk Assessment and Mitigation
**Technical Risks**:
- Vapi service unavailability affecting session creation (Mitigation: implement retry with exponential backoff)
- API key exposure risk if implementation is incorrect (Mitigation: code review and security audit)

**Integration Risks**:
- Incompatibility with existing JWT middleware (Mitigation: test with existing auth patterns)
- Session URL expiration before mobile client connects (Mitigation: client-side retry mechanism)

## Epic Structure

### Epic Approach
Single comprehensive epic delivering the voice agent integration while maintaining existing functionality integrity.

### Epic 1: Voice Assistant Integration
**Epic Goal**: Enable secure in-app voice conversations through Vapi.ai integration by providing authenticated configuration to the mobile app
**Integration Requirements**: Must not break any existing API endpoints, must secure API keys server-side, must follow existing error handling patterns from `/make-call` endpoint

#### Story 1.1: Vapi Sessions Backend Endpoint
As a backend developer,
I want to create a secure endpoint that returns authenticated Vapi configuration,
so that mobile app can initialize voice assistant without exposing our secret API key.

**Acceptance Criteria**:
1. Create `POST /api/v1/sessions/vapi/start` endpoint following Express patterns from `/make-call`
2. Implement JWT authentication validation (new requirement based on security analysis)
3. Return public Vapi configuration data using response format matching `/make-call` pattern
4. Handle all errors following exact pattern from existing `/make-call` endpoint
5. Separate public and secret API key handling for security
6. Follow existing code patterns from the project's Express structure

**Integration Verification**:
IV1: Verify new endpoint follows existing Express router patterns
IV2: Confirm response format matches standards from `/make-call` endpoint
IV3: Validate no hard-coded credentials remain (move to env vars)

#### Mobile App Integration Pattern
Based on the corrected understanding from Vapi documentation:

**Flow Summary**:
1. Mobile app calls backend `POST /api/v1/sessions/vapi/start` with patient JWT
2. Backend validates JWT and returns public configuration:
   - Public Vapi API key (safe for client)
   - Assistant ID
   - Patient validation context
3. Mobile app uses `@vapi-ai/web` SDK directly with these credentials
4. Voice conversation happens between mobile app and Vapi servers

This avoids the complexity of creating a true session proxy while maintaining security.

#### Story 1.2: Comprehensive Endpoint Testing
As a QA engineer,
I want comprehensive tests for the Vapi sessions endpoint,
so that reliability and security are maintained.

**Acceptance Criteria**:
1. Write Node.js tests for successful session creation
2. Test JWT authentication validation
3. Test error handling for Vapi API failures
4. Test concurrent request handling
5. Validate response format matches existing patterns
6. Ensure no side effects on existing system

**Integration Verification**:
IV1: Verify tests don't break existing test suite
IV2: Confirm test execution time isn't significantly increased
IV3: Validate test coverage metrics are maintained

#### Story 1.3: Environment Configuration Setup
As a DevOps engineer,
I want proper environment configuration for Vapi integration,
so that deployment is secure and scalable.

**Acceptance Criteria**:
1. Add VAPI_API_KEY to environment variables
2. Update deployment configurations
3. Document environment setup requirements
4. Validate configuration loading in tests
5. Ensure no hardcoded credentials anywhere

**Integration Verification**:
IV1: Confirm deployment scripts handle new environment variable
IV2: Validate staging environment configuration
IV3: Verify production configuration follows security standards