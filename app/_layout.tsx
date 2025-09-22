import { Stack, useRouter } from "expo-router";
import "../src/i18n";
import { View } from "react-native";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProvider } from "../src/navigation";
import { AuthProvider, useAuthContext } from "../src/contexts/authContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const redirect = async () => {
      if (loading || hasRedirectedRef.current) return;

      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

      // Try to restore last route if user was authenticated
      const lastRoute = await AsyncStorage.getItem("lastRoute");

      if (!hasSeenOnboarding) {
        // First time user - show onboarding
        router.replace("/onboarding" as any);
      } else if (!isAuthenticated) {
        // User has seen onboarding but not logged in - go to auth
        router.replace("/auth" as any);
      } else {
        // User is authenticated - try to restore last route or go to home
        if (lastRoute && lastRoute !== "/onboarding" && lastRoute !== "/auth") {
          router.replace(lastRoute as any);
        } else {
          router.replace("/home" as any);
        }
      }

      hasRedirectedRef.current = true;
    };

    redirect();
  }, [isAuthenticated, loading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="forum" />
      <Stack.Screen name="tour" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="transactionResult" />
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
