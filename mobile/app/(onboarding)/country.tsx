import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { colors } from "../../theme/colors";

const COUNTRIES = [
  { code: "SA", name: "Saudi Arabia", nameAr: "المملكة العربية السعودية" },
  { code: "EG", name: "Egypt", nameAr: "مصر" },
  { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات" },
  { code: "JO", name: "Jordan", nameAr: "الأردن" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت" },
  { code: "QA", name: "Qatar", nameAr: "قطر" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", name: "Oman", nameAr: "عُمان" },
  { code: "IQ", name: "Iraq", nameAr: "العراق" },
  { code: "SY", name: "Syria", nameAr: "سوريا" },
  { code: "LB", name: "Lebanon", nameAr: "لبنان" },
  { code: "PS", name: "Palestine", nameAr: "فلسطين" },
  { code: "YE", name: "Yemen", nameAr: "اليمن" },
  { code: "LY", name: "Libya", nameAr: "ليبيا" },
  { code: "TN", name: "Tunisia", nameAr: "تونس" },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر" },
  { code: "MA", name: "Morocco", nameAr: "المغرب" },
  { code: "SD", name: "Sudan", nameAr: "السودان" },
  { code: "TR", name: "Turkey", nameAr: "تركيا" },
  { code: "PK", name: "Pakistan", nameAr: "باكستان" },
  { code: "BD", name: "Bangladesh", nameAr: "بنغلاديش" },
  { code: "MY", name: "Malaysia", nameAr: "ماليزيا" },
  { code: "ID", name: "Indonesia", nameAr: "إندونيسيا" },
  { code: "NG", name: "Nigeria", nameAr: "نيجيريا" },
  { code: "GB", name: "United Kingdom", nameAr: "المملكة المتحدة" },
  { code: "US", name: "United States", nameAr: "الولايات المتحدة" },
  { code: "CA", name: "Canada", nameAr: "كندا" },
  { code: "DE", name: "Germany", nameAr: "ألمانيا" },
  { code: "FR", name: "France", nameAr: "فرنسا" },
  { code: "AU", name: "Australia", nameAr: "أستراليا" },
];

export default function CountryScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromSettings = from === "settings";
  const { user, updateProfile } = useAuth();
  const t = useLanguage((s) => s.t);
  const isRTL = useLanguage((s) => s.isRTL);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(user?.country || null);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nameAr.includes(search)
  );

  const handleNext = async () => {
    if (!selected) return;
    await updateProfile({ country: selected });
    if (fromSettings) {
      router.back();
    } else {
      router.push("/(onboarding)/madhab");
    }
  };

  const displayName = (c: typeof COUNTRIES[0]) =>
    isRTL ? c.nameAr : c.name;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: fromSettings ? t.countryLabel : t.whereDoYouLive }}
      />

      <Text style={[styles.title, isRTL && styles.rtlText]}>{t.whereDoYouLive}</Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t.countrySubtitle}</Text>

      <TextInput
        style={[styles.search, isRTL && styles.inputRTL]}
        placeholder={t.searchCountries}
        placeholderTextColor={colors.textLight}
        value={search}
        onChangeText={setSearch}
        textAlign={isRTL ? "right" : "left"}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, selected === item.code && styles.itemSelected]}
            onPress={() => setSelected(item.code)}
          >
            <Text
              style={[styles.itemText, selected === item.code && styles.itemTextSelected]}
            >
              {displayName(item)}
            </Text>
            <Text
              style={[styles.itemSub, selected === item.code && styles.itemTextSelected]}
            >
              {isRTL ? item.name : item.nameAr}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>
          {fromSettings ? t.save : t.next}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  rtlText: { textAlign: "right" },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  inputRTL: { textAlign: "right" },
  list: { flex: 1 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: "#EBF2EE" },
  itemText: { fontSize: 16, color: colors.text, fontWeight: "500" },
  itemSub: { fontSize: 14, color: colors.textSecondary },
  itemTextSelected: { color: colors.primary, fontWeight: "600" },
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
