import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

// 1. Define Colors from your CSS
const colors = {
  dark: {
    bgMain: "#0b0f0d",
    bgCard: "#0f1512",
    textPrimary: "#ffffff",
    textSecondary: "#9ca3af",
    accentGreen: "#22c55e",
    inputBg: "#0c1310",
    inputBorder: "#1f2937",
    error: "#ef4444",
  },
  light: {
    bgMain: "#f0fdf4",
    bgCard: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    accentGreen: "#16a34a",
    inputBg: "#f3f4f6",
    inputBorder: "#e5e7eb",
    error: "#ef4444",
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Auto-detect phone's system theme (Light/Dark)
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

  // Toggle function for Settings page
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // The active theme object
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook to use colors easily in any component
export const useTheme = () => useContext(ThemeContext);
