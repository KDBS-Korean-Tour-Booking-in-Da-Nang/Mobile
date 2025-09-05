import { Stack, useRouter } from "expo-router";
import "../src/i18n";
import {
  View,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationProvider } from "../src/navigation";
import { AuthProvider, useAuthContext } from "../src/contexts/authContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be determined
    }

    if (isAuthenticated) {
      router.replace("/forum");
    } else {
      router.replace("/home");
    }
  }, [isAuthenticated, loading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="loginSelection" />
      <Stack.Screen name="userLogin" />
      <Stack.Screen name="adminLogin" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="forum" />
      <Stack.Screen name="verifyEmail" />
      <Stack.Screen name="resetPassword" />
      <Stack.Screen name="businessInfo" />
      <Stack.Screen name="forgot" />
      <Stack.Screen name="createPost" options={{ presentation: "modal" }} />
      <Stack.Screen name="userProfile" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function LanguageButton() {
  const { i18n } = useTranslation();
  const lastChangeTime = useRef<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectLanguage = async (lng: "vi" | "en" | "ko") => {
    const now = Date.now();
    if (now - lastChangeTime.current < 300) return;
    lastChangeTime.current = now;
    if (i18n.language !== lng) {
      console.log("LanguageButton: changeLanguage ->", lng);
      await i18n.changeLanguage(lng);
    }
    setMenuOpen(false);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", bottom: 24, right: 16, zIndex: 999 }}
    >
      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 14,
        }}
      >
        <Ionicons name="globe-outline" size={18} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={{ flex: 1, backgroundColor: "transparent" }} />
        </TouchableWithoutFeedback>
        <View
          style={{
            position: "absolute",
            bottom: 24,
            right: 16,
            alignItems: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingVertical: 6,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
              minWidth: 110,
            }}
          >
            {[
              { code: "vi", label: "VI" },
              { code: "en", label: "EN" },
              { code: "ko", label: "KO" },
            ].map((item) => (
              <TouchableOpacity
                key={item.code}
                onPress={() => selectLanguage(item.code as "vi" | "en" | "ko")}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    i18n.language === item.code ? "#eef2ff" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontWeight: i18n.language === item.code ? "700" : "500",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <NavigationProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <RootLayoutNav />
          <LanguageButton />
        </View>
      </AuthProvider>
    </NavigationProvider>
  );
}
