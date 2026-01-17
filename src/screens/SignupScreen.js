import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// API & Context
import { useTheme } from "../context/ThemeContext";
import { loginUser, registerUser } from "../services/auth.api";

// Components
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import OTPModal from "../components/OTPModal";

const SignupScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  const [showOTP, setShowOTP] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper to update form
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  // --- Handle successful OTP Verification ---
  const handleOTPSuccess = async (userData) => {
    setShowOTP(false);

    if (userData && userData.token) {
      await AsyncStorage.setItem("userInfo", JSON.stringify(userData));
      console.log("Signup + Verify Successful. Redirecting...");
      navigation.replace("MainApp");
    } else {
      setMode("login");
      setAuthMessage({ type: "success", text: "Verified! Please login now." });
    }
  };

  const handleAuth = async () => {
    if (loading) return;
    setAuthMessage(null);

    // 🔥 VALIDATION: Check password length for Signup
    if (mode === "signup" && form.password.length < 6) {
      setAuthMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await registerUser({
          name: form.name,
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        setShowOTP(true);
        setAuthMessage({ type: "success", text: "OTP sent to email" });
      } else {
        const response = await loginUser({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });

        if (response.data.token) {
          await AsyncStorage.setItem("userInfo", JSON.stringify(response.data));
          navigation.replace("MainApp");
        }
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setAuthMessage({
        type: "error",
        text: err.response?.data?.message || "Authentication failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Styles based on Theme
  const dynamicStyles = {
    container: { backgroundColor: theme.bgMain },
    text: { color: theme.textPrimary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
    placeholder: theme.textSecondary,
    button: { backgroundColor: theme.accentGreen },
    buttonSecondaryBg: theme.inputBg,
    link: theme.textSecondary,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, dynamicStyles.container]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={[styles.title, dynamicStyles.text]}>
            {mode === "signup" ? "Signup" : "Login"}
          </Text>

          {mode === "signup" && (
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Name"
              placeholderTextColor={dynamicStyles.placeholder}
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
              editable={!loading}
            />
          )}

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Email"
            placeholderTextColor={dynamicStyles.placeholder}
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
            editable={!loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, dynamicStyles.input, { paddingRight: 50 }]}
              placeholder="Password (at least 6 characters)"
              placeholderTextColor={dynamicStyles.placeholder}
              value={form.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {authMessage && (
            <Text
              style={[
                styles.message,
                {
                  color:
                    authMessage.type === "error"
                      ? theme.error
                      : theme.accentGreen,
                },
              ]}
            >
              {authMessage.text}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.btn,
              dynamicStyles.button,
              loading && { opacity: 0.7 },
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {mode === "signup" ? "Signup" : "Login"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnSecondary,
              { backgroundColor: dynamicStyles.buttonSecondaryBg },
            ]}
            onPress={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setForm({ name: "", email: "", password: "" });
              setAuthMessage(null);
            }}
            disabled={loading}
          >
            <Text style={[styles.btnText, { color: theme.textSecondary }]}>
              Switch to {mode === "signup" ? "Login" : "Signup"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowForgot(true)}
            disabled={loading}
          >
            <Text style={[styles.forgotLink, { color: theme.textSecondary }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- MODALS --- */}
        <OTPModal
          visible={showOTP}
          email={form.email}
          onClose={() => setShowOTP(false)}
          onSuccess={handleOTPSuccess}
        />

        <ForgotPasswordModal
          visible={showForgot}
          onClose={() => setShowForgot(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  btn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btnSecondary: {
    marginTop: 0,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 5,
  },
  forgotLink: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
});

export default SignupScreen;
