import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Providers
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";

// API Import for the Wake-up Logic
import api from "./src/services/axios";

// We need a wrapper component to access 'useTheme' for the StatusBar
const MainLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <NavigationContainer>
      {/* Controls the top status bar (Battery, Time, Signal) color */}
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  // 🔥 WAKE UP SERVER LOGIC
  useEffect(() => {
    const wakeUp = async () => {
      try {
        console.log("🔔 Pinging server to wake up...");
        // This hits your base URL (or /ping if you added that route) to keep it active
        await api.get("/");
        console.log("✅ Server is awake!");
      } catch (err) {
        // We ignore errors here because even a 404 wakes the server up
        console.log("⚠️ Server pinged (might be waking up).");
      }
    };

    // 1. Ping immediately on App Start
    wakeUp();

    // 2. Ping every 10 minutes (600,000ms) to keep Render active while app is open
    const interval = setInterval(wakeUp, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Add ChatProvider here later when we migrate it */}
        <MainLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
