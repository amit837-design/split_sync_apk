import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur"; // Glassmorphism
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const BottomNav = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Glassmorphism Container 
        Using BlurView for iOS/Android native blur effect
      */}
      <BlurView
        intensity={30}
        tint={theme.bgCard === "#ffffff" ? "light" : "dark"}
        style={[
          styles.blurContainer,
          {
            borderColor: theme.inputBorder,
            backgroundColor:
              theme.bgCard === "#ffffff"
                ? "rgba(255,255,255,0.85)"
                : "rgba(15, 21, 18, 0.85)",
          },
        ]}
      >
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Handle Navigation Press
            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Define Icons based on route name
            let iconName;
            if (route.name === "Dashboard") iconName = "grid-outline";
            if (route.name === "Chat") iconName = "chatbubble-outline";
            if (route.name === "Settings") iconName = "settings-outline";

            // Special filled icon for active state
            if (isFocused) {
              if (route.name === "Dashboard") iconName = "grid";
              if (route.name === "Chat") iconName = "chatbubble";
              if (route.name === "Settings") iconName = "settings";
            }

            return (
              <TabItem
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
                iconName={iconName}
                label={route.name}
                theme={theme}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

// Sub-component for individual tab animation
const TabItem = ({ isFocused, onPress, iconName, label, theme }) => {
  // Animation Value
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 150,
        damping: 12,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {/* Active Indicator (The Green Glowing Circle) */}
      {isFocused && (
        <Animated.View
          style={[
            styles.activeBlob,
            {
              backgroundColor: theme.accentGreen,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      )}

      {/* Icon */}
      <Ionicons
        name={iconName}
        size={22}
        color={isFocused ? "#000" : theme.textSecondary}
        style={[styles.icon, isFocused && { transform: [{ translateY: -2 }] }]}
      />

      {/* Label (Hidden when active, just like your CSS) */}
      {!isFocused && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
    zIndex: 1000,
  },
  blurContainer: {
    width: width * 0.9,
    maxWidth: 380,
    height: 60,
    borderRadius: 30, // Pill shape
    overflow: "hidden", // Ensures BlurView stays inside radius
    borderWidth: 1,
  },
  tabRow: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  icon: {
    zIndex: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  activeBlob: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    top: 10, // Vertically centered roughly
    zIndex: 1,
    // Green Glow Shadow
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5, // Android shadow
  },
});

export default BottomNav;
