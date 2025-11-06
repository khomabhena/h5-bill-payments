// Color definitions for H5 Bill Payments App
// Official Tapseed Brand Guidelines Colors

export const colors = {
  // App primary colors - Official Tapseed Brand Colors
  app: {
    primary: '#CEFF80',        // Light Green (Primary Brand Color)
    primaryLight: '#E3F1E8',  // Very Light Green/Blue
    primaryDark: '#434E47',   // Medium Dark Green/Grey
    primaryDarker: '#262D29', // Dark Green/Grey
  },

  // Text colors - Using Tapseed Brand Colors
  text: {
    primary: '#262D29',    // Dark Green/Grey (Brand Color)
    secondary: '#434E47',  // Medium Dark Green/Grey (Brand Color)
    tertiary: '#83978A',   // Medium Grey-Green from palette
    inverse: '#ffffff',    // White text
    black: '#262D29',      // Dark Green/Grey (Brand Color)
    button: '#262D29',     // Dark Green/Grey for buttons (on light green background)
  },

  // Background colors - Using Tapseed Brand Colors
  background: {
    primary: '#ffffff',    // White background
    secondary: '#E3F1E8', // Very Light Green/Blue (Brand Color)
    gray: {
      50: '#E3F1E8',      // Very Light Green/Blue (Brand Color)
      100: '#CBE7D5',     // Light Grey-Green from palette
    },
    gradient: {
      green: 'from-#E3F1E8 to-#CEFF80',      // Tapseed green gradient
      brand: 'from-#CEFF80 to-#A0D900',     // Brand green gradient
    }
  },

  // Border colors - Using Tapseed Brand Colors
  border: {
    primary: '#CBE7D5',    // Light Grey-Green from palette
    secondary: '#A6BEAF',  // Medium Light Grey-Green from palette
    accent: '#CEFF80',     // Light Green (Brand Color)
    focus: '#CEFF80',      // Light Green focus
    error: '#fca5a5',      // Light red border (red-300)
    success: '#A0D900',   // Bright Green from palette
    brand: '#CEFF80',     // Light Green (Brand Color)
  },

  // State colors - Using Tapseed Brand Colors
  state: {
    success: '#A0D900',    // Bright Green from palette
    error: '#ef4444',      // Red for error
    warning: '#f59e0b',    // Amber for warning
    info: '#3b82f6',       // Blue for info
    // Lighter versions using brand colors
    successLight: '#CEFF80',  // Light Green (Brand Color)
    errorLight: '#fca5a5',    // red-300
  },

  // Ring/Focus colors - Using Tapseed Brand Colors
  ring: {
    primary: '#CEFF80',    // Light Green focus ring (Brand Color)
    error: '#ef4444',      // Red focus ring
  }
};

// Export default
export default colors;

