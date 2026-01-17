import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Image,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  Animated,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- ANIMATION COMPONENT ---
// Runs a "Waterfall Fade-In" every time the screen is focused
const AnimatedItem = ({ children, index }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current;

  useFocusEffect(
    useCallback(() => {
      // 1. Reset
      fade.setValue(0);
      slide.setValue(50);

      // 2. Play
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 500,
          delay: index * 100, // Staggered delay
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 18,
          stiffness: 100,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, [index])
  );

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      {children}
    </Animated.View>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [userInfo, setUserInfo] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeSupportIndex, setActiveSupportIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load User
  useEffect(() => {
    AsyncStorage.getItem("userInfo").then((json) => {
      if (json) {
        const data = JSON.parse(json);
        setUserInfo(data.user || data || {});
      }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userInfo");
    navigation.replace("Signup");
  };

  const toggleSupport = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSupportIndex(activeSupportIndex === index ? null : index);
    setCopied(false);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic Styles
  const dynamicStyles = {
    header: {
      backgroundColor: theme.bgCard,
      borderBottomColor: theme.inputBorder,
    },
    textPrimary: { color: theme.textPrimary },
    textSecondary: { color: theme.textSecondary },
    sectionTitle: { color: theme.textSecondary },
    item: {
      backgroundColor: theme.bgCard,
      borderBottomColor: theme.inputBorder,
    },
    avatar: { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
    emailBox: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
    },
    emailText: { color: theme.accentGreen },
  };

  const renderAccordion = (index, title, content, email) => {
    const isOpen = activeSupportIndex === index;
    return (
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderBottomWidth: 1,
          borderColor: theme.inputBorder,
        }}
      >
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => toggleSupport(index)}
          activeOpacity={0.7}
        >
          <Text style={[styles.settingLabel, dynamicStyles.textPrimary]}>
            {title}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
            style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.accordionContent}>
            <Text style={[styles.accordionText, dynamicStyles.textSecondary]}>
              {content}
            </Text>
            <View style={[styles.emailBox, dynamicStyles.emailBox]}>
              <Text style={dynamicStyles.emailText}>{email}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(email)}>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={18}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false} // 🔥 SCROLL BAR REMOVED
      >
        {/* 1. Account */}
        <AnimatedItem index={0}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            ACCOUNT
          </Text>
          <View
            style={[
              styles.profileCard,
              dynamicStyles.item,
              { borderWidth: 1, borderColor: theme.inputBorder },
            ]}
          >
            <View style={[styles.avatar, dynamicStyles.avatar]}>
              {userInfo.avatar ? (
                <Image
                  source={{ uri: userInfo.avatar }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={{ color: theme.textSecondary, fontSize: 18 }}>
                  {userInfo.name?.[0]}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, dynamicStyles.textPrimary]}>
                {userInfo.name}
              </Text>
              <Text style={[styles.profileEmail, dynamicStyles.textSecondary]}>
                {userInfo.email}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: theme.inputBorder }]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Text style={[styles.editBtnText, dynamicStyles.textPrimary]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedItem>

        {/* 2. Preferences */}
        <AnimatedItem index={1}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            PREFERENCES
          </Text>
          <View
            style={[
              styles.settingItem,
              dynamicStyles.item,
              {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderWidth: 1,
                borderColor: theme.inputBorder,
                borderBottomWidth: 1,
              },
            ]}
          >
            <View>
              <Text style={[styles.settingLabel, dynamicStyles.textPrimary]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDesc, dynamicStyles.textSecondary]}>
                Use dark theme across the app
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: theme.accentGreen }}
              thumbColor="#f4f3f4"
            />
          </View>
        </AnimatedItem>

        {/* 3. Security */}
        <AnimatedItem index={2}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            SECURITY
          </Text>
          <TouchableOpacity
            style={[
              styles.settingItem,
              dynamicStyles.item,
              {
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.inputBorder,
              },
            ]}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={[styles.settingLabel, dynamicStyles.textPrimary]}>
              Change Password
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </AnimatedItem>

        {/* 4. Support */}
        <AnimatedItem index={3}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
            SUPPORT
          </Text>
          <View
            style={{
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: theme.inputBorder,
            }}
          >
            {renderAccordion(
              1,
              "Help Center",
              "Need help navigating the app? Check our FAQ or contact support.",
              "support@yourapp.com"
            )}
            {renderAccordion(
              2,
              "Report a Bug",
              "Found something weird? Let us know!",
              "bugs@yourapp.com"
            )}
          </View>
        </AnimatedItem>

        {/* 5. Logout */}
        <AnimatedItem index={4}>
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.2)",
                },
              ]}
              onPress={handleLogout}
            >
              <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
                Log Out
              </Text>
            </TouchableOpacity>
            <Text style={[styles.version, dynamicStyles.textSecondary]}>
              Version 1.0.0
            </Text>
          </View>
        </AnimatedItem>
      </ScrollView>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  profileName: { fontSize: 18, fontWeight: "700" },
  profileEmail: { fontSize: 13 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  settingLabel: { fontSize: 16, fontWeight: "500" },
  settingDesc: { fontSize: 13, marginTop: 4 },
  accordionContent: {
    padding: 18,
    paddingTop: 0,
  },
  accordionText: { fontSize: 14, marginBottom: 12, lineHeight: 22 },
  emailBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutSection: { marginTop: 40 },
  logoutBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  version: { textAlign: "center", marginTop: 16, fontSize: 12 },
});

export default SettingsScreen;
