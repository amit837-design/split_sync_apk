import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDashboardDataApi } from "../../services/pool.api";
import { useTheme } from "../../context/ThemeContext";

// --- ANIMATION COMPONENT ---
// Runs a "Waterfall Fade-In" every time the screen is focused
const AnimatedItem = ({ children, index }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current; // Slide from 50px down

  useFocusEffect(
    useCallback(() => {
      // 1. Reset animation state instantly
      fade.setValue(0);
      slide.setValue(50);

      // 2. Play animation
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 500,
          delay: index * 100, // Staggered delay
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 18,
          stiffness: 100,
          delay: index * 100,
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

const DashboardScreen = () => {
  const { theme } = useTheme();

  const [data, setData] = useState({
    totalOwed: 0,
    totalDue: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId, setMyId] = useState(null);

  // 1. Get User ID
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

  // 2. Fetch Data
  const loadDashboard = useCallback(async () => {
    try {
      const { data: resData } = await getDashboardDataApi();
      setData(resData);
    } catch (error) {
      console.error("Dashboard load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // 3. Render Activity Item
  const renderActivity = (pool, index) => {
    const creatorId = pool.creator?._id || pool.creator;
    const isCreator = String(creatorId) === String(myId);

    let icon = "💸";
    let title = "Expense Pool";
    let subtitle = "";
    let amountColor = theme.textPrimary;
    let iconBg = theme.inputBg;

    // Logic matches your React App exactly
    if (isCreator) {
      title = pool.title;
      if (pool.status === "settled") {
        icon = "✅";
        subtitle = "Payment Received";
        amountColor = theme.accentGreen;
        iconBg = "rgba(34, 197, 94, 0.1)";
      } else if (pool.status === "cancelled") {
        icon = "🚫";
        subtitle = "Cancelled";
        amountColor = theme.textSecondary;
        iconBg = "rgba(255, 255, 255, 0.05)";
      } else {
        icon = "⏳";
        subtitle = "You are owed";
        amountColor = "#f59e0b"; // Orange
        iconBg = "rgba(245, 158, 11, 0.1)";
      }
    } else {
      title = pool.title;
      if (pool.status === "settled") {
        icon = "✅";
        subtitle = "You Paid";
        amountColor = theme.textSecondary;
        iconBg = "rgba(255, 255, 255, 0.05)";
      } else {
        icon = "💸";
        subtitle = "Payment Due";
        amountColor = theme.error;
        iconBg = "rgba(239, 68, 68, 0.1)";
      }
    }

    return (
      <AnimatedItem key={pool._id} index={index}>
        <View style={styles.activityItem}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
          <View style={styles.activityInfo}>
            <Text
              style={[styles.actTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.actSub, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
          <Text style={[styles.amountText, { color: amountColor }]}>
            ${pool.amountOwed?.toFixed(2)}
          </Text>
        </View>
      </AnimatedItem>
    );
  };

  const dynamicStyles = {
    header: {
      backgroundColor: theme.bgCard,
      borderBottomColor: theme.inputBorder,
    },
    card: { backgroundColor: theme.bgCard, borderColor: theme.inputBorder },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Dashboard
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} // 🔥 SCROLL BAR REMOVED
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentGreen}
          />
        }
      >
        {/* Stats Card */}
        <View style={[styles.statsCard, dynamicStyles.card]}>
          {/* Green Gauge (Full Circle) */}
          <View style={styles.gaugeContainer}>
            <View
              style={[styles.gaugeCircle, { borderColor: theme.accentGreen }]}
            >
              <View style={styles.gaugeContent}>
                <Text style={[styles.currency, { color: theme.textSecondary }]}>
                  $
                </Text>
                <Text style={[styles.amount, { color: theme.textPrimary }]}>
                  {data.totalOwed?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Owed
            </Text>
          </View>

          {/* Orange Gauge (Full Circle) */}
          <View style={styles.gaugeContainer}>
            <View style={[styles.gaugeCircle, { borderColor: "#f59e0b" }]}>
              <View style={styles.gaugeContent}>
                <Text style={[styles.currency, { color: theme.textSecondary }]}>
                  $
                </Text>
                <Text style={[styles.amount, { color: theme.textPrimary }]}>
                  {data.totalDue?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Due
            </Text>
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Recent pool activities
          </Text>

          {loading && !refreshing ? (
            <ActivityIndicator
              color={theme.accentGreen}
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.activityList}>
              {data.recentActivity?.length === 0 ? (
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No recent transactions.
                </Text>
              ) : (
                data.recentActivity.map((pool, index) =>
                  renderActivity(pool, index)
                )
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 10,
    borderBottomWidth: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 30,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  gaugeContainer: {
    alignItems: "center",
    gap: 12,
  },
  gaugeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes it a perfect circle
    borderWidth: 6, // Thickness of the ring
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  gaugeContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  currency: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
  },
  actTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  actSub: {
    fontSize: 13,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default DashboardScreen;
