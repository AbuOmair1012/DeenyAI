import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { I18nManager } from "react-native";
import { type Language, getT } from "../i18n";

const LANG_KEY = "app_language";

interface LanguageState {
  language: Language;
  t: ReturnType<typeof getT>;
  isRTL: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<{ needsRestart: boolean }>;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: "en",
  t: getT("en"),
  isRTL: false,
  initialized: false,

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync(LANG_KEY);
      const lang: Language = stored === "ar" ? "ar" : "en";
      const isRTL = lang === "ar";

      // Apply RTL setting (takes effect immediately for new renders)
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);

      set({ language: lang, t: getT(lang), isRTL, initialized: true });
    } catch {
      set({ initialized: true });
    }
  },

  setLanguage: async (lang: Language) => {
    await SecureStore.setItemAsync(LANG_KEY, lang);
    const isRTL = lang === "ar";
    const needsRestart = I18nManager.isRTL !== isRTL;

    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);

    set({ language: lang, t: getT(lang), isRTL });
    return { needsRestart };
  },
}));
