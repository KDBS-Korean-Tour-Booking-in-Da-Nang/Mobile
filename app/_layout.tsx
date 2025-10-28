import { Stack, useRouter } from "expo-router";
import "../localization/i18n";
import { View } from "react-native";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationProvider } from "../navigation/navigation";
import { AuthProvider, useAuthContext } from "../src/contexts/authContext";
import { PremiumProvider } from "../src/contexts/premiumContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const redirect = async () => {
      if (loading || hasRedirectedRef.current) return;

      router.replace("/onboarding" as any);

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
      <Stack.Screen name="article" />
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
        <PremiumProvider>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
          </View>
        </PremiumProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
