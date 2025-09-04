import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
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
  }, [isAuthenticated, loading]);

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
        <RootLayoutNav />
      </AuthProvider>
    </NavigationProvider>
  );
}
