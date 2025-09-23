Nabha Healthcare Platform Fullstack Architecture Document
1. Introduction
This document outlines the complete fullstack architecture for the healthcare platform. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

Starter Template and Repository Structure
Given the project's composition of a Next.js web platform, a React Native mobile app, and a shared backend API, a monorepo structure is the most effective approach.

Recommendation: Use a Turborepo starter template.

Rationale: Turborepo is a high-performance build system that will allow us to manage all applications and shared code within a single repository, streamlining development and ensuring consistency.

Trade-offs & Considerations: This approach involves a slightly higher initial setup complexity, but this upfront investment pays significant dividends in long-term maintainability and development velocity.

Change Log
Date	Version	Description	Author
Sep 21, 2025	1.0	Final version created.	Winston (Architect)

Export to Sheets
2. High-Level Architecture
Platform and Infrastructure Choice
Frontend Platform: Vercel for Next.js Hosting, Global CDN.

Backend Platform: Render for hosting the Node.js/Express application.

Backend-as-a-Service: Supabase for Database, Authentication, and Real-time.

Data Residency and Networking:

The Supabase database and Vercel frontends will be deployed to the ap-south-1 (Mumbai, India) region.

Render's backend API will be deployed to ap-southeast-1 (Singapore). We assume this multi-region setup is acceptable for compliance, as all sensitive data at rest will reside in India.

High-Level Architecture Diagram
Code snippet

graph TD
    subgraph "User Interfaces"
        WebApp[Web Dashboard <br> (Next.js on Vercel)]
        MobileApp[Patient Mobile App <br> (Expo / React Native)]
    end

    subgraph "Our System"
        APIServer[Backend API <br> (Node.js/Express on Render)]
        Database[Database & Auth <br> (Supabase)]
    end

    subgraph "External Services"
        CalCom[Cal.com API]
        Vapi[Vapi.ai / Twilio]
        Claude[Anthropic Claude API]
    end

    WebApp -->|Makes API Calls| APIServer
    MobileApp -->|Makes API Calls| APIServer
    
    APIServer -->|1. Writes Data| Database
    Database --|>|2. Triggers Realtime Event| WebApp
    Database --|>|3. Triggers Realtime Event| MobileApp
    
    APIServer -->|Books/Queries| CalCom
    APIServer -->|Receives Webhooks| Vapi
    APIServer -->|Processes Language| Claude
3. Tech Stack
Category	Technology	Version	Purpose
FE Language	TypeScript	~5.5	Ensures type safety and code quality.
FE Framework	Next.js	~14.2	React framework for the web dashboard.
Mobile FW	Expo (React Native)	~51.0	Framework for the patient mobile app.
UI Component Lib	Shadcn/ui	~0.8	Unstyled, accessible component library.
State Mgmt	Zustand	~4.5	Minimalist state management for React.
BE Language	TypeScript	~5.5	Consistent with the frontend.
BE Framework	Express.js	~4.19	Web application framework for Node.js.
ORM	Prisma	~5.14	Next-generation ORM for database access.
Database	PostgreSQL	15.x	Relational database provided by Supabase.
Authentication	Firebase Auth	latest	Handles OTP authentication for patients.
CI/CD	GitHub Actions	latest	Automation platform for build and deploy.

Export to Sheets
4. Data Models
The data model is centered around a users table, with separate profile tables for each role (patients, doctors, etc.) and interaction tables (appointments, prescriptions) to link them.

5. API Specification
The system will expose a RESTful API following the OpenAPI 3.0 specification. Endpoints will use snake_case for JSON properties, be secured with JWT Bearer Tokens, and support pagination for list views.

6. Components
The system is broken down into these logical components within the monorepo:

Web Dashboard (Frontend): UI for staff.

Patient Mobile App (Frontend): UI for patients, built with Expo.

Backend API (Node.js/Express): The central server for all business logic.

Copilot AI Service: A module within the Backend API designed for easy extraction into a microservice in the future.

Supabase (BaaS): Provides core database, file storage, and real-time infrastructure.

Shared Packages: Internal libraries for shared-types and config to ensure consistency.

7. External APIs
The platform depends on these key external services:

Anthropic Claude API: Powers the AI Copilot.

Cal.com API: Manages appointment scheduling.

Vapi.ai / Twilio: Handles inbound, real-time voice conversations.

Firebase Auth: Manages patient OTP authentication.

8. Core Workflows
The architecture supports two primary, complex workflows:

AI Copilot Appointment Booking: A multi-step flow where the frontend, backend, Claude API, and Cal.com API interact to book an appointment via natural language.

Offline Phone Call Session Sync: An asynchronous flow where a completed phone call from Vapi triggers a secure webhook to our backend, which then parses and persists the conversation.

9. Database Schema
The database will be managed using Prisma migrations. The schema includes tables for users, profiles, hospitals, role-specific tables (doctors, patients, etc.), and the critical integration tables (appointments, cal_webhooks). All tables will have Row Level Security enabled by default in Supabase.

10. Unified Project Structure
The project will use a Turborepo monorepo structure to organize the code:

apps/: Contains the deployable applications (api, web, mobile).

packages/: Contains shared code (shared-types, config).

11. Development Workflow
Developers will use pnpm as the package manager. A root-level pnpm dev command will start all applications concurrently. Environment variables will be managed via a .env file, templated from .env.example.

12. Deployment Architecture
The platform uses a Git-driven CI/CD workflow with GitHub Actions:

Frontend (web): Deployed automatically to Vercel from the main branch.

Backend (api): Deployed automatically to Render from the main branch.

Pipeline: On every pull request, the pipeline will run linting and testing on only the packages and applications that have changed, leveraging Turborepo's build cache.

