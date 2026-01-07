export const colors = {
  // Primary palette from Coolors
  primary: "#34435E",      // Dark blue/navy - main brand color
  accent: "#ABD3F8",       // Light blue - highlights, active states
  background: "#EBF6FF",   // Very light blue - screen backgrounds
  muted: "#B4B5B8",        // Gray - inactive states, secondary text
  white: "#FFFFFF",        // White - cards, inputs

  // Semantic colors
  text: {
    primary: "#34435E",
    secondary: "#6B7280",
    muted: "#B4B5B8",
    inverse: "#FFFFFF",
  },

  // UI states
  tabBar: {
    background: "#FFFFFF",
    active: "#34435E",
    inactive: "#B4B5B8",
    addButton: "#34435E",
  },

  // Feedback colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",

  // Cards and surfaces
  card: "#FFFFFF",
  border: "#E5E7EB",
};

export type Colors = typeof colors;
