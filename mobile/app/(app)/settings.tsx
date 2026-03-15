import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

const MADHAB_NAMES: Record<string, string> = {
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleChangeMadhab = () => {
    router.push("/(onboarding)/madhab");
  };

  const handleChangeCountry = () => {
    router.push("/(onboarding)/country");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName
                ? `${user.firstName} ${user.lastName || ""}`
                : user?.email}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.row} onPress={handleChangeMadhab}>
          <View style={styles.rowLeft}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <View>
              <Text style={styles.rowLabel}>Madhab</Text>
              <Text style={styles.rowValue}>
                {MADHAB_NAMES[user?.madhab] || "Not set"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleChangeCountry}>
          <View style={styles.rowLeft}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <View>
              <Text style={styles.rowLabel}>Country</Text>
              <Text style={styles.rowValue}>{user?.country || "Not set"}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>DeenyAI v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { padding: 16, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "600", color: colors.text },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 16, fontWeight: "500", color: colors.text },
  rowValue: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: "500", color: colors.error },
  version: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: 12,
    padding: 20,
  },
});
