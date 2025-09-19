import { Stack, useRouter } from "expo-router";
import "../src/i18n";
import { View } from "react-native";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
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

      // Always show onboarding first
      router.replace("/onboarding" as any);
      hasRedirectedRef.current = true;
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
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="settings" />
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
