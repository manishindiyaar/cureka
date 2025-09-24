Product Requirements Document: Nabha Patient App
Version: 1.0
Date: September 24, 2025
Author: John, Product Manager

1. Goals and Background Context
Goals
To provide a simple, intuitive onboarding and login experience for patients using their phone number.

To create a persistent and automatically synced record of all patient interactions, whether they occur in-app or via an offline phone call.

To deliver a powerful AI assistant that provides real-time help, books appointments, and retrieves information for the patient.

To enable patients to seamlessly browse for doctors, book appointments, and view their prescription history.

To ensure the application's look and feel is trustworthy and professional, adhering to the defined color palette.

Background Context
This document outlines the requirements for a patient-facing Android application. The app's core purpose is to provide patients with a single, accessible touchpoint for managing their healthcare journey. Key features include a revolutionary AI assistant for real-time interaction, integrated appointment scheduling, and a clear view of their medical records and prescriptions. The system is designed to bridge the gap for users with limited internet access by ensuring that offline phone call interactions are seamlessly synced with their in-app records.

2. Requirements
Functional Requirements
FR1: The app must support a one-time account setup and subsequent logins for patients using a phone number and OTP.

FR2: All user data must be automatically synced to the app upon login.

FR3: The main app interface must consist of four primary tabs: Home, Appointment, Prescription, and Settings.

FR4: The Home tab must feature an AI assistant that can be activated by the user, and all conversations (sessions) must be persistently stored and viewable.

FR5: The AI assistant must be able to perform real-time actions, such as booking an appointment or retrieving doctor information during a conversation.

FR6: AI sessions from offline phone calls made from the same phone number must be synced and visible within the app.

FR7: The Appointment tab must allow patients to explore doctor profiles and book available time slots.

FR8: The Appointment tab must display a list of all upcoming and past appointments, including those booked by the AI.

FR9: The Prescription tab must display a read-only list of prescriptions sent by a doctor.

FR10: Patients must be able to mark a prescription as "Done," moving it to a past prescriptions record.

FR11: The Settings tab must provide access to the user's account details and patient record.

Non-Functional Requirements
NFR1 (Performance): The app must sync data efficiently and provide real-time updates for new prescriptions and appointments.

NFR2 (Usability): The user interface must be simple, clear, and intuitive for users with varying levels of technical literacy.

NFR3 (Security): All patient data, both at rest and in transit, must be encrypted and handled securely.

NFR4 (Reliability): The connection and sync between offline phone calls and the in-app data must be highly reliable.

NFR5 (Branding): The app's visual design must adhere to the specified color palette.

3. User Interface Design Goals
Overall UX Vision
The platform's user experience must be defined by simplicity for patients. The patient-facing Android app must be intuitive, accessible, and require minimal technical literacy to use its core features.

Key Interaction Paradigms
Copilot-First: The primary method of complex interaction should be the Copilot Box.

Simple Tab-Based Navigation: The Android app will use a standard bottom tab bar for easy navigation.

Branding & Color Palette
The visual identity should be clean, professional, and trustworthy, using the following colors:

Deep Blue (Primary): Hex: #1f345a

Rich Maroon (Accent): Hex: #8c1c24

Golden Gradient (Accent): Lighter: #f9d46a, Darker: #e8a94d

Off-White/Cream (Background): Hex: #f8f4e9

Accessibility
The application should target WCAG 2.1 Level AA compliance to ensure it is usable by people with a wide range of disabilities.

4. Technical Assumptions
Repository Structure: Monorepo managed with Turborepo.

Service Architecture: A dedicated Node.js/Express API server on Render using Supabase as the BaaS.

Authentication: Twilio will be used for the custom OTP solution.

Testing: A comprehensive testing pyramid (Unit, Integration, E2E) is required.

5. Epic & Story Details
Epic 1: Foundation & Patient Onboarding
Goal: Establish the core project infrastructure and implement the complete patient registration and login flow via the Android app.

Story 1.1: Project Scaffolding: As a developer, I want the monorepo structure with all required applications and packages to be set up.

Story 1.2: Cloud Services Setup: As a developer, I want the Supabase, Render, and Twilio services to be configured.

