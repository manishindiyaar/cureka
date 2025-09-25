// Simple fix - set this directly based on your setup:
// - For physical device on same network: http://YOUR_COMPUTER_IP:3000/api/v1
// - For Android emulator: http://10.0.2.2:3000/api/v1
// - For iOS simulator: http://localhost:3000/api/v1

// export const API_BASE = `http://localhost:3000/api/v1`;
export const API_BASE = `https://cureka.onrender.com/api/v1`;

export const endpoints = {
  auth: {
    requestOTP: `${API_BASE}/auth/patient/otp/request`,
    verifyOTP: `${API_BASE}/auth/patient/otp/verify`,
    refresh: `${API_BASE}/auth/refresh`,
  },
  patient: {
    profile: `${API_BASE}/patient/profile`,
    update: `${API_BASE}/patient/update`,
  },
  sessions: {
    list: `${API_BASE}/sessions`,
    chat: `${API_BASE}/sessions/copilot`,
    phone: `${API_BASE}/sessions/phone`,
  },
  appointments: {
    list: `${API_BASE}/appointments`,
    book: `${API_BASE}/appointments`,
    doctors: `${API_BASE}/appointments/doctors`,
    slots: `${API_BASE}/appointments/slots`,
  },
  prescriptions: {
    list: `${API_BASE}/prescriptions`,
    markDone: `${API_BASE}/prescriptions/done`,
  },
} as const;