## Story 0: File Structure Setup and Configuration

**As a developer**, I want to set up the complete file structure for the React Native Expo app following the PRD specifications and best practices for scalable development.

### Base Requirements:
- React Native with Expo SDK
- TypeScript support
- Expo Router (file-based routing)
- Proper folder structure as defined in PRD

### Acceptance Criteria:

1. **Expo Router File Structure**
   - Implement file-based routing in `app/` directory
   - Create layout groups for different navigation patterns
   - Set up dynamic routes where needed
   - Configure root layout with providers

2. **Directory Structure**
   Create the following directory structure:
   ```
   apps/mobile_app/cureka
   ├── app/                      # Routes using Expo Router
   │   ├── (auth)/                 # Authentication group
   │   │   ├── _layout.tsx         # Auth layout without tabs
   │   │   ├── index.tsx           # Welcome screens
   │   │   ├── phone.tsx           # Phone number input
   │   │   ├── otp.tsx             # OTP verification
   │   │   └── name.tsx            # Name collection
   │   │
   │   ├── (tabs)/                 # Main app with tabs
   │   │   ├── _layout.tsx         # Tab navigation layout
   │   │   ├── home.tsx            # Home screen with 3 subtabs
   │   │   └── +not-found.tsx     # 404 screen
   │   │
   │   ├── (chat)/                 # Chat group
   │   │   ├── _layout.tsx         # Chat layout
   │   │   └── chat.tsx            # AI Chat screen
   │   │
   │   ├── _layout.tsx             # Root app layout
   │   └── +not-found.tsx            # Global 404
   │
   ├── components/                 # Shared UI components
   │   ├── @ui/                    # Design system components
   │   │   ├── Button.tsx
   │   │   ├── Card.tsx
   │   │   ├── Input.tsx
   │   │   └── Text.tsx
   │   │
   │   ├── forms/                   # Form components
   │   │   ├── PhoneNumberInput.tsx
   │   │   ├── OtpInput.tsx
   │   │   └── NameInput.tsx
   │   │
   │   ├── navigation/              # Navigation components
   │   │   └── TabBar.tsx
   │   │
   │   └── features/                # Feature-specific components
   │       ├── ChatInterface.tsx
   │       ├── DoctorCard.tsx
   │       ├── SessionCard.tsx
   │       └── PrescriptionCard.tsx
   │
   ├── constants/                  # App constants
   │   ├── colors.ts               # PRD color scheme
   │   ├── endpoints.ts              # API endpoints
   │   ├── styles.ts                 # Global styles
   │   └── config.ts                 # App configuration
   │
   ├── hooks/                      # Custom React hooks
   │   ├── useAuth.ts              # Authentication hook
   │   ├── useAPI.ts               # API calling hook
   │   ├── useChat.ts              # Chat functionality
   │   ├── useAppointments.ts      # Appointment management
   │   ├── usePrescriptions.ts    # Prescription management
   │   └── usePermissions.ts      # Permission handling
   │
   ├── lib/                        # Utilities and services
   │   ├── api.ts                  # API client setup
   │   ├── store.ts                # State management
   │   ├── storage.ts              # Local storage
   │   └── utils/                   # Utility functions
   │       ├── formatters.ts
   │       ├── validators.ts
   │       ├── date.ts
   │       └── phoneNumber.ts
   │
   ├── types/                        # TypeScript definitions
   │   ├── api.ts                  # API response types
   │   ├── navigation.ts           # Navigation types
   │   ├── auth.ts                 # Auth-related types
   │   └── models.ts                # Data models
   │
   ├── tests/                      # Test files
   │   ├── unit/                   # Unit tests
   │   ├── integration/            # Integration tests
   │   └── e2e/                    # End-to-end tests
   │
   └── __tests__/                  # Jest test
       └── App.test.tsx
   ```

3. **Configuration Files**
   Create and configure:
   - `app.json` with proper app configuration
   - `babel.config.js` for path aliases
   - `tsconfig.json` for TypeScript
   - `metro.config.js` for Metro bundler
   - `.env` for environment variables

### Technical Implementation:

```tsx
// app.json
{
  "expo": {
    "name": "Nabha Patient App",
    "slug": "nabha-patient",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1f345a"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1f345a"
      },
      "package": "com.nabha.patient"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

```tsx
// constants/colors.ts - PRD Colors
export const Colors = {
  primaryDark: '#1f345a',      // Deep Blue
  primaryLight: '#8c1c24',    // Rich Maroon (Accent)
  primaryYellow: '#f9d46a',   // Golden Gradient Light
  primaryOrange: '#e8a94d',   // Golden Gradient Dark
  background: '#f8f4e9',       // Off-White/Cream
  white: '#ffffff',
  black: '#000000',
  gray: {
    100: '#f7fafc',
    200: '#edf2f7',
    300: '#e2e8f0',
    400: '#cbd5e0',
    500: '#a0aec0',
    600: '#718096',
    700: '#4a5568',
    800: '#2d3748',
    900: '#1a202c',
  },
} as const;
```

```tsx
// constants/endpoints.ts
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const endpoints = {
  auth: {
    requestOTP: '/auth/patient/otp/request',
    verifyOTP: '/auth/patient/otp/verify',
    refresh: '/auth/refresh',
  },
  patient: {
    profile: '/patient/profile',
    update: '/patient/update',
  },
  sessions: {
    list: '/sessions',
    chat: '/sessions/copilot',
    phone: '/sessions/phone',
  },
  appointments: {
    list: '/appointments',
    book: '/appointments/book',
    doctors: '/appointments/doctors',
    slots: '/appointments/slots',
  },
  prescriptions: {
    list: '/prescriptions',
    markDone: '/prescriptions/done',
  },
} as const;
```

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "jsx": "react-native",
    "lib": ["dom", "esnext"],
    "moduleResolution": "node",
    "module": "esnext",
    "resolveJsonModule": true,
    "strict": true,
    "target": "esnext",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "extends": "expo/tsconfig.base"
}
```

```tsx
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json', '.svg', '.png'],
          root: ['./src'],
          alias: {
            '@/components': './src/components',
            '@/constants': './src/constants',
            '@/hooks': './src/hooks',
            '@/lib': './src/lib',
            '@/types': './src/types',
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

```tsx
// hooks/useStorage.ts
import * as SecureStore from 'expo-secure-store';

export const saveSecure = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Secure store save error:', error);
  }
};

export const getSecure = async (key: string) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Secure store get error:', error);
    return null;
  }
};

export const removeSecure = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Secure store delete error:', error);
  }
};
```

### Directory Creation Script

Create a script to set up the complete structure:

```bash
#!/bin/bash
# setup-structure.sh

echo "Setting up React Native Expo app file structure..."

# Create directories
mkdir -p app/{(auth),(tabs),(chat)}
mkdir -p components/{@ui,forms,navigation,features}
mkdir -p constants hooks lib utils tests/types/{auth}
mkdir -p __tests__/unit __tests__/integration __tests__/e2e

# Create placeholder files
touch app/_layout.tsx
for dir in (auth) (tabs) (chat); do
  touch app/$dir/_layout.tsx
done

echo "Directory structure created!"
echo "
Next steps:
1. npm install @react-navigation/native @react-navigation/native-stack expo-router
2. Configure app.json for plugins
3. Set up environment variables
4. Install dependencies for UI components"
```

### Package.json Dependencies:

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "expo-router": "~2.0.0",
    "expo-secure-store": "~12.5.0",
    "expo-splash-screen": "~0.20.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native-stack": "^6.9.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "~18.2.0",
    "@types/react-native": "0.72.0",
    "jest": "^29.5.0",
    "jest-expo": "~49.0.0"
  }
}
```

### Testing the Setup:

```tsx
// tests/setup.test.ts
describe('Project Setup', () => {
  it('has all required directories', () => {
    const requiredPaths = [
      'app',
      'components',
      'constants',
      'hooks',
      'lib',
      'types',
      'tests'
    ];

    requiredPaths.forEach(path => {
      expect(fs.existsSync(`src/${path}`)).toBe(true);
    });
  });

  it('has valid babel configuration', () => {
    const babelConfig = require('./babel.config.js');
    expect(babelConfig.plugins).toBeDefined();
    expect(babelConfig.plugins.some(p => p[0] === 'module-resolver')).toBe(true);
  });

  it('has proper TypeScript configuration', () => {
    const tsConfig = require('./tsconfig.json');
    expect(tsConfig.compilerOptions.paths).toBeDefined();
    expect(tsConfig.compilerOptions.paths['@/*']).toBe(['./src/*']);
  });
});
```

### PRD Alignment Notes:

- **Color Scheme**: Exact colors from PRD (Deep Blue #1f345a, Rich Maroon #8c1c24)
- **Navigation Pattern**: Bottom tabs as specified
- **File Structure**: Matches PRD recommendations
- **TypeScript**: Full type safety
- **Testing Structure**: Comprehensive test organization
- **State Management**: Prepared for future Redux/Context implementation
- **API Integration**: Structured for seamless backend connection