Story 1.3: Patient Onboarding UI: As a new patient, I want to see welcome screens and an option to enter my phone number.

Story 1.4: Patient OTP Authentication: As a patient, I want to receive and verify an OTP via SMS using Twilio to securely log in.

Story 1.5: Main App Shell Navigation: As an authenticated patient, I want to see the main application shell with the four navigation tabs.

Epic 2: Core AI Interaction & Session Management
Goal: Implement the primary "Talk to AI Assistant" feature, connecting it to the backend and ensuring all conversations are persistently stored and reviewable.

Story 2.1: Home Screen UI Implementation: As a patient, I want to see a clear interface on the home screen to start a conversation with the AI.

Story 2.2: Basic Chat Interface: As a patient, I want to be taken to a chat screen when I decide to talk to the assistant.

Story 2.3: Connect Chat UI to Backend Copilot: As a developer, I want to connect the chat UI to the backend's /sessions/copilot endpoint.

Story 2.4: Persistent Session Creation: As a patient, I want my conversation with the AI to be saved automatically.

Story 2.5: Session History View: As a patient, I want to see a list of my past AI conversations.

Story 2.6: View Session Details: As a patient, I want to tap on a past session to view the full conversation.

Epic 3 & 4: Staff Dashboards & Appointment Booking
(These epics relate to the staff-facing web application and are detailed in the full system PRD. This document focuses on the Patient App.)

Epic 5: Prescription Workflow (Patient View)
Goal: Enable patients to view the prescriptions issued to them by doctors.

Story 5.3 (Patient): Patient Views Prescription: As a patient, I want to see any new prescriptions from my doctor in my app.

Story 5.6 (Patient): Patient Marks Prescription as Completed: As a patient, I want to mark a prescription as "Done" after I have received my medicine.

Epic 6: Rural Offline System Sync
Goal: Ensure that interactions from the SMS-triggered offline call system are reflected in the patient's in-app history.

Story 6.5 (Patient): Context-Aware AI for Phone Call Users: As an offline patient, I want the AI to remember my past conversations so that I have a continuous and context-aware experience.





# ROUGH IDEA

ok now lets discuss how they will be interacting with the platform and how everything will connect basically an entire user experience.


Patient App
1) user comes download the android app.
2) user see one-two welcome preview slide screen and then one button "Get started"
3) when "Get started" get clicked then it ask your "Phone Number" enter phone number and get the "OTP" , otp matched and they get authenticated
4) ask few question like name and done. account setuped
5) if account is already created before but next time when they want to login they should just enter the phone number and otp and they will be logged in.
6) if account is already logged in and and user comes then all the data connected with that account should be synced properly.
7) ok if user comes in there should be four tab 1. Home 2. Appointment 3. Prescription 4. Settings
8) In the Home section there will be be three tab on top 1.'Talk' 2.'Sessions' and 3.'Request Video Consultancy' main hero button "Talk to AI assistant" with one big iconic icon it will come when automatical and this time it is inside first tab which is 'Talk' when it is clicked then only
9) How offline phone call session will be synced to thissss?? so to solve this problem we will check if the call has been made from the same phone number then it will automatically synced all the session and patient records basically it will connected by reference. so it does not matter u make call from phone number or by using app. all the session will be stored in db and those data will be shown in app itself.
10) let's talk about "Talk to AI assistant" feature this is the main core feature and everything revolves around this means all things that has been said by the patient will get logged and analyzed properly and based on the conversation functionality work let's say patients clicks on the Voice Icon "AI agent activated" 
11) in the processes of voice interaction , ai will take action on the spot like if assitant are talking it can tell you the appointment available can book appointment , can fetch doctor information and their background can retrieve info on the spot in realtime
12) and for each session one it will save this to db and all the session will be persistent and all the session will be listed in list view and can be shown when click on that specific list.
13) and when we click on specific session it will further show session summary, action taken and then appointed doctor name and their detail and also show session duration time.
14) how appointment will look like ?? so this user have to click on appointment tab , in that appointment tab there will few two tab  1.explore and 2.view appointment. In the Explore tab it will show all the doctor list with their name and background and when user click on that doctor div it will further show appointment slot available and can show when it is available also show when the slot is booked basically a calender type of format and user can book appointment by clicking on available slots.
15) In the "View Appointment" tab user will be able see created appointment. **connection** : here appointment will be shown and this appointment.u also remember u know when user is in the voice agent interaction they get appointment booked in real time and then and that booked appointment will be shown in the "View Appointment" Tab as appointment card and will have attributes like time, date ,doctor name ,address and doctor name and and its not editable it's view only. and when user click on that appointment card they will see whole new page where they get all the details and instruction. also when user book appointment through manual "Explore" tab and if appointment successfully booked then that booked appointment will be shown in "View Appointment" Tab.
16) "Prescription" Tab : user will have only only view only permission for this tab. and user will never gonna take prescription by himself, the prescription will be sent by doctor if doctor send prescription then that prescription will be directly shown to the prescription tab and when we click on that particular prescription we get all the details like when to take this dose how to take this dose and it will be coming directly from doctors. ...and there will one button inside prescription page "Done" button when it's clicked the  the prescription card will decrease their opacity it will become low fade and it will be moved into Past Prescription.
17) "Settings" tab will have two menu 1.Account detail 2.patient record





