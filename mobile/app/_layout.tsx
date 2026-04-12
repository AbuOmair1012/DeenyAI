import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

export default function RootLayout() {
  const initialize = useAuth((s) => s.initialize);
  const initLang = useLanguage((s) => s.initialize);

  useEffect(() => {
    // Initialize language first (sets RTL), then auth
    initLang().then(() => initialize());
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
