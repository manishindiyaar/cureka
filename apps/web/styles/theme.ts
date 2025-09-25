// Hospital Admin Dashboard Theme Configuration
// Professional Navy Blue and Rich Maroon color scheme with minimalist design

const theme = {
  colors: {
    // Primary colors - Professional Navy Blue
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff', 
      200: '#c7d6fe',
      300: '#a5b8fc',
      400: '#8b93f8',
      500: '#1e3a8a', // Main navy blue
      600: '#1e40af',
      700: '#1d4ed8',
      800: '#1e3a8a',
      900: '#1e293b'
    },
    
    // Secondary colors - Rich Maroon
    secondary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca', 
      300: '#fca5a5',
      400: '#f87171',
      500: '#991b1b', // Main maroon
      600: '#b91c1c',
      700: '#dc2626',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    
    // Neutral colors - Professional grays
    neutral: {
      50: '#fafafa', // Soft warm off-white background
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    },
    
    // Status colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    },
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb'
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  },
  
  // Component-specific styling
  components: {
    card: {
      background: 'white',
      border: '1px solid rgb(229 231 235)',
      borderRadius: '0.5rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },
    
    button: {
      primary: {
        background: '#1e3a8a',
        color: 'white',
        hover: '#1e40af'
      },
      secondary: {
        background: '#991b1b', 
        color: 'white',
        hover: '#b91c1c'
      }
    },
    
    sidebar: {
      background: '#1e3a8a',
      width: '16rem',
      textColor: 'white'
    },
    
    modal: {
      backdrop: 'rgba(0, 0, 0, 0.5)',
      background: 'white',
      borderRadius: '0.75rem',
      shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    }
  }
};

export default theme;