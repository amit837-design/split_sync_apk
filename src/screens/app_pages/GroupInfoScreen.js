import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// API & Context
import { exitGroupApi, updateGroupDetailsApi } from "../../services/chat.api";
import { useTheme } from "../../context/ThemeContext";

const GroupInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // Params passed: { chat: object }
  const { chat: initialChat } = route.params || {};

  const [chat, setChat] = useState(initialChat);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [myId, setMyId] = useState(null);

  // 1. Get User ID
  useEffect(() => {
    AsyncStorage.getItem("userInfo").then((json) => {
      if (json) {
        const u = JSON.parse(json);
        setMyId(u.user?._id || u.user?.id || u._id);
      }
    });
  }, []);

  // 2. Sync Chat Data
  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
      setEditedName(initialChat.chatName);
    }
  }, [initialChat]);

  if (!chat) return null;

  const { chatName, users, groupAdmin, _id: chatId, groupPic } = chat;

  // Admin Check
  const isAdmin = String(groupAdmin?._id || groupAdmin) === String(myId);

  // Unique Users Filter
  const uniqueUsers = users?.filter(
    (user, index, self) => index === self.findIndex((t) => t._id === user._id)
  );

  // --- EXIT GROUP ---
  const handleExitGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await exitGroupApi(chatId);
            navigation.navigate("ChatList"); // Go back to List
          } catch (error) {
            Alert.alert("Error", "Failed to leave group");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // --- IMAGE UPLOAD ---
  const pickImage = async () => {
    if (!isAdmin) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setUploading(true);

      // Optimistic UI Update
      setChat((prev) => ({ ...prev, groupPic: uri }));

      // Prepare Upload
      const formData = new FormData();
      formData.append("chatId", chatId);

      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("groupPic", { uri, name: filename, type });

      try {
        const { data } = await updateGroupDetailsApi(formData);
        setChat(data);
      } catch (error) {
        Alert.alert("Upload Failed", "Could not update group picture.");
        setChat(initialChat); // Revert on fail
      } finally {
        setUploading(false);
      }
    }
  };

  // --- RENAME ---
  const handleRename = async () => {
    if (!editedName.trim() || editedName === chatName) {
      setIsEditingName(false);
      return;
    }

    // We send JSON for text updates (cleaner than FormData if backend supports it, else use FormData)
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("chatName", editedName);

    try {
      const { data } = await updateGroupDetailsApi(formData);
      setChat(data);
    } catch (error) {
      Alert.alert("Rename Failed", "Could not update group name.");
      setEditedName(chatName); // Revert
    } finally {
      setIsEditingName(false);
    }
  };

  const dynamicStyles = {
    textPrimary: { color: theme.textPrimary },
    textSecondary: { color: theme.textSecondary },
    input: { color: theme.textPrimary, borderBottomColor: theme.accentGreen },
    card: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
    adminBadge: {
      borderColor: "rgba(34, 197, 94, 0.3)",
      backgroundColor: "rgba(34, 197, 94, 0.15)",
    },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {/* Custom Header with Back Button */}
      <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>
          Group Info
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Profile Card */}
          <View style={[styles.card, dynamicStyles.card]}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={isAdmin ? 0.7 : 1}
              style={[
                styles.avatarLarge,
                { backgroundColor: theme.inputBorder },
              ]}
            >
              {groupPic ? (
                <Image source={{ uri: groupPic }} style={styles.avatarImg} />
              ) : (
                <Text style={{ fontSize: 32, color: theme.textSecondary }}>
                  {chatName?.[0]?.toUpperCase()}
                </Text>
              )}

              {/* Camera Overlay for Admin */}
              {isAdmin && (
                <View style={styles.editIconOverlay}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={20} color="#fff" />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Name Editing */}
            <View style={styles.nameContainer}>
              {isEditingName ? (
                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  onBlur={handleRename}
                  onSubmitEditing={handleRename}
                  autoFocus
                  style={[styles.editInput, dynamicStyles.input]}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => isAdmin && setIsEditingName(true)}
                  disabled={!isAdmin}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <Text style={[styles.groupName, dynamicStyles.textPrimary]}>
                    {chatName}
                  </Text>
                  {isAdmin && (
                    <Ionicons
                      name="pencil"
                      size={16}
                      color={theme.accentGreen}
                      style={{ marginLeft: 8, opacity: 0.8 }}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.meta, dynamicStyles.textSecondary]}>
              Group • {uniqueUsers?.length} participants
            </Text>
          </View>

          {/* Participants List */}
          <Text style={[styles.sectionLabel, { color: theme.accentGreen }]}>
            Participants
          </Text>

          <View style={styles.list}>
            {uniqueUsers?.map((user) => {
              const isGroupAdmin =
                String(groupAdmin?._id || groupAdmin) === String(user._id);

              return (
                <View
                  key={user._id}
                  style={[
                    styles.listItem,
                    { backgroundColor: "rgba(255,255,255,0.02)" },
                  ]}
                >
                  <View
                    style={[
                      styles.avatarSmall,
                      { backgroundColor: theme.inputBorder },
                    ]}
                  >
                    {user.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <Text style={{ color: theme.textSecondary }}>
                        {user.name?.[0]}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={[styles.userName, dynamicStyles.textPrimary]}
                      >
                        {user.name}
                      </Text>
                      {isGroupAdmin && (
                        <View
                          style={[styles.adminBadge, dynamicStyles.adminBadge]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: theme.accentGreen,
                              fontWeight: "bold",
                            }}
                          >
                            Admin
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.userEmail, dynamicStyles.textSecondary]}
                    >
                      {user.email}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Exit Button */}
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={handleExitGroup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text
                  style={{
                    color: "#ef4444",
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  Exit Group
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  backBtn: {
    padding: 8,
  },
  card: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameContainer: { marginBottom: 6, width: "100%", alignItems: "center" },
  groupName: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  editInput: {
    fontSize: 24,
    fontWeight: "bold",
    borderBottomWidth: 2,
    textAlign: "center",
    minWidth: 150,
    paddingBottom: 4,
  },
  meta: { fontSize: 13, marginTop: 4 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: { gap: 10, marginBottom: 30 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userName: { fontSize: 16, fontWeight: "600" },
  userEmail: { fontSize: 13, opacity: 0.7 },
  adminBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginTop: 10,
    marginBottom: 40,
  },
});

export default GroupInfoScreen;
