import { Stack, useRouter } from "expo-router";
import "../src/i18n";
import { View } from "react-native";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationProvider } from "../src/navigation";
import { AuthProvider, useAuthContext } from "../src/contexts/authContext";
import { hasSeenOnboarding } from "../src/utils/onboardingUtils";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      if (loading) return;

      try {
        // Check if user has seen onboarding
        const userHasSeenOnboarding = await hasSeenOnboarding();

        // If user hasn't seen onboarding, show it first
        if (!userHasSeenOnboarding) {
          console.log("First time user - showing onboarding");
          router.replace("/onboarding" as any);
          return;
        }

        // If user has seen onboarding, proceed with normal auth flow
        if (isAuthenticated) {
          router.replace("/forum");
        } else {
          router.replace("/userLogin");
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // If there's an error, default to showing onboarding
        router.replace("/onboarding" as any);
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
