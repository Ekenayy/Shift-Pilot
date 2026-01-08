export const colors = {
  // Primary palette from Coolors
  primary: "#34435E",      // Dark blue/navy - main brand color
  accent: "#ABD3F8",       // Light blue - highlights, active states
  background: "#EBF6FF",   // Very light blue - screen backgrounds
  muted: "#B4B5B8",        // Gray - inactive states, secondary text
  white: "#FFFFFF",        // White - cards, inputs

  // Semantic colors
  text: {
    primary: "#34435E", // Dark blue/navy - main brand color
    secondary: "#6B7280", // Gray - secondary text
    muted: "#B4B5B8", // Gray - inactive states, secondary text
    inverse: "#FFFFFF", // White - cards, inputs
  },

  // UI states
  tabBar: {
    background: "#FFFFFF", // White - tab bar background  
    active: "#34435E", // Dark blue/navy - main brand color
    inactive: "#B4B5B8", // Gray - inactive states, secondary text
    addButton: "#34435E", // Dark blue/navy - main brand color
    lightInactive: '#cdced2', // Light gray - inactive states, secondary text
  },

  // Feedback colors
  success: "#4CAF50", // Green - success
  warning: "#FF9800", // Orange - warning
  error: "#F44336", // Red - error

  // Cards and surfaces
  card: "#FFFFFF", // White - cards, inputs
  border: "#E5E7EB", // Gray - borders
};

export type Colors = typeof colors;
