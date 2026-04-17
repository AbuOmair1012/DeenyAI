import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { router, Stack } from "expo-router";
import { useLanguage } from "../../hooks/useLanguage";
import { colors } from "../../theme/colors";

const LANGUAGES = [
  { code: "en" as const, label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "ar" as const, label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦" },
];

export default function LanguageScreen() {
  const { language, setLanguage } = useLanguage();
  const [selected, setSelected] = useState(language);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { needsRestart } = await setLanguage(selected);
    setLoading(false);

    if (needsRestart) {
      Alert.alert(
        selected === "ar" ? "إعادة التشغيل مطلوبة" : "Restart Required",
        selected === "ar"
          ? "سيتم تطبيق تغيير اللغة عند إعادة تشغيل التطبيق."
          : "Language change will apply after restarting the app.",
        [
          {
            text: selected === "ar" ? "حسناً" : "OK",
            onPress: () => router.push("/(onboarding)/country"),
          },
        ]
      );
    } else {
      router.push("/(onboarding)/country");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Image
          source={require("../../assets/AskDeenyLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Ask Deeny</Text>
        <Text style={styles.subtitle}>اسأل ديني</Text>
      </View>

      <Text style={styles.title}>
        {selected === "ar" ? "اختر اللغة" : "Select Language"}
      </Text>
      <Text style={styles.hint}>
        {selected === "ar" ? "اختر لغتك المفضلة" : "Choose your preferred language"}
      </Text>

      <View style={styles.options}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.option, selected === lang.code && styles.optionSelected]}
            onPress={() => setSelected(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <View style={styles.optionText}>
              <Text
                style={[
                  styles.optionLabel,
                  selected === lang.code && styles.optionLabelSelected,
                ]}
              >
                {lang.nativeLabel}
              </Text>
              <Text style={styles.optionSub}>{lang.label}</Text>
            </View>
            {selected === lang.code && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? selected === "ar" ? "جارٍ الحفظ..." : "Saving..."
            : selected === "ar" ? "التالي" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
  },
  options: {
    gap: 14,
    marginBottom: 32,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 14,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EBF2EE",
  },
  flag: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
});
