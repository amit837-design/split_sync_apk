import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

// API & Context
import { useTheme } from "../../context/ThemeContext";
import { fetchMessagesApi, sendMessageApi } from "../../services/message.api";
import { fetchChatsApi } from "../../services/chat.api";

// Components
import CreatePoolModal from "../../components/CreatePoolModal";
import PoolBubble from "../../components/PoolBubble";

// --- ANIMATED MESSAGE WRAPPER ---
const AnimatedMessage = ({ children }) => {
  const slide = useRef(new Animated.Value(20)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        damping: 20,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      {children}
    </Animated.View>
  );
};

// --- SINGLE MESSAGE COMPONENT (Handles Click Logic) ---
const MessageItem = React.memo(
  ({ item, myId, theme, isGroup, onUpdatePool }) => {
    const [showDetails, setShowDetails] = useState(false);

    const isMe = String(item.sender?._id || item.sender) === String(myId);
    const isPool = item.type === "pool";

    // Format: "Jan 12, 10:30 AM"
    const timestamp = new Date(item.createdAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <AnimatedMessage>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowDetails(!showDetails)} // Toggle Time/Date
          style={[
            styles.msgWrapper,
            isMe ? styles.sentWrapper : styles.receivedWrapper,
            isPool ? { maxWidth: "100%" } : {},
          ]}
        >
          {/* Sender Name in Groups */}
          {isGroup && !isMe && !isPool && (
            <Text style={[styles.senderName, { color: theme.accentGreen }]}>
              {item.sender?.name || "Unknown"}
            </Text>
          )}

          {/* Content */}
          {isPool ? (
            <View style={{ marginBottom: 4 }}>
              <PoolBubble message={item} isMe={isMe} onUpdate={onUpdatePool} />
            </View>
          ) : (
            <View
              style={[
                styles.bubble,
                isMe
                  ? {
                      backgroundColor: theme.accentGreen,
                      borderBottomRightRadius: 2,
                    }
                  : {
                      backgroundColor: theme.bgCard,
                      borderBottomLeftRadius: 2,
                    },
              ]}
            >
              <Text
                style={{
                  color: isMe ? "#000" : theme.textPrimary,
                  fontSize: 16,
                }}
              >
                {item.content}
              </Text>
            </View>
          )}

          {/* Date & Time (Hidden by default, shown on click) */}
          {showDetails && (
            <Text
              style={[
                styles.time,
                {
                  color: theme.textSecondary,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  marginTop: 6,
                  marginBottom: 2,
                },
              ]}
            >
              {timestamp}
            </Text>
          )}
        </TouchableOpacity>
      </AnimatedMessage>
    );
  }
);

const ChatWindowScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const { chatId, chatName = "Chat", isGroup = false } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [fullChat, setFullChat] = useState(route.params?.fullChat || null);

  useEffect(() => {
    AsyncStorage.getItem("userInfo").then((json) => {
      if (json) {
        const u = JSON.parse(json);
        setMyId(u.user?._id || u.user?.id || u._id);
      }
    });
  }, []);

  // --- LOGIC: CHECK IF SELF CHAT ---
  const isSelfChat = useMemo(() => {
    if (!fullChat || !myId || isGroup) return false;
    const other = fullChat.users.find(
      (u) => String(u._id || u.id) !== String(myId)
    );
    return !other;
  }, [fullChat, myId, isGroup]);

  const loadData = async () => {
    try {
      const msgRes = await fetchMessagesApi(chatId);
      setMessages(msgRes.data);

      if (!fullChat || !fullChat.users || fullChat.users.length === 0) {
        const chatsRes = await fetchChatsApi();
        const foundChat = chatsRes.data.find((c) => c._id === chatId);
        if (foundChat) {
          setFullChat(foundChat);
        }
      }
    } catch (error) {
      console.error("Failed to load chat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) loadData();
  }, [chatId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const tempMsg = {
      _id: Date.now().toString(),
      content: newMessage,
      sender: { _id: myId },
      createdAt: new Date().toISOString(),
      isTemp: true,
      type: "text",
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    try {
      const { data } = await sendMessageApi({
        chatId,
        content: tempMsg.content,
      });
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? data : m))
      );
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  const handleOpenPool = () => {
    if (!fullChat || !fullChat.users || fullChat.users.length === 0) {
      Alert.alert("Please Wait", "Still loading chat details...");
      loadData();
      return;
    }
    setShowPoolModal(true);
  };

  const handleInfoClick = () => {
    if (!fullChat) return;

    if (isGroup) {
      navigation.navigate("GroupInfo", { chat: fullChat });
    } else {
      const otherUser = fullChat.users.find(
        (u) => String(u._id || u.id) !== String(myId)
      );
      if (otherUser) {
        navigation.navigate("UserProfile", { user: otherUser });
      } else {
        Alert.alert("Profile", "This is your personal space (Self Chat).");
      }
    }
  };

  const dynamicStyles = {
    header: {
      backgroundColor: theme.bgMain,
      borderBottomColor: theme.inputBorder,
    },
    inputArea: {
      backgroundColor: theme.bgMain,
      borderTopColor: theme.inputBorder,
    },
    input: { backgroundColor: theme.inputBg, color: theme.textPrimary },
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.bgMain }}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={theme.accentGreen} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.headerTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {chatName}
          </Text>
        </View>
        <TouchableOpacity onPress={handleInfoClick}>
          <Ionicons
            name="information-circle-outline"
            size={26}
            color={theme.accentGreen}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={theme.accentGreen} />
        </View>
      ) : (
        <FlatList
          data={[...messages].reverse()}
          // Use the separated component here
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              myId={myId}
              theme={theme}
              isGroup={isGroup}
              onUpdatePool={loadData}
            />
          )}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={[styles.inputArea, dynamicStyles.inputArea]}>
          {/* Hide Pool Button if Self Chat */}
          {!isSelfChat && (
            <TouchableOpacity style={styles.attachBtn} onPress={handleOpenPool}>
              <Ionicons name="add" size={28} color={theme.accentGreen} />
            </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: theme.accentGreen }]}
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal */}
      {fullChat && (
        <CreatePoolModal
          isOpen={showPoolModal}
          onClose={() => setShowPoolModal(false)}
          chat={fullChat}
          currentUser={myId}
          onSuccess={loadData}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    height: 60,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  msgWrapper: { maxWidth: "80%", marginBottom: 8 }, // Reduced margin since time is hidden
  sentWrapper: { alignSelf: "flex-end", alignItems: "flex-end" },
  receivedWrapper: { alignSelf: "flex-start", alignItems: "flex-start" },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: "bold",
  },
  bubble: { padding: 12, borderRadius: 18 },
  time: { fontSize: 11, opacity: 0.8 },

  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 50,
    borderTopWidth: 1,
    gap: 10,
    minHeight: 80,
  },

  attachBtn: { padding: 4 },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatWindowScreen;
