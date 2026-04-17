import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { colors } from "../theme/colors";

export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { initialized: langInitialized } = useLanguage();

  if (isLoading || !langInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user?.onboardingComplete) {
    return <Redirect href="/(onboarding)/language" />;
  }

  return <Redirect href="/(app)/chat" />;
}
