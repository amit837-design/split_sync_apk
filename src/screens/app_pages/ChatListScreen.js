import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  SafeAreaView,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// API & Context
import { searchUsersApi } from "../../services/user.api";
import { fetchChatsApi, accessChatApi } from "../../services/chat.api";
import { useTheme } from "../../context/ThemeContext";

// Components
import GroupChatModal from "../../components/GroupChatModal";
import GlobalPoolModal from "../../components/GlobalPoolModal";

// --- SUB-COMPONENT: ANIMATED LIST ITEM ---
// Runs animation every time the list is focused
const AnimatedItem = ({ children, index }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    useCallback(() => {
      // 1. Reset
      fade.setValue(0);
      slide.setValue(30);

      // 2. Animate
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 500,
          delay: index * 50, // Stagger effect
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 15,
          stiffness: 100,
          delay: index * 50,
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

const ChatListScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Data State
  const [chats, setChats] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search Inputs
  const [nameQuery, setNameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");

  // Identity
  const [myId, setMyId] = useState(null);

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPoolModal, setShowPoolModal] = useState(false);

  // Animation Refs (Search Bars)
  const nameAnim = useRef(new Animated.Value(1)).current;
  const emailAnim = useRef(new Animated.Value(1)).current;
  const btnAnim = useRef(new Animated.Value(1)).current;

  // --- 1. Load User ID ---
  useEffect(() => {
    const getId = async () => {
      const json = await AsyncStorage.getItem("userInfo");
      if (json) {
        const u = JSON.parse(json);
        setMyId(u.user?._id || u.user?.id || u._id);
      }
    };
    getId();
  }, []);

  // --- 2. Fetch Inbox Chats ---
  const loadChats = useCallback(async () => {
    try {
      const { data } = await fetchChatsApi();
      const sorted = data.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
      setChats(sorted);
    } catch (error) {
      console.error("Inbox load failed", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  // --- 3. Search Logic ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameQuery || emailQuery) {
        handleSearch();
      } else {
        setSearchResult([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nameQuery, emailQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const q = nameQuery || emailQuery;
      const type = nameQuery ? "name" : "email";
      // Send both to be safe
      const params = { q, search: q, type, page: 1, limit: 20 };

      const { data } = await searchUsersApi(params);
      setSearchResult(data.users || data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Animation Logic (Search) ---
  const handleFocus = (type) => {
    Animated.parallel([
      Animated.timing(type === "name" ? nameAnim : emailAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(type === "name" ? emailAnim : nameAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(btnAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    if (!nameQuery && !emailQuery) {
      Animated.parallel([
        Animated.timing(nameAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(emailAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // --- 5. Open Chat Logic ---
  const openChat = async (userId, existingChat = null) => {
    if (existingChat) {
      const chatName = getChatName(existingChat);
      navigation.navigate("ChatWindow", {
        chatId: existingChat._id,
        chatName: chatName,
        isGroup: existingChat.isGroupChat,
        fullChat: existingChat, // 🔥 IMPORTANT: Pass full chat to fix pool error
      });
      return;
    }

    try {
      const { data } = await accessChatApi(userId);
      // Optimistically add to list
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      const otherUser = data.users.find((u) => String(u._id) !== String(myId));
      const name = otherUser ? otherUser.name : "Message Yourself";

      navigation.navigate("ChatWindow", {
        chatId: data._id,
        chatName: name,
        isGroup: false,
        fullChat: data, // 🔥 IMPORTANT
      });
    } catch (error) {
      console.error("Access failed", error);
    }
  };

  // --- 6. Helpers ---
  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const other = chat.users.find(
      (u) => String(u._id || u.id) !== String(myId)
    );
    return other ? other.name : "Message Yourself";
  };

  const getAvatar = (chat) => {
    if (chat.isGroupChat) return chat.groupPic;
    const other = chat.users.find(
      (u) => String(u._id || u.id) !== String(myId)
    );
    if (other) return other.avatar;
    const me = chat.users.find((u) => String(u._id || u.id) === String(myId));
    return me?.avatar;
  };

  // --- 7. Render Item ---
  const renderItem = ({ item, index }) => {
    const isSearch = (nameQuery || emailQuery).length > 0;

    // A. SEARCH RESULTS
    if (isSearch) {
      const isMe = String(item._id) === String(myId);
      return (
        <AnimatedItem index={index}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => openChat(item._id)}
          >
            <View
              style={[styles.avatar, { backgroundColor: theme.inputBorder }]}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={{ fontSize: 18, color: theme.textSecondary }}>
                  {item.name?.[0]}
                </Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.textPrimary }]}>
                {item.name} {isMe && "(You)"}
              </Text>
              <Text style={[styles.subText, { color: theme.textSecondary }]}>
                {item.email}
              </Text>
            </View>
          </TouchableOpacity>
        </AnimatedItem>
      );
    }

    // B. INBOX CHAT LIST
    const name = getChatName(item);
    const pic = getAvatar(item);

    let subText = "No messages yet";
    let isPool = false;

    if (item.latestMessage) {
      const sender = item.latestMessage.sender;
      const senderId = sender?._id || sender;
      const senderName =
        String(senderId) === String(myId)
          ? "You"
          : sender?.name?.split(" ")[0] || "User";

      isPool = item.latestMessage.type === "pool";
      subText = isPool
        ? `💸 ${senderName}: ${item.latestMessage.content}`
        : `${senderName}: ${item.latestMessage.content}`;
    }

    return (
      <AnimatedItem index={index}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => openChat(null, item)}
        >
          <View style={[styles.avatar, { backgroundColor: theme.inputBorder }]}>
            {pic && pic !== "#" ? (
              <Image source={{ uri: pic }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 18, color: theme.textSecondary }}>
                {name?.[0]}
              </Text>
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.row}>
              <Text
                style={[styles.name, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {name}
              </Text>
            </View>
            <Text
              style={[
                styles.subText,
                { color: isPool ? theme.accentGreen : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {subText}
            </Text>
          </View>
        </TouchableOpacity>
      </AnimatedItem>
    );
  };

  // Interpolations
  const nameFlex = nameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });
  const emailFlex = emailAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });
  const btnWidth = btnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 45],
  });
  const btnOpacity = btnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Styles
  const dynamicStyles = {
    header: {
      backgroundColor: theme.bgCard,
      borderBottomColor: theme.inputBorder,
    },
    input: {
      backgroundColor: theme.inputBg,
      color: theme.textPrimary,
      borderColor: theme.inputBorder, // Visible border
    },
    newChatBtn: { backgroundColor: theme.accentGreen },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Chats
          </Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowGroupModal(true)}
          >
            <Ionicons
              name="people-circle-outline"
              size={30}
              color={theme.accentGreen}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <Animated.View
            style={{ flex: nameFlex, marginRight: 8, opacity: nameFlex }}
          >
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Search Name"
              placeholderTextColor={theme.textSecondary}
              value={nameQuery}
              onChangeText={(t) => {
                setNameQuery(t);
                if (t) setEmailQuery("");
              }}
              onFocus={() => handleFocus("name")}
              onBlur={handleBlur}
            />
          </Animated.View>

          <Animated.View
            style={{ flex: emailFlex, marginRight: 8, opacity: emailFlex }}
          >
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Search Email"
              placeholderTextColor={theme.textSecondary}
              value={emailQuery}
              onChangeText={(t) => {
                setEmailQuery(t);
                if (t) setNameQuery("");
              }}
              onFocus={() => handleFocus("email")}
              onBlur={handleBlur}
              autoCapitalize="none"
            />
          </Animated.View>

          <Animated.View
            style={{ width: btnWidth, opacity: btnOpacity, overflow: "hidden" }}
          >
            <TouchableOpacity
              style={[styles.newChatBtn, dynamicStyles.newChatBtn]}
              onPress={() => setShowPoolModal(true)}
            >
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={nameQuery || emailQuery ? searchResult : chats}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentGreen}
          />
        }
        ListEmptyComponent={
          <Text
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              marginTop: 50,
            }}
          >
            {loading ? (
              <ActivityIndicator color={theme.accentGreen} />
            ) : nameQuery || emailQuery ? (
              "No users found"
            ) : (
              "No chats yet"
            )}
          </Text>
        }
      />

      <GroupChatModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />

      <GlobalPoolModal
        isOpen={showPoolModal}
        onClose={() => setShowPoolModal(false)}
        onSuccess={() => loadChats()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  iconBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  newChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
  },
});

export default ChatListScreen;
