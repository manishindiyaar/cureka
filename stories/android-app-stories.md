# Android App Stories - React Native Expo
Based on app_prd.md

## Story 1.1: Project Setup and Navigation Structure

**As a developer**, I want to set up the React Native project with proper navigation structure and tab-based layout so that the app has a solid foundation with navigation between the four main tabs.

### Acceptance Criteria:
1. App has proper navigation infrastructure with bottom tabs
2. Four tabs are implemented: Home, Appointment, Prescription, Settings
3. Tab navigation is working with placeholder screens for each tab
4. App follows PRD color scheme (Deep Blue #1f345a, Rich Maroon #8c1c24)
5. TypeScript is properly configured
6. Navigation types are defined for type safety

### Technical Details:
- Use Expo Router file-based routing in `app/` directory
- Create `(tabs)/_layout.tsx` for tab navigation
- Create screens in `app/(tabs)/`: home.tsx, appointments.tsx, prescription.tsx, settings.tsx
- Configure app colors in `constants/Colors.ts`
- Define navigation types in `types/navigation.ts`
- Style tab bar with PRD color palette

---

## Story 1.2: Authentication UI Implementation

**As a patient**, I want to see welcome screens, enter my phone number, and verify OTP to access the app.

### Acceptance Criteria:
1. Welcome/onboarding screens with 2 preview slides
2. "Get Started" button on last slide
3. Phone number input screen with validation
4. OTP input screen with 6-digit code
5. Name collection screen after OTP
6. Error handling for invalid inputs
7. Loading states during API calls
8. Automatic login if already authenticated

### Technical Details:
- Create `app/index.tsx` for welcome screens
- Create `app/phone.tsx` for phone number input
- Create `app/otp.tsx` for OTP verification
- Use React Hook Form for validation
- Integrate with backend auth endpoints
- Use secure storage for tokens
- Navigate to main app after auth

---

## Story 2.1: Home Screen with AI Talk Feature

**As a patient**, I want to see three tabs on the home screen with the main "Talk to AI assistant" feature prominently displayed.

### Acceptance Criteria:
1. Three tabs at top: Talk, Sessions, Request Video Consultancy
2. "Talk" tab shows large "Talk to AI assistant" button
3. Button has microphone/voice icon
4. Button style follows PRD color scheme
5. Navigation to chat screen on button press
6. Tab navigation works smoothly

### Technical Details:
- Create `app/(tabs)/home.tsx` with top tabs
- Use `expo-router` segmented control or tabs
- Create `components/AITalkButton.tsx` component
- Style with PRD colors (Deep Blue #1f345a)
- Use Large Title for "Talk to AI assistant"
- Navigate to chat screen route

---

## Story 2.2: Chat Interface Implementation

**As a patient**, I want to chat with the AI assistant where I can send messages and receive real-time responses.

### Acceptance Criteria:
1. Chat screen opens when "Talk to AI assistant" is clicked
2. Messages displayed in conversational format
3. User can type and send messages
4. AI responses appear with loading indicator
5. Session is created when first message is sent
6. Session ID persists for the conversation
7. Messages are stored for session history
8. Proper error handling for failed requests

### Technical Details:
- Create `app/chat.tsx` chat screen
- Use `react-native-gifted-chat` or custom chat component
- Integrate with `/api/v1/sessions/copilot` endpoint
- Send patient ID with API calls
- Store session data using state management
- Handle network errors gracefully
- Format timestamps appropriately

---

## Story 2.5: Session History View

**As a patient**, I want to see my past AI conversations including both app-based and offline phone calls.

### Acceptance Criteria:
1. Sessions tab displays list of all AI conversations
2. Includes both app conversations and phone calls
3. Each session card shows date/time, preview, duration
4. Sessions sorted by most recent
5. Tap to view full conversation
6. Pull to refresh for latest sessions
7. Empty state for no sessions
8. Phone sessions linked by phone number matching

### Technical Details:
- Create component in home's Sessions tab
- Use `useQuery` to fetch sessions
- Filter sessions by patient phone number
- Implement lazy loading/infinite scroll
- Cache sessions offline
- Format dates using date utilities
- Include session type indicator

---

## Story 3.1: Appointment Booking - Explore Doctors

**As a patient**, I want to explore doctors and book available appointments through the Appointment tab.

### Acceptance Criteria:
1. Two tabs in Appointment: "Explore" and "View Appointments"
2. Explore shows list of all doctors
3. Doctor cards show name, specialty, picture
4. Tap doctor to see available time slots
5. Calendar view displays bookable slots
6. Book appointment by selecting slot
7. Booking confirmation shown
8. AI assistant can book during conversations
9. Appointments sync to "View Appointments"

### Technical Details:
- Use Stack Navigator in `app/(tabs)/appointments.tsx`
- Create doctor list and detail screens
- Integrate with backend appointment endpoints
- Use calendar component for slot selection
- Handle booking state management
- Store appointment data locally
- Show success/toast notifications

---

## Story 5.3: Prescription Display for Patients

**As a patient**, I want to view doctor-issued prescriptions and mark them as "Done" once completed.

### Acceptance Criteria:
1. Prescription tab shows active prescriptions list
2. Each prescription displays doctor name and details
3. Shows medicine name, dosage, instructions
4. Date issued is visible
5. "Done" button on each prescription
6. Done prescriptions fade and move to "Past"
7. Can't create prescriptions as patient (read-only)
8. Auto-syncs when doctor issues prescription
9. Offline viewing support

### Technical Details:
- Create `app/(tabs)/prescription.tsx`
- Fetch prescriptions by patient ID
- Display prescription card component
- Implement "Done" action with confirmation
- Move done prescriptions to separate section
- Use opacity/styling for done state
- Cache prescriptions for offline viewing
- Handle prescription updates via API

---

## Story 4.1: Settings Tab Implementation

**As a patient**, I want to view and manage my account details and access my patient record from the Settings tab.

### Acceptance Criteria:
1. Settings tab has two main sections
2. "Account Details" with phone number, name
3. "Patient Record" with health information
4. Edit capabilities for allowed fields
5. Sign out option available
6. App version display
7. Privacy policy link
8. Terms of service link

### Technical Details:
- Create `app/(tabs)/settings.tsx`
- Create menu/section components
- Create edit account screen
- Fetch patient data from backend
- Handle form validation
- Implement sign out flow
- Store settings preferences locally