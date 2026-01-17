import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { changePasswordApi } from "../services/auth.api";
import { useTheme } from "../context/ThemeContext";

const ChangePasswordModal = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleSubmit = async () => {
    // 1. Validation
    if (!oldPassword || !newPassword) {
      setStatusMsg({ type: "error", text: "Please fill all fields" });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMsg({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      await changePasswordApi({ oldPassword, newPassword });
      setStatusMsg({ type: "success", text: "Password changed successfully!" });

      setTimeout(() => {
        onClose();
        setOldPassword("");
        setNewPassword("");
        setStatusMsg({});
      }, 1500);
    } catch (error) {
      setStatusMsg({
        type: "error",
        text: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Styles
  const dynamicStyles = {
    content: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
    text: { color: theme.textPrimary },
    subText: { color: theme.textSecondary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
    btn: { backgroundColor: theme.accentGreen },
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={[styles.modalContent, dynamicStyles.content]}>
              {/* Handle Bar */}
              <View
                style={[styles.handle, { backgroundColor: theme.inputBorder }]}
              />

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, dynamicStyles.text]}>
                  Change Password
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Current Password Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, dynamicStyles.subText]}>
                  Current Password
                </Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, dynamicStyles.input]}
                    secureTextEntry={!showOld}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textSecondary}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowOld(!showOld)}
                  >
                    <Ionicons
                      name={showOld ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, dynamicStyles.subText]}>
                  New Password
                </Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, dynamicStyles.input]}
                    secureTextEntry={!showNew}
                    placeholder="New password (≥6 chars)"
                    placeholderTextColor={theme.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNew(!showNew)}
                  >
                    <Ionicons
                      name={showNew ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status Message */}
              {statusMsg.text ? (
                <Text
                  style={[
                    styles.statusText,
                    statusMsg.type === "error"
                      ? { color: theme.error }
                      : { color: theme.accentGreen },
                  ]}
                >
                  {statusMsg.text}
                </Text>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.btn, dynamicStyles.btn]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnText}>Update Password</Text>
                )}
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
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  passwordWrapper: { justifyContent: "center" },

  // 🔥 UNIFIED INPUT STYLE
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 45,
    borderWidth: 1,
    fontSize: 15,
    letterSpacing: 0, // Forces standard spacing
    fontVariant: [], // Resets any platform-specific font variants
  },

  eyeIcon: { position: "absolute", right: 12 },
  statusText: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "500",
  },
  btn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default ChangePasswordModal;
