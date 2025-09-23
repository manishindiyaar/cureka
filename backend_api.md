
PRD: Healthcare Platform Backend API
Version: 1.0


What we are building???

We’re building a telemedicine platform for rural + urban use with 4 roles:
	•	Patient (Android app) → login with phone OTP, talk to AI voice agent, book video/audio consults, view appointments & prescriptions.
	•	Doctor (Web) → manage slots, see patients, run video consults, issue prescriptions.
	•	Pharmacist (Web) → accept/deny prescription requests, track fulfillment.
	•	Hospital Admin (Web) → CRUD doctors/pharmacists/staff, oversee all appointments, prescriptions, and patients.

🔑 Key features / USPs
	•	Copilot / QueryBox → natural-language command box for all roles (powered by Claude).
	•	AI Voice Agent (via Vapi + Twilio) → lets patients call with keypad phone; all sessions sync into the app by phone number.
	•	Appointment scheduling → powered by Cal.com API with OAuth calendar connect (Google/Outlook) so doctors’ personal calendars stay in sync.
	•	Prescriptions → issued digitally by doctors, encrypted, sent to pharmacies, tracked until pickup.
	•	Push notifications → real-time updates across web + mobile.
	•	Scalable DB schema → all entities (users, doctors, appointments, prescriptions, pharmacies, sessions) linked and auditable.


    
Date: September 21, 2025
Author: John, Product Manager

1. Introduction & Goals
This document outlines the requirements for the backend API that will serve as the central nervous system for the entire healthcare platform.

The primary goal of this API is to provide a secure, scalable, and reliable set of endpoints that will act as the single source of truth for all business logic and data. It must serve the needs of multiple clients: the staff-facing web dashboard, the patient-facing mobile app, and the AI-driven voice systems.

2. Core User Roles & Access Control
The API must enforce strict role-based access control (RBAC) based on the JWT provided by the authenticated user.

Unauthenticated: Access is limited to login/registration endpoints.

Patient: Can only read and write their own data (e.g., view their own appointments, create their own AI sessions).

Doctor: Can read data for their assigned patients and write data related to their practice (e.g., create prescriptions, manage their availability).

Pharmacist: Can read and update the status of pending prescription requests.

Hospital Admin: Has broad read access across the hospital's data and write access for managing staff (doctors, pharmacists).

3. Functional Requirements (Epics)
The API's functionality will be built out according to these major epics:

Epic A: Authentication & User Management

The API must integrate with Firebase Auth to validate JWTs from patients who log in via OTP.

It must provide a separate email/password login flow for staff members.

It must handle the creation of user records in our Supabase database and link them to the authentication provider's UID.

Epic B: AI Copilot & Session Management

The API must provide a primary endpoint (/sessions/copilot) to receive natural language queries from users.

It must securely communicate with the Anthropic Claude API, sending structured prompts and handling function-calling responses.

It must persist all conversation transcripts and summaries to the ai_sessions table.

Epic C: Staff & Hospital Management

The API must provide full CRUD (Create, Read, Update, Delete) endpoints for Hospital Admins to manage doctor and pharmacist profiles.

Epic D: Scheduling & Appointments

The API must integrate with the Cal.com API to push doctor availability and create bookings.

It must provide a secure webhook endpoint to receive real-time booking updates from Cal.com.

It must maintain a mirrored version of the schedule in the local appointments table.

It must run a periodic reconciliation job to ensure the local data is in sync with Cal.com.

Epic E: Prescription Workflow

The API must provide endpoints for doctors to create prescriptions and for pharmacists to view and update the status of those prescriptions.

It must manage the state of each prescription (PENDING, APPROVED, etc.).

Epic F: External Integrations & Webhooks

The API must provide a secure endpoint to trigger the Vapi.ai/Twilio callback for the SMS-based rural user flow.

It must provide a secure webhook endpoint to receive and process the conversation transcript after a Vapi.ai call ends.

4. API Specification & Design Principles
Style: The API will be RESTful.

Specification: The design will be formally documented in an OpenAPI 3.0 specification.

Versioning: All endpoints will be versioned, starting with /api/v1.

Data Format: All request and response bodies will be JSON, using snake_case for property names.

Error Handling: The API will use a standardized JSON error format with a machine-readable code and a human-readable message.

5. Non-Functional Requirements (NFRs)
Performance: Standard API responses (P95) should complete in < 200ms.

Security:

All protected endpoints must validate a JWT.

All incoming webhooks must have their signatures validated.

All external API keys and secrets must be stored securely (e.g., KMS) and accessed as environment variables.

Reliability: The API should target 99.9% uptime. The data mirroring and reconciliation job for Cal.com are key reliability features.

Data Residency: All patient data at rest must be stored in the India (Mumbai) region via Supabase.




RESTful API Structure
The API is designed around logical resources (like doctors, patients, appointments) and uses standard HTTP methods for actions. All endpoints are versioned under /api/v1.

Authentication (/api/v1/auth)
Handles login for all user roles.

HTTP Method	Endpoint Path	Description	Access Control
POST	/auth/patient/otp	A patient enters their phone number to receive an OTP via Firebase.	Public
POST	/auth/patient/verify	A patient submits the OTP to get a login token.	Public
POST	/auth/staff/login	A staff member (Admin, Doctor, etc.) logs in with email/password.	Public

