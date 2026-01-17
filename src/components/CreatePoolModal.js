import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createPoolApi } from "../services/pool.api";
import { useTheme } from "../context/ThemeContext";

const CreatePoolModal = ({ isOpen, onClose, chat, currentUser, onSuccess }) => {
  const { theme } = useTheme();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [includeMe, setIncludeMe] = useState(true); // Default: Split equally (True)
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setAmount("");
      setIncludeMe(true);
    }
  }, [isOpen]);

  // --- 1. FIXED: PARTICIPANT LOGIC ---
  // Memoize this to prevent recalculation bugs
  const { participantIds, participantName } = useMemo(() => {
    if (!chat || !currentUser)
      return { participantIds: [], participantName: "Unknown" };

    // Get IDs of everyone EXCEPT me (The Borrowers)
    const others = chat.users.filter(
      (u) => String(u._id || u.id) !== String(currentUser)
    );

    const ids = others.map((u) => u._id || u.id);

    // Name to display in "With: ..."
    let name = "Unknown";
    if (chat.isGroupChat) {
      name = chat.chatName;
    } else if (others.length > 0) {
      name = others[0].name;
    } else {
      // Fallback for self-chat
      name = "Yourself";
    }

    return { participantIds: ids, participantName: name };
  }, [chat, currentUser]);

  // --- 2. FIXED: MATH LOGIC (Matches Web Exactly) ---
  const total = parseFloat(amount) || 0;

  // Group Size: If includeMe is true, it's (Borrowers + Me). If false, just Borrowers.
  const groupSize = includeMe
    ? participantIds.length + 1
    : participantIds.length;

  // Per Person Share
  const perPerson = groupSize > 0 ? (total / groupSize).toFixed(2) : "0.00";

  // My Share: If included, I pay perPerson. If not, I pay 0.
  const myShare = includeMe ? perPerson : "0.00";

  // Others Owe: Total - What I paid
  const othersOwe = (total - parseFloat(myShare)).toFixed(2);

  // --- 3. FIXED: SUBMIT HANDLER ---
  const handleSubmit = async () => {
    if (!title.trim() || !amount) {
      Alert.alert("Missing Fields", "Please enter a cause and amount.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid number greater than 0."
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        totalAmount: numericAmount, // 🔥 Send Number, not String
        participantIds, // Array of strings (The Borrowers)
        includeCreator: includeMe,
        chatId: chat._id,
        isGroupChat: chat.isGroupChat,
      };

      console.log("Creating Pool Payload:", payload); // Debugging

      await createPoolApi(payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create pool", error.response?.data || error);
      Alert.alert(
        "Error",
        "Could not create expense. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Safe Guard
  if (!isOpen || !chat) return null;

  const dynamicStyles = {
    content: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
    text: { color: theme.textPrimary },
    textSec: { color: theme.textSecondary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
    },
    card: { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
    activeCard: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderColor: theme.accentGreen,
    },
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalContent, dynamicStyles.content]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, dynamicStyles.text]}>
                Create Expense
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Context Info */}
            <View style={styles.contextContainer}>
              <Text style={[styles.contextText, dynamicStyles.textSec]}>
                With:{" "}
                <Text style={{ color: theme.accentGreen, fontWeight: "bold" }}>
                  {participantName}
                </Text>
              </Text>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 20,
              }}
            >
              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, dynamicStyles.textSec]}>Cause</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder="e.g. Dinner, Cab, Trip"
                  placeholderTextColor={theme.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, dynamicStyles.textSec]}>
                  Amount ($)
                </Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Split Options */}
              <View style={styles.splitOptions}>
                {/* OPTION 1: SPLIT EQUALLY */}
                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    dynamicStyles.card,
                    includeMe ? dynamicStyles.activeCard : {},
                  ]}
                  onPress={() => setIncludeMe(true)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: includeMe
                          ? theme.accentGreen
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {includeMe && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: theme.accentGreen },
                        ]}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.radioTitle, dynamicStyles.text]}>
                      Split Equally
                    </Text>
                    <Text style={[styles.radioDesc, dynamicStyles.textSec]}>
                      You pay your share ({perPerson})
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* OPTION 2: FULL AMOUNT */}
                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    dynamicStyles.card,
                    !includeMe ? dynamicStyles.activeCard : {},
                  ]}
                  onPress={() => setIncludeMe(false)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: !includeMe
                          ? theme.accentGreen
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {!includeMe && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: theme.accentGreen },
                        ]}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.radioTitle, dynamicStyles.text]}>
                      Full Amount
                    </Text>
                    <Text style={[styles.radioDesc, dynamicStyles.textSec]}>
                      They owe everything
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Math Summary */}
              {total > 0 && (
                <View
                  style={[
                    styles.summaryBox,
                    {
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      backgroundColor: "rgba(34, 197, 94, 0.05)",
                    },
                  ]}
                >
                  <View style={styles.summaryRow}>
                    <Text style={dynamicStyles.textSec}>Total Bill:</Text>
                    <Text style={[styles.summaryValue, dynamicStyles.text]}>
                      ${total.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { marginTop: 8 }]}>
                    <Text
                      style={{ color: theme.accentGreen, fontWeight: "bold" }}
                    >
                      You Receive:
                    </Text>
                    <Text
                      style={{
                        color: theme.accentGreen,
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      ${othersOwe}
                    </Text>
                  </View>
                  <Text style={[styles.summarySub, dynamicStyles.textSec]}>
                    From {participantIds.length} person(s)
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.bgCard }]}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.cancelBtn,
                  { borderColor: theme.inputBorder },
                ]}
                onPress={onClose}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    flex: 1,
                    backgroundColor: theme.accentGreen,
                    opacity: !title || !amount ? 0.5 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading || !title || !amount}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={{ color: "#000", fontWeight: "bold" }}>
                    Request Payment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    width: "100%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  contextContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  contextText: {
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  splitOptions: {
    gap: 10,
    marginBottom: 24,
    marginTop: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  radioDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryValue: {
    fontWeight: "bold",
  },
  summarySub: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderColor: "transparent",
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1,
    width: 100,
  },
});

export default CreatePoolModal;
