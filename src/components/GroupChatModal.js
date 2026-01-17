import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { searchUsersApi } from "../services/user.api";
import { createGroupChatApi } from "../services/chat.api";
import { useTheme } from "../context/ThemeContext";

const GroupChatModal = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const [groupName, setGroupName] = useState("");
  const [groupImg, setGroupImg] = useState(null); // URI
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) executeSearch();
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const executeSearch = async () => {
    try {
      setLoading(true);
      const { data } = await searchUsersApi({ search: searchQuery });
      setSearchResults(data.users || data || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Image Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setGroupImg(result.assets[0].uri);
    }
  };

  const toggleUser = (user) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async () => {
    if (!groupName || selectedUsers.length < 2) {
      return Alert.alert("Error", "Enter name and add at least 2 friends.");
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", groupName);
      formData.append("users", JSON.stringify(selectedUsers.map((u) => u._id)));

      if (groupImg) {
        const filename = groupImg.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // React Native FormData expects this specific object structure for files
        formData.append("groupPic", {
          uri: groupImg,
          name: filename,
          type,
        });
      }

      await createGroupChatApi(formData);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to create group.");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.backdrop}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>New Group</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Top Section: Image & Name */}
            <View style={styles.topSection}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.imagePlaceholder}
              >
                {groupImg ? (
                  <Image
                    source={{ uri: groupImg }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Ionicons
                    name="camera"
                    size={24}
                    color={theme.textSecondary}
                  />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.nameInput}
                placeholder="Group Subject"
                placeholderTextColor={theme.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Selected Users Chips */}
            <View style={{ height: 40, marginVertical: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedUsers.map((u) => (
                  <TouchableOpacity
                    key={u._id}
                    style={styles.chip}
                    onPress={() => toggleUser(u)}
                  >
                    <Text style={{ color: theme.accentGreen, fontSize: 12 }}>
                      {u.name.split(" ")[0]}
                    </Text>
                    <Ionicons
                      name="close"
                      size={14}
                      color={theme.accentGreen}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Search Results */}
            <ScrollView style={{ flex: 1 }}>
              {loading && <ActivityIndicator color={theme.accentGreen} />}
              {!loading &&
                searchResults.map((user) => {
                  const isSelected = selectedUsers.find(
                    (u) => u._id === user._id
                  );
                  return (
                    <TouchableOpacity
                      key={user._id}
                      style={styles.userRow}
                      onPress={() => toggleUser(user)}
                    >
                      <View style={styles.avatar}>
                        {user.avatar ? (
                          <Image
                            source={{ uri: user.avatar }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          <Text style={{ color: "#aaa" }}>{user.name[0]}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textPrimary }}>
                          {user.name}
                        </Text>
                        <Text
                          style={{ color: theme.textSecondary, fontSize: 12 }}
                        >
                          {user.email}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.accentGreen}
                        />
                      ) : (
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color={theme.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: "#000", fontWeight: "bold" }}>
                  Create Group
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      padding: 20,
    },
    content: {
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      height: "80%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    title: { color: theme.textPrimary, fontSize: 18, fontWeight: "bold" },
    topSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    imagePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.inputBg,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    nameInput: {
      flex: 1,
      marginLeft: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.accentGreen,
      padding: 10,
      color: theme.textPrimary,
      fontSize: 16,
    },
    searchInput: {
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      padding: 12,
      color: theme.textPrimary,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      paddingHorizontal: 10,
      borderRadius: 15,
      marginRight: 8,
      gap: 4,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#333",
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    createBtn: {
      backgroundColor: theme.accentGreen,
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
    },
  });

export default GroupChatModal;