------
# FILE STRUCTURE

Expo (React Native) File Structure
Plaintext

apps/mobile/
├── app/                      # 🤖 Expo Router directory. Files here automatically become routes.
│   ├── (tabs)/               # A "layout group" for screens that share the main tab bar.
│   │   ├── _layout.tsx         # Defines the shared tab bar navigation UI.
│   │   ├── home.tsx            # The Home screen component (/home).
│   │   ├── appointments.tsx    # The Appointments screen component (/appointments).
│   │   ├── prescription.tsx    # The Prescription screen component (/prescription).
│   │   └── settings.tsx        # The Settings screen component (/settings).
│   │
│   ├── _layout.tsx             # The root layout for the entire app (e.g., sets up providers).
│   ├── index.tsx               # The initial screen of the app (splash/welcome/login).
│   └── modal.tsx               # Example of a modal screen that can be presented over any tab.
│
├── assets/                   # 🖼️ Static assets
│   ├── fonts/                # Custom fonts (e.g., Poppins-Regular.ttf).
│   └── images/               # App logos, icons, illustrations.
│
├── components/               # 🧩 Reusable UI components
│   ├── StyledButton.tsx      # A custom button used throughout the app.
│   ├── Card.tsx              # A generic card component.
│   └── FormField.tsx         # A reusable text input with a label.
│
├── constants/                # 🎨 Static values and configurations
│   ├── Colors.ts             # Your app's color palette.
│   └── Api.ts                # API base URL and endpoint paths.
│
├── hooks/                    # 🎣 Custom React hooks for business logic
│   ├── useAuth.ts            # Logic for authentication state and actions.
│   └── useAppointments.ts    # Logic for fetching and managing appointments.
│
├── lib/                      # 📚 Library code, services, and utilities
│   └── api.ts                # Configuration for your API client (e.g., Axios).
│
├── app.json                  # Expo's main configuration file.
├── babel.config.js           # Babel configuration.
├── package.json              # Project dependencies.
└── tsconfig.json             # TypeScript configuration.

Architectural Rationale
This structure is designed for clarity and scalability:

Routing in app/: We use Expo's file-based router. This is powerful because your file system is your navigation structure. Creating a new file in the app directory automatically creates a new screen in your app. The (tabs) folder is a special layout that lets you share a common UI (like a bottom tab bar) across a group of screens.

Reusable Components in components/: This is for your "dumb" UI components that are used in multiple places (e.g., a custom button). This promotes reusability and makes it easy to maintain a consistent design system.

Logic Abstraction in hooks/ & lib/: All complex business logic and API interactions are pulled out of your screen components and placed into custom hooks (useAuth) or service files (lib/api.ts). This keeps your screen files clean, readable, and focused only on layout and presentation.

Centralized Constants in constants/: Storing values like your color palette or API URLs in one place makes the app much easier to update and maintain.