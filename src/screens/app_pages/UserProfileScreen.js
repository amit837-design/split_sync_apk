import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// API & Context
import { getFriendBalanceApi } from "../../services/pool.api";
import { fetchChatsApi } from "../../services/chat.api";
import { useTheme } from "../../context/ThemeContext";

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // Params passed: { user: object }
  const params = route.params || {};
  const user = params.user || params;

  const [balanceData, setBalanceData] = useState({
    netBalance: 0,
    loading: true,
  });
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const loadData = async () => {
      if (!user?._id) return;

      try {
        const balRes = await getFriendBalanceApi(user._id);
        setBalanceData({ ...balRes.data, loading: false });
      } catch (error) {
        console.error("Failed to fetch balance", error);
        setBalanceData({ netBalance: 0, loading: false });
      }

      try {
        const chatRes = await fetchChatsApi();
        setChats(chatRes.data);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setLoadingChats(false);
      }
    };
    loadData();
  }, [user]);

  // 2. Mutual Groups Logic
  const mutualGroups = useMemo(() => {
    if (!user || !chats) return [];
    return chats.filter(
      (c) =>
        c.isGroupChat &&
        c.users.some((u) => String(u._id || u) === String(user._id))
    );
  }, [chats, user]);

  if (!user)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.bgMain,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={theme.accentGreen} />
      </SafeAreaView>
    );

  const initial = user.name ? user.name[0].toUpperCase() : "?";
  const isOwed = balanceData.netBalance > 0;
  const isDue = balanceData.netBalance < 0;
  const isSettled = balanceData.netBalance === 0;
  const absAmount = Math.abs(balanceData.netBalance).toFixed(2);

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: theme.bgMain },
    card: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
    textPrimary: { color: theme.textPrimary },
    textSecondary: { color: theme.textSecondary },
    financeCard: {
      backgroundColor: theme.bgCard,
      borderColor: theme.inputBorder,
    },
    // 🔥 Header Border Fix
    headerBorder: { borderBottomColor: theme.inputBorder },
  };

  if (isOwed) {
    dynamicStyles.financeCard = {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderColor: theme.accentGreen,
    };
  } else if (isDue) {
    dynamicStyles.financeCard = {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      borderColor: "#f59e0b",
    };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {/* 🔥 Custom Header with Border */}
      <View style={[styles.header, dynamicStyles.headerBorder]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Profile Card */}
        <View style={[styles.card, dynamicStyles.card]}>
          <View
            style={[styles.avatarLarge, { backgroundColor: theme.inputBorder }]}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 36, color: theme.textSecondary }}>
                {initial}
              </Text>
            )}
          </View>
          <Text style={[styles.name, dynamicStyles.textPrimary]}>
            {user.name}
          </Text>
          <Text style={[styles.email, dynamicStyles.textSecondary]}>
            {user.email}
          </Text>
        </View>

        {/* Finance Status Card */}
        {!balanceData.loading && (
          <View style={[styles.financeCard, dynamicStyles.financeCard]}>
            <Text style={[styles.financeLabel, dynamicStyles.textSecondary]}>
              {isOwed && "You will be receiving"}
              {isDue && "You need to pay"}
              {isSettled && "All settled up"}
            </Text>
            <Text
              style={[
                styles.financeAmount,
                {
                  color: isOwed
                    ? theme.accentGreen
                    : isDue
                    ? "#f59e0b"
                    : theme.textSecondary,
                },
              ]}
            >
              {!isSettled && "$"}
              {isSettled ? "No payments pending" : absAmount}
            </Text>
          </View>
        )}

        {/* Mutual Groups */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {loadingChats
            ? "Loading Groups..."
            : `${mutualGroups.length} Mutual Group${
                mutualGroups.length !== 1 ? "s" : ""
              }`}
        </Text>

        <View style={styles.groupList}>
          {mutualGroups.length > 0
            ? mutualGroups.map((group) => (
                <TouchableOpacity
                  key={group._id}
                  style={[
                    styles.groupItem,
                    {
                      backgroundColor: theme.bgCard,
                      borderColor: theme.inputBorder,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() =>
                    navigation.push("ChatWindow", {
                      chatId: group._id,
                      isGroup: true,
                      chatName: group.chatName,
                    })
                  }
                >
                  <View
                    style={[
                      styles.groupAvatar,
                      { backgroundColor: theme.inputBorder },
                    ]}
                  >
                    {group.groupPic ? (
                      <Image
                        source={{ uri: group.groupPic }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <Text style={{ color: theme.textSecondary }}>
                        {group.chatName?.[0]}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.groupName, dynamicStyles.textPrimary]}>
                    {group.chatName}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              ))
            : !loadingChats && (
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.textSecondary,
                    marginTop: 20,
                  }}
                >
                  No groups in common
                </Text>
              )}
        </View>
      </ScrollView>
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
    borderBottomWidth: 1, // 🔥 Ensures visible border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  card: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  financeCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  financeLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  financeAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  groupList: {
    gap: 10,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  groupName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default UserProfileScreen;
