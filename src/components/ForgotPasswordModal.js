import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

import {
  requestPasswordReset,
  resetPassword,
  verifyResetOTP,
} from "../services/auth.api";

const ForgotPasswordModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [step, setStep] = useState("email"); // email | otp | reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to transition steps smoothly
  const nextStep = (next) => {
    setMessage(null);
    setStep(next);
  };

  /* STEP 1: REQUEST OTP */
  const handleVerifyEmail = async () => {
    // 1. Basic Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMessage({ type: "error", text: "Enter email" });

    // Simple regex for email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return setMessage({ type: "error", text: "Invalid email format" });
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log("Requesting OTP for:", cleanEmail);
      const response = await requestPasswordReset(cleanEmail);
      console.log("OTP Request Success:", response.data);

      setIsLoading(false);
      nextStep("otp");
    } catch (err) {
      console.log("FULL ERROR LOG:", err); // 🔥 CHECK YOUR TERMINAL FOR THIS

      setIsLoading(false);

      let errorText = "Server Error";

      if (err.response) {
        // The server responded with a status code other than 2xx
        console.log("SERVER RESPONSE DATA:", err.response.data);
        errorText =
          err.response.data.message ||
          err.response.data.error ||
          "Server Error";
      } else if (err.request) {
        // Request made but no response
        errorText = "No response from server. Check internet.";
      } else {
        errorText = err.message;
      }

      setMessage({
        type: "error",
        text: errorText,
      });
    }
  };

  /* STEP 2: VERIFY OTP */
  const handleVerifyOTP = async () => {
    if (!otp) return setMessage({ type: "error", text: "Enter code" });
    setIsLoading(true);
    setMessage(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      console.log("Verifying OTP:", otp, "for", cleanEmail);

      const response = await verifyResetOTP({ email: cleanEmail, otp });
      console.log("Verify OTP Success:", response.data);

      setResetToken(response.data.resetToken);
      setIsLoading(false);
      nextStep("reset");
    } catch (err) {
      console.error("Verify OTP Failed:", err);
      setIsLoading(false);

      let errorText = "Invalid Code";
      if (err.response) {
        errorText = err.response.data.message || "Invalid Code";
      }

      setMessage({
        type: "error",
        text: errorText,
      });
    }
  };

  /* STEP 3: RESET PASSWORD */
  const handleResetPassword = async () => {
    if (!password) return setMessage({ type: "error", text: "Enter password" });
    if (password.length < 6)
      return setMessage({ type: "error", text: "Password too short (min 6)" });
    if (!resetToken)
      return setMessage({ type: "error", text: "Session expired" });

    setIsLoading(true);
    setMessage(null);
    try {
      await resetPassword({ resetToken, newPassword: password });

      setIsLoading(false);
      onClose(); // Close modal
      alert("Password Reset Successful. Please Login.");
    } catch (err) {
      console.error("Reset Password Failed:", err);
      setIsLoading(false);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Reset failed",
      });
    }
  };

  // Dynamic Styles
  const dynamicStyles = {
    modalContent: {
      backgroundColor: theme.bgCard,
      borderColor: theme.inputBorder,
    },
    text: { color: theme.textPrimary },
    subText: { color: theme.textSecondary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
    btnPrimary: { backgroundColor: theme.accentGreen },
    btnSecondary: { borderColor: theme.inputBorder },
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={[styles.modalContent, dynamicStyles.modalContent]}>
              <View
                style={[styles.handle, { backgroundColor: theme.inputBorder }]}
              />

              {/* === TITLE === */}
              <Text style={[styles.title, dynamicStyles.text]}>
                {step === "email"
                  ? "Forgot Password"
                  : step === "otp"
                  ? "Enter Code"
                  : "Reset Password"}
              </Text>

              <Text style={[styles.subTitle, dynamicStyles.subText]}>
                {step === "email"
                  ? "Enter email to verify account"
                  : step === "otp"
                  ? `Code sent to ${email}`
                  : "Create new password"}
              </Text>

              {/* === INPUTS === */}
              {step === "email" && (
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder="Email address"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              {step === "otp" && (
                <TextInput
                  style={[
                    styles.input,
                    dynamicStyles.input,
                    { letterSpacing: 5, textAlign: "center" },
                  ]}
                  placeholder="000000"
                  placeholderTextColor={theme.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}

              {step === "reset" && (
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      dynamicStyles.input,
                      { paddingRight: 40 },
                    ]}
                    placeholder="New password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* === MESSAGES === */}
              {message && (
                <Text
                  style={[
                    styles.message,
                    {
                      color:
                        message.type === "error"
                          ? theme.error
                          : theme.accentGreen,
                    },
                  ]}
                >
                  {message.text}
                </Text>
              )}

              {/* === BUTTONS === */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, dynamicStyles.btnPrimary]}
                  onPress={
                    step === "email"
                      ? handleVerifyEmail
                      : step === "otp"
                      ? handleVerifyOTP
                      : handleResetPassword
                  }
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>
                      {step === "email"
                        ? "Send Code"
                        : step === "otp"
                        ? "Verify"
                        : "Reset"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnOutline,
                    dynamicStyles.btnSecondary,
                  ]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 15,
    alignSelf: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 5,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 5,
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
  message: {
    textAlign: "center",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  btnOutline: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnTextPrimary: {
    color: "#000",
    fontWeight: "600",
  },
});

export default ForgotPasswordModal;
