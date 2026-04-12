import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../services/api";
import { useLanguage } from "../../../hooks/useLanguage";
import { colors } from "../../../theme/colors";

export default function ChatListScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useLanguage((s) => s.t);
  const isRTL = useLanguage((s) => s.isRTL);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (error: any) {
      console.error("Load sessions error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadSessions(); }, []));

  const handleNewChat = async () => {
    try {
      const session = await api.createSession();
      router.push(`/(app)/chat/${session.id}`);
    } catch (error: any) {
      Alert.alert(t.error, error.message);
    }
  };

  const handleDeleteSession = (id: string) => {
    Alert.alert(t.deleteChat, t.deleteConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          await api.deleteSession(id);
          setSessions((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return t.today;
    if (days === 1) return t.yesterday;
    if (days < 7) return t.daysAgo(days);
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {sessions.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color={colors.border} />
          <Text style={styles.emptyTitle}>{t.noConversations}</Text>
          <Text style={styles.emptySubtitle}>{t.startNewChat}</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.session, isRTL && styles.sessionRTL]}
              onPress={() => router.push(`/(app)/chat/${item.id}`)}
              onLongPress={() => handleDeleteSession(item.id)}
            >
              <View style={styles.sessionIcon}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.sessionContent}>
                <Text style={[styles.sessionTitle, isRTL && styles.rtlText]} numberOfLines={1}>
                  {item.title || t.chats}
                </Text>
                <Text style={[styles.sessionDate, isRTL && styles.rtlText]}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  rtlText: { textAlign: "right" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: "center" },
  session: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  sessionRTL: { flexDirection: "row-reverse" },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EBF2EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionContent: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  sessionDate: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
