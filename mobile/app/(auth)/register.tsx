import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { colors } from "../../theme/colors";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);
  const t = useLanguage((s) => s.t);
  const isRTL = useLanguage((s) => s.isRTL);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert(t.error, t.emailRequired);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t.error, t.passwordsNotMatch);
      return;
    }
    if (password.length < 6) {
      Alert.alert(t.error, t.passwordTooShort);
      return;
    }
    setLoading(true);
    try {
      await register(email, password, firstName, lastName);
      router.replace("/");
    } catch (error: any) {
      Alert.alert(t.registrationFailed, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require("../../assets/AskDeenyLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.subtitle}>{t.createAccount}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, isRTL && styles.inputRTL]}
              placeholder={t.firstName}
              placeholderTextColor={colors.textLight}
              value={firstName}
              onChangeText={setFirstName}
              textAlign={isRTL ? "right" : "left"}
            />
            <TextInput
              style={[styles.input, styles.halfInput, isRTL && styles.inputRTL]}
              placeholder={t.lastName}
              placeholderTextColor={colors.textLight}
              value={lastName}
              onChangeText={setLastName}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t.email}
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign={isRTL ? "right" : "left"}
          />
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t.password}
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign={isRTL ? "right" : "left"}
          />
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t.confirmPassword}
            placeholderTextColor={colors.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign={isRTL ? "right" : "left"}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t.creatingAccount : t.createAccount}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.alreadyHaveAccount} </Text>
            <Link href="/(auth)/login" style={styles.link}>
              {t.signIn}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6 },
  form: { gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputRTL: { textAlign: "right" },
  halfInput: { flex: 1 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
