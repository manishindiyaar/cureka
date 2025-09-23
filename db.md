Database Schema (PostgreSQL DDL)
This script defines all the tables, relationships, constraints, and indexes required for the application. It is designed to be run in a Supabase project.

SQL

-- ========= ENUM TYPES =========
-- Defines reusable types for roles and statuses to ensure data integrity.
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'PHARMACIST', 'HOSPITAL_ADMIN');
CREATE TYPE ai_session_source AS ENUM ('APP', 'PHONE_CALL');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE prescription_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED');
CREATE TYPE webhook_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- ========= IDENTITY & ORGANIZATIONAL TABLES =========

-- Central table for all authenticated users, linked to Supabase Auth.
ALTER TABLE users ADD COLUMN IF NOT EXISTS
    email TEXT UNIQUE,
    password_hash VARCHAR(255),
    hospital_id UUID REFERENCES hospitals(id),
    password_temp BOOLEAN DEFAULT false,
    force_password_change BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP;

COMMENT ON COLUMN users.email IS 'Email for staff members';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for staff members';
COMMENT ON COLUMN users.hospital_id IS 'Hospital association for staff members';
COMMENT ON COLUMN users.password_temp IS 'Indicates if password is temporary and requires change';
COMMENT ON COLUMN users.force_password_change IS 'Forces password change on next login';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.login_attempts IS 'Number of failed login attempts';
COMMENT ON COLUMN users.lockout_until IS 'Timestamp until which account is locked';

-- Shared profile information for all user types.
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    profile_image_url TEXT
);
COMMENT ON TABLE profiles IS 'Stores shared profile data like names and avatars for all user roles.';

-- Table for hospital entities.
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE hospitals IS 'Represents hospital entities that staff members belong to.';

-- ========= ROLE-SPECIFIC PROFILE TABLES =========

CREATE TABLE IF NOT EXISTS doctors (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    specialty TEXT
);
COMMENT ON TABLE doctors IS 'Profile extension for users with the DOCTOR role.';

CREATE TABLE IF NOT EXISTS patients (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE
);
COMMENT ON TABLE patients IS 'Profile extension for users with the PATIENT role.';

CREATE TABLE IF NOT EXISTS pharmacists (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    pharmacy_name TEXT
);
COMMENT ON TABLE pharmacists IS 'Profile extension for users with the PHARMACIST role.';

CREATE TABLE IF NOT EXISTS hospital_admins (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT
);
COMMENT ON TABLE hospital_admins IS 'Profile extension for users with the HOSPITAL_ADMIN role.';

-- ========= AUTHENTICATION TABLES =========

-- Temporary storage for OTP codes used in patient authentication via Twilio.
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL, -- Phone number without '+' prefix
    otp INTEGER NOT NULL, -- 4-digit OTP code
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT otp_valid_range CHECK (otp >= 1000 AND otp <= 9999)
);
COMMENT ON TABLE otps IS 'Temporary storage for OTP codes used in patient phone authentication via Twilio.';

-- Indexes for OTP performance
CREATE INDEX IF NOT EXISTS idx_otps_number ON otps (number);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps (created_at);

-- ========= OPERATIONAL & INTEGRATION TABLES =========

-- Logs all AI interactions.
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
    source ai_session_source NOT NULL,
    vapi_session_id TEXT,
    twilio_call_id TEXT,
    transcript TEXT,
    summary TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE ai_sessions IS 'Logs all patient conversations with the AI, from app or phone.';

-- Local mirror of Cal.com appointment data.
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cal_booking_id TEXT NOT NULL UNIQUE,
    patient_id UUID REFERENCES patients(user_id) ON DELETE SET NULL, -- Nullable to handle guest bookings
    doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
    start_ts TIMESTAMPTZ NOT NULL,
    end_ts TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL,
    cal_raw_payload JSONB NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE appointments IS 'Mirrors booking data from Cal.com for resilience and performance.';

-- Manages medical prescriptions.
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE RESTRICT,
    pharmacist_id UUID REFERENCES pharmacists(user_id) ON DELETE SET NULL,
    medications JSONB NOT NULL,
    status prescription_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE prescriptions IS 'Tracks the lifecycle of a medical prescription.';

-- Internal source of truth for doctor schedules, to be pushed to Cal.com.
CREATE TABLE IF NOT EXISTS doctor_availability (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 for Monday, 7 for Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);
COMMENT ON TABLE doctor_availability IS 'Internal source of truth for doctor schedules to be synced to Cal.com.';

-- Stores every incoming webhook for audit and replay.
CREATE TABLE IF NOT EXISTS cal_webhooks (
    id SERIAL PRIMARY KEY,
    raw_webhook_body JSONB NOT NULL,
    signature_header TEXT,
    status webhook_status NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMPTZ,
    notes TEXT
);
COMMENT ON TABLE cal_webhooks IS 'Logs incoming Cal.com webhooks for audit and replayability.';

-- ========= INDEXES FOR PERFORMANCE =========
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_start ON appointments (patient_id, start_ts);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_start ON appointments (doctor_id, start_ts);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_patient ON ai_sessions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacist ON prescriptions (pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability (doctor_id);
CREATE INDEX IF NOT EXISTS idx_otps_number ON otps (number);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps (created_at);

Key Design Principles
This schema is built on a few core ideas:

Centralized Identity: The users table is the single entry point. Every person who logs in has a record here.

Role-Specific Data: Separate tables like doctors and patients hold data unique to that role, keeping the design clean and scalable.

Resilient Integration: We don't just reference data from Cal.com; we mirror it in the appointments table and log every webhook in cal_webhooks. This makes your application more reliable and independent.

Secure Authentication: OTPs are stored temporarily for phone authentication, and staff credentials include temporary password management.

Entity-Relationship Diagram
This diagram visualizes how the main tables are connected.

Code snippet

erDiagram
    users {
        UUID id PK
        TEXT phone
        TEXT email
        user_role role
        UUID hospital_id
        BOOLEAN password_temp
    }
    profiles {
        UUID user_id PK, FK
        TEXT full_name
    }
    hospitals {
        UUID id PK
        TEXT name
    }
    doctors {
        UUID user_id PK, FK
        UUID hospital_id FK
        TEXT specialty
    }
    patients {
        UUID user_id PK, FK
        DATE date_of_birth
    }
    otps {
        SERIAL id PK
        TEXT number
        INTEGER otp
        TIMESTAMPTZ created_at
    }
    appointments {
        UUID id PK
        TEXT cal_booking_id
        UUID patient_id FK
        UUID doctor_id FK
    }
    prescriptions {
        UUID id PK
        UUID patient_id FK
        UUID doctor_id FK
    }

    users ||--o{ profiles : "has"
    users ||--o{ patients : "is-a"
    users ||--o{ doctors : "is-a"
    users ||--o{ pharmacists : "is-a"
    users ||--o{ hospital_admins : "is-a"
    hospitals ||--|{ doctors : "employs"
    hospitals ||--|{ pharmacists : "employs"
    hospitals ||--|{ hospital_admins : "employs"
    patients ||--|{ appointments : "books"
    doctors ||--|{ appointments : "has"
    patients ||--|{ prescriptions : "receives"
    doctors ||--|{ prescriptions : "writes"
    patients ||--o{ ai_sessions : "interacts"
    users ||--o{ otps : "requests" (temporary)