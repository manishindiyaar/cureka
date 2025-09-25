PRD: Hospital Admin Web Dashboard
Version: 1.0
Date: September 25, 2025

1. Introduction & Goals
This document outlines the requirements for the web-based administrative dashboard for the Cureka healthcare platform. The primary goal is to empower Hospital Administrators with a centralized, efficient, and data-rich tool to manage daily operations, oversee medical staff, and ensure a high standard of patient care.

Core Goal 1 (Operational Overview): Provide a "single pane of glass" view of the hospital's real-time status, including staff activity, patient alerts, and appointment volume.

Core Goal 2 (Staff Management): Streamline the complete lifecycle management of doctors and pharmacists, from onboarding to scheduling and removal.

Core Goal 3 (Quality Assurance): Enable admins to monitor and intervene in patient care workflows, such as escalating urgent cases or reassigning pending prescriptions.

2. Target Persona: The Hospital Admin
The Hospital Admin is an operational manager who is tech-savvy but time-poor. They are responsible for the smooth functioning of the hospital.

Needs: Quick access to high-level statistics, the ability to drill down into details to solve problems, and efficient tools for managing staff.

Motivations: Improving hospital efficiency, ensuring patient safety, and maintaining a high standard of care.

3. Functional Requirements (Epics)
The Admin Dashboard will be built around these core functional areas:

Epic 1: Secure Authentication: Provide a secure, hierarchical login system for admins.

Epic 2: Dashboard & Real-Time Monitoring: Display a live overview of hospital operations.

Epic 3: Doctor Lifecycle Management: Manage the entire process of adding, editing, and removing doctors.

Epic 4: Pharmacist Lifecycle Management: Manage the entire process of adding, editing, and overseeing pharmacists.

Epic 5: Patient & Appointment Oversight: Monitor all patients and manage the hospital's master appointment schedule.

4. Detailed User Stories
Epic 1: Secure Authentication
Story: Admin Login

As an Admin, I want to log in with the email and temporary password provided to me, so that I can securely access the dashboard and be prompted to set a permanent password.

Acceptance Criteria:

The login screen accepts an email and password.

A valid, temporary password grants access and forces a password change.

A valid permanent password grants access.

Invalid credentials show a clear "Incorrect credentials" error message.

Epic 2: Dashboard & Real-Time Monitoring
Story: View Dashboard Overview

As an Admin, I want to see a main dashboard with key statistics, so that I can quickly assess the hospital's current status.

Acceptance Criteria:

The dashboard displays statistic cards for "Total Patients," "Active Doctors," "Today's Appointments," and "Prescriptions."

A "Real-Time Alerts" panel is visible, showing urgent updates as they happen.

An "AI Copilot" widget is available for natural language queries.

Story: Use AI Copilot

As an Admin, I want to type natural language questions into the Copilot Box, so that I can get immediate answers without navigating menus.

Acceptance Criteria:

The Copilot accepts queries like "Show me all available doctors."

It returns accurate results based on live data.

It can handle queries about doctors, pharmacists, patients, and appointments.

Epic 3: Doctor Lifecycle Management
Story: View Doctor List

As an Admin, I want to view a list of all doctors, so that I can manage my medical staff.

Acceptance Criteria:

The "Doctor Management" page displays a table or card view of all doctors.

The view shows each doctor's name, specialty, and availability status.

Story: Add a New Doctor

As an Admin, I want to add a new doctor via a form, so that I can onboard new staff members.

Acceptance Criteria:

An "Add Doctor" button opens a modal form.

The form captures the doctor's name, email, specialty, and weekly availability.

Submitting the form creates the doctor's account and generates a temporary password.

Story: Remove a Doctor

As an Admin, I want to remove a doctor from the system, so that I can manage staff departures.

Acceptance Criteria:

A "Delete" option is available for each doctor.

A confirmation prompt appears before deletion.

Upon confirmation, the doctor is removed, and their upcoming appointments are flagged for reassignment.

Epic 4 & 5 (Summarized for brevity)
The user stories for Pharmacist Management, Patient Oversight, and Appointment Management follow the same pattern as Doctor Management:

Admins must be able to view lists of all pharmacists, patients, and appointments.

Admins must be able to view the detailed profile of any individual pharmacist or patient.

Admins must be able to add and edit pharmacists.

Admins must be able to reschedule or cancel any appointment in the system.

5. Non-Functional Requirements
Security: The system must enforce strict Role-Based Access Control (RBAC). An admin can only manage the data for their assigned hospital.

Performance: The main dashboard must load in under 3 seconds. Real-time alerts must appear on the dashboard within 2 seconds of the event occurring.

Reliability: The dashboard must have a target uptime of 99.9%.

Usability: The interface must be intuitive and require minimal training for a tech-savvy operational manager.

Branding: The UI must strictly adhere to the provided color palette (Professional Navy Blue, Rich Maroon, etc.).