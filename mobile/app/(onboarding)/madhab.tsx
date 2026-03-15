import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

const MADHABS = [
  {
    id: "hanafi",
    name: "Hanafi",
    nameAr: "الحنفي",
    description: "Founded by Imam Abu Hanifa. Most widely followed school, predominant in Turkey, Central Asia, South Asia, and parts of the Arab world.",
  },
  {
    id: "maliki",
    name: "Maliki",
    nameAr: "المالكي",
    description: "Founded by Imam Malik ibn Anas. Predominant in North Africa, West Africa, and parts of the Arabian Peninsula.",
  },
  {
    id: "shafii",
    name: "Shafi'i",
    nameAr: "الشافعي",
    description: "Founded by Imam Al-Shafi'i. Predominant in East Africa, Southeast Asia, and parts of the Middle East.",
  },
  {
    id: "hanbali",
    name: "Hanbali",
    nameAr: "الحنبلي",
    description: "Founded by Imam Ahmad ibn Hanbal. Predominant in Saudi Arabia and parts of the Gulf region.",
  },
];

export default function MadhabScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const updateProfile = useAuth((s) => s.updateProfile);

  const handleComplete = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateProfile({ madhab: selected });
      router.replace("/(app)/chat");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Select Your Madhab" }} />

      <Text style={styles.title}>Which school of thought do you follow?</Text>
      <Text style={styles.subtitle}>
        DeenyAI will tailor answers according to your madhab
      </Text>

      <View style={styles.cards}>
        {MADHABS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.card,
              selected === m.id && styles.cardSelected,
            ]}
            onPress={() => setSelected(m.id)}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.cardName,
                  selected === m.id && styles.cardNameSelected,
                ]}
              >
                {m.name}
              </Text>
              <Text
                style={[
                  styles.cardAr,
                  selected === m.id && styles.cardNameSelected,
                ]}
              >
                {m.nameAr}
              </Text>
            </View>
            <Text style={styles.cardDesc}>{m.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!selected || loading) && styles.buttonDisabled,
        ]}
        onPress={handleComplete}
        disabled={!selected || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Setting up..." : "Get Started"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  cards: { gap: 12, flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E8F5F5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardName: { fontSize: 20, fontWeight: "700", color: colors.text },
  cardAr: { fontSize: 20, color: colors.textSecondary },
  cardNameSelected: { color: colors.primary },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
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
