import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { updatePoolStatusApi } from "../services/pool.api";

const PoolBubble = ({ message, isMe, onUpdate }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Safety Check: Ensure pool data exists
  const pool = message.poolId;

  // Load User ID
  useEffect(() => {
    AsyncStorage.getItem("userInfo").then((json) => {
      if (json) {
        const u = JSON.parse(json);
        setCurrentUserId(u.user?._id || u.user?.id || u._id);
      }
    });
  }, []);

  // Fallback if pool data is missing or broken
  if (!pool || typeof pool !== "object") {
    return (
      <View
        style={{ padding: 12, backgroundColor: theme.bgCard, borderRadius: 12 }}
      >
        <Text style={{ color: theme.textPrimary }}>
          {message.content || "Expense Pool"}
        </Text>
      </View>
    );
  }

  if (!currentUserId) return null; // Wait for ID load

  const status = pool.status; // pending, verification_pending, settled, cancelled
  const creatorId = pool.creator?._id || pool.creator;
  const borrowerId = pool.borrower?._id || pool.borrower;

  const isCreator = String(creatorId) === String(currentUserId);
  const isBorrower = String(borrowerId) === String(currentUserId);

  const handleAction = async (action) => {
    if (loading) return;
    setLoading(true);
    try {
      await updatePoolStatusApi({
        poolId: pool._id,
        action: action,
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // Status Configuration
  const getStatusConfig = () => {
    switch (status) {
      case "settled":
        return {
          icon: "checkmark-circle",
          text: "Paid & Settled",
          color: theme.accentGreen,
          bg: "rgba(34, 197, 94, 0.1)",
        };
      case "verification_pending":
        return {
          icon: "time",
          text: "Verifying...",
          color: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.1)",
        };
      case "cancelled":
        return {
          icon: "close-circle",
          text: "Cancelled",
          color: theme.error,
          bg: "rgba(239, 68, 68, 0.1)",
        };
      default:
        return {
          icon: "cash",
          text: "Payment Pending",
          color: theme.textSecondary,
          bg: theme.bgCard,
        };
    }
  };

  const config = getStatusConfig();
  const splitText = pool.creatorIncluded ? "Split Equally" : "Full Amount";

  return (
    <View
      style={[
        styles.card,
        {
          borderColor:
            config.color === theme.textSecondary
              ? "rgba(255,255,255,0.1)"
              : config.color,
          backgroundColor: config.bg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.iconBox, { backgroundColor: "rgba(255,255,255,0.1)" }]}
        >
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>
            {pool.title}
          </Text>
          <View style={styles.subRow}>
            <Text style={[styles.amount, { color: theme.textPrimary }]}>
              ${pool.amountOwed}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{splitText}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.1)" }]}
      />

      {/* Status Text */}
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        {/* PENDING */}
        {status === "pending" && (
          <>
            {isCreator && (
              <TouchableOpacity
                onPress={() => handleAction("cancel")}
                disabled={loading}
                style={[styles.btn, styles.outlineBtn]}
              >
                <Text style={{ color: theme.error }}>Cancel</Text>
              </TouchableOpacity>
            )}
            {isBorrower && (
              <TouchableOpacity
                onPress={() => handleAction("mark_paid")}
                disabled={loading}
                style={[styles.btn, { backgroundColor: theme.textPrimary }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={{ color: "#000", fontWeight: "bold" }}>
                    Mark as Paid
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* VERIFICATION */}
        {status === "verification_pending" && (
          <>
            {isCreator ? (
              <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                <TouchableOpacity
                  onPress={() => handleAction("reject")}
                  style={[
                    styles.btn,
                    { backgroundColor: "rgba(239, 68, 68, 0.2)", width: 40 },
                  ]}
                >
                  <Ionicons name="close" size={18} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAction("confirm")}
                  style={[
                    styles.btn,
                    { flex: 1, backgroundColor: theme.accentGreen },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={{ color: "#000", fontWeight: "bold" }}>
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={{
                  fontStyle: "italic",
                  color: theme.textSecondary,
                  fontSize: 12,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Waiting for confirmation...
              </Text>
            )}
          </>
        )}

        {/* SETTLED / CANCELLED */}
        {(status === "settled" || status === "cancelled") && (
          <Text
            style={{
              fontSize: 10,
              color: theme.textSecondary,
              opacity: 0.7,
              width: "100%",
              textAlign: "center",
            }}
          >
            {status === "settled"
              ? "Transaction Complete"
              : "Request Cancelled"}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 220,
    maxWidth: 260,
  },
  header: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 12, fontWeight: "500" },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "bold" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, color: "#ccc" },
  divider: { height: 1, marginVertical: 8 },
  statusText: { fontSize: 11, fontWeight: "bold", marginBottom: 8 },
  actions: { flexDirection: "row", alignItems: "center", minHeight: 30 },
  btn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineBtn: { borderWidth: 1, borderColor: "#ef4444" },
});

export default PoolBubble;
