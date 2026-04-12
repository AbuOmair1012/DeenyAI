import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { colors } from "../../theme/colors";
import type { Language } from "../../i18n";

const LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦" },
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const t = useLanguage((s) => s.t);
  const { language, setLanguage, isRTL } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const madhabNames: Record<string, string> = {
    hanafi: t.hanafi,
    maliki: t.maliki,
    shafii: t.shafii,
    hanbali: t.hanbali,
  };

  const handleLogout = () => {
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSaveLanguage = async () => {
    const { needsRestart } = await setLanguage(selectedLang);
    setLangModalVisible(false);
    if (needsRestart) {
      Alert.alert(
        selectedLang === "ar" ? "إعادة التشغيل مطلوبة" : "Restart Required",
        selectedLang === "ar"
          ? "أغلق التطبيق وأعد فتحه لتفعيل اللغة العربية."
          : "Please close and reopen the app to apply the language change."
      );
    }
  };

  const rowAlign = isRTL ? styles.rowReverse : styles.row;

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.profile}</Text>
        <View style={[styles.card, rowAlign]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isRTL && styles.rtlText]}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
            </Text>
            <Text style={[styles.profileEmail, isRTL && styles.rtlText]}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.preferences}</Text>

        <TouchableOpacity
          style={[styles.prefRow, rowAlign]}
          onPress={() => router.push("/(onboarding)/madhab?from=settings")}
        >
          <View style={[styles.rowLeft, isRTL && styles.rowLeftReverse]}>
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <View>
              <Text style={[styles.rowLabel, isRTL && styles.rtlText]}>{t.madhabLabel}</Text>
              <Text style={styles.rowValue}>
                {madhabNames[user?.madhab] || t.notSet}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.prefRow, rowAlign]}
          onPress={() => router.push("/(onboarding)/country?from=settings")}
        >
          <View style={[styles.rowLeft, isRTL && styles.rowLeftReverse]}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <View>
              <Text style={[styles.rowLabel, isRTL && styles.rtlText]}>{t.countryLabel}</Text>
              <Text style={styles.rowValue}>{user?.country || t.notSet}</Text>
            </View>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.prefRow, rowAlign]}
          onPress={() => { setSelectedLang(language); setLangModalVisible(true); }}
        >
          <View style={[styles.rowLeft, isRTL && styles.rowLeftReverse]}>
            <Ionicons name="language-outline" size={22} color={colors.primary} />
            <View>
              <Text style={[styles.rowLabel, isRTL && styles.rtlText]}>{t.language}</Text>
              <Text style={styles.rowValue}>
                {LANGUAGES.find((l) => l.code === language)?.nativeLabel}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.account}</Text>
        <TouchableOpacity
          style={[styles.logoutRow, isRTL && styles.rowReverse]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>{t.version}</Text>

      {/* Language Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t.language}</Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  selectedLang === lang.code && styles.langOptionSelected,
                ]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langLabel,
                    selectedLang === lang.code && styles.langLabelSelected,
                  ]}
                >
                  {lang.nativeLabel}
                </Text>
                {selectedLang === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setLangModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveLanguage}>
                <Text style={styles.modalSaveText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  rtlText: { textAlign: "right" },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  row: { flexDirection: "row" },
  rowReverse: { flexDirection: "row-reverse" },
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
  profileEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  prefRow: {
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLeftReverse: { flexDirection: "row-reverse" },
  rowLabel: { fontSize: 16, fontWeight: "500", color: colors.text },
  rowValue: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  logoutRow: {
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: "500", color: colors.error },
  version: { textAlign: "center", color: colors.textLight, fontSize: 12, padding: 20 },

  // Language modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000060",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  langOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EBF2EE",
  },
  langFlag: { fontSize: 28 },
  langLabel: { flex: 1, fontSize: 18, fontWeight: "600", color: colors.text },
  langLabelSelected: { color: colors.primary },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, color: colors.textSecondary },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalSaveText: { fontSize: 16, fontWeight: "600", color: colors.white },
});
