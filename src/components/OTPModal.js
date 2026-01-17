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
import { resendOTP, verifyOTP } from "../services/auth.api";

const OTPModal = ({ email, visible, onClose, onSuccess }) => {
  const { theme } = useTheme();

  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp) return;
    setOtpMessage(null);
    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp });

      setOtpMessage({ type: "success", text: "Verified!" });

      // Delay slightly to show success message before closing
      setTimeout(() => {
        setLoading(false);
        if (onSuccess) onSuccess(response.data);
        onClose();
        setOtp(""); // Reset for next time
      }, 800);
    } catch (err) {
      setLoading(false);
      setOtpMessage({
        type: "error",
        text: err.response?.data?.message || "Invalid OTP",
      });
    }
  };

  const handleResend = async () => {
    setOtpMessage(null);
    try {
      await resendOTP(email);
      setOtpMessage({ type: "info", text: "Code resent" });
    } catch {
      setOtpMessage({ type: "error", text: "Failed to resend" });
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
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContent, dynamicStyles.modalContent]}>
              <View
                style={[styles.handle, { backgroundColor: theme.inputBorder }]}
              />

              <Text style={[styles.title, dynamicStyles.text]}>
                Email Verification
              </Text>
              <Text style={[styles.subTitle, dynamicStyles.subText]}>
                Sent to {email}
              </Text>

              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />

              {otpMessage && (
                <Text
                  style={[
                    styles.message,
                    {
                      color:
                        otpMessage.type === "error"
                          ? theme.error
                          : theme.accentGreen,
                    },
                  ]}
                >
                  {otpMessage.text}
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, dynamicStyles.btnPrimary]}
                  onPress={handleVerify}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnOutline,
                    dynamicStyles.btnSecondary,
                  ]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text
                  style={[styles.resendLink, { color: theme.textSecondary }]}
                >
                  Resend Code
                </Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.6)", // Dark overlay
    justifyContent: "center",
    padding: 20,
  },
  keyboardView: {
    width: "100%",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 15,
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: -10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 20,
    letterSpacing: 5,
  },
  message: {
    textAlign: "center",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
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
  resendLink: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
  },
});

export default OTPModal;