🏥 Staff Management
Primarily used by the Hospital Admin.

HTTP Method	Endpoint Path	Description	Access Control
POST	/doctors	Create a new doctor profile and login credentials.	Hospital Admin
GET	/doctors	Get a paginated list of all doctors.	Authenticated User
GET	/doctors/{id}	Get the detailed profile of a single doctor.	Authenticated User
PUT	/doctors/{id}	Update a doctor's profile or availability.	Hospital Admin, Doctor (own profile)
POST	/pharmacists	Create a new pharmacist profile and login credentials.	Hospital Admin
GET	/pharmacists	Get a list of all pharmacists.	Hospital Admin

👤 Patient & Operations
Endpoints for managing the core healthcare workflow.

HTTP Method	Endpoint Path	Description	Access Control
GET	/patients/me	Get the logged-in patient's own record.	Patient
PUT	/patients/me	Update the logged-in patient's own profile.	Patient
POST	/sessions/copilot	Endpoint for all AI Copilot queries.	Authenticated User
GET	/appointments	Get a list of appointments (scoped to the user's role).	Authenticated User
POST	/prescriptions	A doctor creates and sends a new prescription.	Doctor
GET	/prescriptions	Get a list of prescriptions (scoped to the user's role).	Authenticated User
PUT	/prescriptions/{id}	Update a prescription's status (e.g., 'Approved', 'Completed').	Pharmacist, Patient


🔌 External Service Webhooks
Public endpoints called by our external partners.

HTTP Method	Endpoint Path	Description	Called By
POST	/webhooks/cal	Receives booking events from Cal.com to mirror in the DB.	Cal.com
POST	/webhooks/vapi	Receives call session data from Vapi.ai after a phone call.	Vapi.ai



OpenAPI 3.0 Specification
openapi: 3.0.3
info:
  title: "Nabha Healthcare Platform API"
  description: "API for the patient, doctor, and hospital management platform."
  version: "1.0.0"
servers:
  - url: "https://your-api-service.onrender.com/api/v1"
    description: "Production Server (on Render)"

# 1. Reusable Data Schemas
components:
  schemas:
    # User & Staff Schemas
    Doctor:
      type: object
      properties:
        user_id:
          type: string
          format: uuid
        full_name:
          type: string
        specialty:
          type: string
        hospital_id:
          type: string
          format: uuid
    NewDoctor:
      type: object
      required: [email, password, full_name, specialty, hospital_id]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
        full_name:
          type: string
        specialty:
          type: string
        hospital_id:
          type: string
          format: uuid
    Patient:
      type: object
      properties:
        user_id:
          type: string
          format: uuid
        full_name:
          type: string
        date_of_birth:
          type: string
          format: date

    # Operational Schemas
    Prescription:
      type: object
      properties:
        id:
          type: string
          format: uuid
        patient_id:
          type: string
          format: uuid
        doctor_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [PENDING, APPROVED, DENIED, COMPLETED]
        medications:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              dosage:
                type: string
              quantity:
                type: number
    NewPrescription:
      type: object
      required: [patient_id, medications]
      properties:
        patient_id:
          type: string
          format: uuid
        medications:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              dosage:
                type: string
              quantity:
                type: number
    
    # Generic Error Schema
    ApiError:
      type: object
      properties:
        code:
          type: string
          description: "A machine-readable error code."
          example: "resource_not_found"
        message:
          type: string
          description: "A human-readable error message."

  # Security Schemes for JWT
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

# Global Security Requirement
security:
  - bearerAuth: []

# API Endpoints (Paths)
paths:
  # Authentication
  /auth/staff/login:
    post:
      summary: "Staff Login"
      tags: [Authentication]
      security: [] # This endpoint is public
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: "Login successful, returns JWT."
        '401':
          description: "Unauthorized."

  # Doctors
  /doctors:
    get:
      summary: "List all Doctors"
      tags: [Doctors]
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: "A paginated list of doctors."
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Doctor'
    post:
      summary: "Create a new Doctor"
      tags: [Doctors]
      description: "Accessible only by Hospital Admins."
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewDoctor'
      responses:
        '201':
          description: "Doctor created successfully."
          headers:
            Location:
              description: "URL of the newly created doctor."
              schema:
                type: string
                format: uri
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Doctor'

  # Patients
  /patients/me:
    get:
      summary: "Get My Patient Profile"
      tags: [Patients]
      description: "Retrieves the profile for the currently authenticated patient."
      responses:
        '200':
          description: "Successful response"
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Patient'
        '403':
          description: "Forbidden. User is not a patient."

  # Prescriptions
  /prescriptions:
    get:
      summary: "List Prescriptions"
      tags: [Prescriptions]
      description: "Returns a list of prescriptions, scoped to the user's role (patient sees their own, doctor sees theirs, etc.)."
      responses:
        '200':
          description: "A list of prescriptions."
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Prescription'
    post:
      summary: "Create a new Prescription"
      tags: [Prescriptions]
      description: "Accessible only by Doctors."
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPrescription'
      responses:
        '201':
          description: "Prescription created successfully."
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Prescription'

  # Webhooks (Public but secured with signatures)
  /webhooks/cal:
    post:
      summary: "Cal.com Webhook Receiver"
      tags: [Webhooks]
      security: []
      description: "Receives booking events from Cal.com."
      responses:
        '200':
          description: "Webhook received."