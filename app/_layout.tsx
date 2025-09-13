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
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      if (loading) return;
      const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!hasSeen) {
        router.replace("/onboarding" as any);
        return;
      }
      if (isAuthenticated) {
        router.replace("/forum");
      } else {
        router.replace("/userLogin");
      }
    };
    redirect();
  }, [isAuthenticated, loading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="onboarding" />
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
        </View>
      </AuthProvider>
    </NavigationProvider>
  );
}
