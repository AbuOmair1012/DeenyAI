import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { colors } from "../../theme/colors";

const MADHABS = [
  {
    id: "hanafi",
    descEn: "Founded by Imam Abu Hanifa. Most widely followed school, predominant in Turkey, Central Asia, South Asia, and parts of the Arab world.",
    descAr: "أسسه الإمام أبو حنيفة. المذهب الأكثر انتشاراً في تركيا وآسيا الوسطى وجنوب آسيا وبعض الدول العربية.",
  },
  {
    id: "maliki",
    descEn: "Founded by Imam Malik ibn Anas. Predominant in North Africa, West Africa, and parts of the Arabian Peninsula.",
    descAr: "أسسه الإمام مالك بن أنس. المذهب السائد في شمال أفريقيا وغرب أفريقيا وأجزاء من الجزيرة العربية.",
  },
  {
    id: "shafii",
    descEn: "Founded by Imam Al-Shafi'i. Predominant in East Africa, Southeast Asia, and parts of the Middle East.",
    descAr: "أسسه الإمام الشافعي. المذهب السائد في شرق أفريقيا وجنوب شرق آسيا وأجزاء من الشرق الأوسط.",
  },
  {
    id: "hanbali",
    descEn: "Founded by Imam Ahmad ibn Hanbal. Predominant in Saudi Arabia and parts of the Gulf region.",
    descAr: "أسسه الإمام أحمد بن حنبل. المذهب السائد في المملكة العربية السعودية وأجزاء من منطقة الخليج.",
  },
];

export default function MadhabScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromSettings = from === "settings";
  const { user, updateProfile } = useAuth();
  const t = useLanguage((s) => s.t);
  const isRTL = useLanguage((s) => s.isRTL);

  const [selected, setSelected] = useState<string | null>(user?.madhab || null);
  const [loading, setLoading] = useState(false);

  const madhabName = (id: string) => {
    const map: Record<string, string> = {
      hanafi: t.hanafi,
      maliki: t.maliki,
      shafii: t.shafii,
      hanbali: t.hanbali,
    };
    return map[id] ?? id;
  };

  const madhabNameAr = (id: string) => {
    const map: Record<string, string> = {
      hanafi: "الحنفي",
      maliki: "المالكي",
      shafii: "الشافعي",
      hanbali: "الحنبلي",
    };
    return map[id] ?? id;
  };

  const handleComplete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateProfile({ madhab: selected });
      if (fromSettings) {
        router.back();
      } else {
        router.replace("/(app)/chat");
      }
    } catch (error: any) {
      Alert.alert(t.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: fromSettings ? t.madhabLabel : t.selectMadhab }}
      />

      <Text style={[styles.title, isRTL && styles.rtlText]}>{t.selectMadhab}</Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t.madhabSubtitle}</Text>

      <View style={styles.cards}>
        {MADHABS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.card, selected === m.id && styles.cardSelected]}
            onPress={() => setSelected(m.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, selected === m.id && styles.cardNameSelected]}>
                {madhabName(m.id)}
              </Text>
              <Text style={[styles.cardAr, selected === m.id && styles.cardNameSelected]}>
                {madhabNameAr(m.id)}
              </Text>
            </View>
            <Text style={[styles.cardDesc, isRTL && styles.rtlText]}>
              {isRTL ? m.descAr : m.descEn}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (!selected || loading) && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={!selected || loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? t.settingUp
            : fromSettings
            ? t.save
            : t.getStarted}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  rtlText: { textAlign: "right" },
  cards: { gap: 12, flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: "#EBF2EE" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardName: { fontSize: 20, fontWeight: "700", color: colors.text },
  cardAr: { fontSize: 20, color: colors.textSecondary },
  cardNameSelected: { color: colors.primary },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "600" },
});
