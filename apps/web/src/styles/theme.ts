import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette based on requirements
export const colors = {
  // Primary colors
  gold: '#FFD700',
  darkGold: '#B8860B',
  
  // CE colors (green shades)
  ceGreen: '#4CAF50',
  ceBrightGreen: '#00E676',
  ceLightGreen: '#81C784',
  
  // PE colors (red shades)
  peRed: '#F44336',
  peBrightRed: '#FF1744',
  pePink: '#F48FB1',
  
  // Highlight colors
  yellow: '#FFEB3B',
  lightGreen: '#C5E1A5',
  
  // Background colors
  dark: '#121212',
  darkGray: '#1E1E1E',
  mediumGray: '#2C2C2C',
  
  // Text colors
  white: '#FFFFFF',
  lightGray: '#B0B0B0',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: colors.gold,
      dark: colors.darkGold,
    },
    secondary: {
      main: colors.ceGreen,
    },
    error: {
      main: colors.peRed,
    },
    background: {
      default: colors.dark,
      paper: colors.darkGray,
    },
    text: {
      primary: colors.white,
      secondary: colors.lightGray,
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
    },
    body2: {
      fontSize: '0.85rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);
