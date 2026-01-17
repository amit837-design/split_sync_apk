import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchUsersApi } from "../services/user.api";
import { createPoolApi } from "../services/pool.api";
import { useTheme } from "../context/ThemeContext";

const GlobalPoolModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Transaction Details
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [includeMe, setIncludeMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers([]);
      setTitle("");
      setAmount("");
      setIncludeMe(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) performSearch();
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoadingSearch(true);
    try {
      const { data } = await searchUsersApi({
        search: searchQuery,
        q: searchQuery,
        page: 1,
        limit: 10,
      });
      const results = (data.users || data).filter(
        (u) => !selectedUsers.find((sel) => sel._id === u._id)
      );
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleSubmit = async () => {
    if (!title || !amount || selectedUsers.length === 0) {
      Alert.alert(
        "Missing Fields",
        "Please add title, amount and at least one person."
      );
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        totalAmount: numericAmount,
        participantIds: selectedUsers.map((u) => u._id),
        includeCreator: includeMe,
        isGroupChat: false,
      };
      await createPoolApi(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create pool."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const total = parseFloat(amount) || 0;
  const groupSize = includeMe ? selectedUsers.length + 1 : selectedUsers.length;
  const othersOwe = (
    total - (includeMe && groupSize > 0 ? total / groupSize : 0)
  ).toFixed(2);

  const dynamicStyles = {
    content: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
    text: { color: theme.textPrimary },
    textSec: { color: theme.textSecondary },
    input: {
      backgroundColor: theme.inputBg,
      borderColor: theme.inputBorder,
      color: theme.textPrimary,
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
            <View style={styles.header}>
              <Text style={[styles.title, dynamicStyles.text]}>
                {step === 1 ? "Select Friends" : "Expense Details"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {step === 1 && (
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder="Search name or email..."
                  placeholderTextColor={theme.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />

                {/* Selected Chips */}
                {selectedUsers.length > 0 && (
                  <View style={styles.chipContainer}>
                    {selectedUsers.map((u) => (
                      <TouchableOpacity
                        key={u._id}
                        style={styles.chip}
                        onPress={() => removeUser(u._id)}
                      >
                        <Text style={styles.chipText}>{u.name}</Text>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={theme.accentGreen}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Search Results */}
                <View style={{ flex: 1, marginTop: 10 }}>
                  {loadingSearch && (
                    <ActivityIndicator
                      color={theme.accentGreen}
                      style={{ marginTop: 20 }}
                    />
                  )}

                  {!loadingSearch &&
                    searchResults.length === 0 &&
                    searchQuery.length > 0 && (
                      <Text
                        style={{
                          textAlign: "center",
                          color: theme.textSecondary,
                          marginTop: 20,
                        }}
                      >
                        No users found
                      </Text>
                    )}

                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item._id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.userRow}
                        onPress={() => toggleUser(item)}
                      >
                        <View style={styles.avatar}>
                          {item.avatar ? (
                            <Image
                              source={{ uri: item.avatar }}
                              style={{ width: "100%", height: "100%" }}
                            />
                          ) : (
                            <Text style={{ color: "#aaa" }}>
                              {item.name[0]}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={dynamicStyles.text}>{item.name}</Text>
                          <Text style={dynamicStyles.textSec}>
                            {item.email}
                          </Text>
                        </View>
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color={theme.accentGreen}
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor: theme.accentGreen,
                      opacity: selectedUsers.length === 0 ? 0.5 : 1,
                    },
                  ]}
                  disabled={selectedUsers.length === 0}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.btnText}>
                    Next ({selectedUsers.length}) →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cause</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Dinner"
                  placeholderTextColor={theme.textSecondary}
                />

                <Text style={styles.label}>Total Amount ($)</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                />

                <View style={styles.radioGroup}>
                  {[true, false].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.radioItem,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor:
                            includeMe === val
                              ? theme.accentGreen
                              : "transparent",
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => setIncludeMe(val)}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor:
                              includeMe === val
                                ? theme.accentGreen
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        {includeMe === val && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: theme.accentGreen },
                            ]}
                          />
                        )}
                      </View>
                      <View>
                        <Text style={dynamicStyles.text}>
                          {val ? "Split Equally" : "Full Amount"}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: theme.textSecondary }}
                        >
                          {val ? "Include me" : "I paid for them only"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {total > 0 && (
                  <View style={styles.summaryBox}>
                    <View style={styles.row}>
                      <Text style={dynamicStyles.textSec}>Total Bill:</Text>
                      <Text style={dynamicStyles.text}>
                        ${total.toFixed(2)}
                      </Text>
                    </View>
                    <View style={[styles.row, { marginTop: 8 }]}>
                      <Text
                        style={{ color: theme.accentGreen, fontWeight: "bold" }}
                      >
                        You Receive:
                      </Text>
                      <Text
                        style={{ color: theme.accentGreen, fontWeight: "bold" }}
                      >
                        ${othersOwe}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setStep(1)}
                  >
                    <Text style={dynamicStyles.textSec}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      {
                        flex: 1,
                        backgroundColor: theme.accentGreen,
                        opacity: !amount || !title ? 0.5 : 1,
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting || !amount || !title}
                  >
                    <Text style={styles.btnText}>
                      {submitting ? "Processing..." : "Request"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    width: "100%",
    height: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  chipText: { color: "#22c55e", marginRight: 4, fontSize: 12 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 5,
    borderRadius: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  btn: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#000", fontWeight: "bold" },
  label: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  radioGroup: { gap: 10, marginBottom: 15 },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  summaryBox: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 10 },
});

export default GlobalPoolModal;
