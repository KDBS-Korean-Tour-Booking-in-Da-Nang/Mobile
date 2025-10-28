import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en/common.json";
import vi from "./locales/vi/common.json";
import ko from "./locales/ko/common.json";

const LANGUAGE_KEY = "user-language";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      const language = savedLanguage || "vi";
      callback(language);
    } catch {
      callback("vi");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch {}
  },
};

i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "vi",
    debug: false,
    resources: {
      en: {
        common: en,
      },
      vi: {
        common: vi,
      },
      ko: {
        common: ko,
      },
    },
    defaultNS: "common",
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false, 
    },
    missingKeyHandler: (lng, ns, key) => {
      return key;
    },
  });

i18next.on("languageChanged", async (lng) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch {}
});

export default i18next;
