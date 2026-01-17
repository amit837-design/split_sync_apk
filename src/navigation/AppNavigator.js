import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Context
import { useTheme } from "../context/ThemeContext";

// Components
import BottomNav from "../components/BottomNav";
import { withScreenWrapper } from "../components/withScreenWrapper"; // 🔥 IMPORT HOC

// --- SCREENS ---
import SignupScreen from "../screens/SignupScreen";
import ChatListScreen from "../screens/app_pages/ChatListScreen";
import DashboardScreen from "../screens/app_pages/DashboardScreen";
import SettingsScreen from "../screens/app_pages/SettingsScreen";
import ChatWindowScreen from "../screens/app_pages/ChatWindowScreen";
import UserProfileScreen from "../screens/app_pages/UserProfileScreen";
import EditProfileScreen from "../screens/app_pages/EditProfileScreen";
import GroupInfoScreen from "../screens/app_pages/GroupInfoScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 🔥 WRAP SCREENS AUTOMATICALLY
// This fixes the Status Bar overlap on all these screens instantly.
const WrappedSignup = withScreenWrapper(SignupScreen);
const WrappedChatList = withScreenWrapper(ChatListScreen);
const WrappedDashboard = withScreenWrapper(DashboardScreen);
const WrappedSettings = withScreenWrapper(SettingsScreen);
const WrappedUserProfile = withScreenWrapper(UserProfileScreen);
const WrappedEditProfile = withScreenWrapper(EditProfileScreen);
const WrappedGroupInfo = withScreenWrapper(GroupInfoScreen);

// Note: We usually DON'T wrap ChatWindowScreen here if it already has 
// its own SafeAreaView logic (which it often does for keyboard handling).
// If ChatWindow looks broken, you can change this to: withScreenWrapper(ChatWindowScreen)
const WrappedChatWindow = ChatWindowScreen; 

/**
 * 1️⃣ Main Tab Navigator
 */
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "absolute" },
      }}
    >
      {/* Use the WRAPPED versions here */}
      <Tab.Screen name="Chat" component={WrappedChatList} />
      <Tab.Screen name="Dashboard" component={WrappedDashboard} />
      <Tab.Screen name="Settings" component={WrappedSettings} />
    </Tab.Navigator>
  );
};

/**
 * 2️⃣ Root Stack Navigator
 */
const AppNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bgMain },
        animation: "slide_from_right",
      }}
    >
      {/* Auth */}
      <Stack.Screen name="Signup" component={WrappedSignup} />

      {/* Main App */}
      <Stack.Screen name="MainApp" component={MainTabNavigator} />

      {/* Details */}
      <Stack.Screen name="ChatWindow" component={WrappedChatWindow} />
      <Stack.Screen name="UserProfile" component={WrappedUserProfile} />
      <Stack.Screen name="EditProfile" component={WrappedEditProfile} />
      <Stack.Screen name="GroupInfo" component={WrappedGroupInfo} />
    </Stack.Navigator>
  );
};

export default AppNavigator;