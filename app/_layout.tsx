import { Stack, useRouter } from "expo-router";
import "../localization/i18n";
import { View, LogBox } from "react-native";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationProvider } from "../navigation/navigation";
import { AuthProvider, useAuthContext } from "../src/contexts/authContext";
import { NotificationProvider } from "../src/contexts/notificationContext";
import NotificationToastManager from "../components/NotificationToastManager";

LogBox.ignoreLogs([
  'No route named "payment" exists in nested children',
  'No route named "transactionResult" exists in nested children',
  'No route named "google" exists in nested children',
  'No route named "detailArticle" exists in nested children',
  'No route named "notifications" exists in nested children',
  'No route named "onboarding" exists in nested children',
  'Layout children',
  'No route named "payment"',
  'No route named "transactionResult"',
  'No route named "google"',
  'No route named "onboarding"',
  'No route named ',
  '[Layout children]',
  "SafeAreaView has been deprecated and will be removed in a future release.",
]);
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args?.[0];
  if (
    typeof msg === "string" &&
    (msg.includes("No route named") ||
      msg.includes("[Layout children]") ||
      msg.includes("SafeAreaView has been deprecated"))
  ) {
    return;
  }
  originalWarn?.(...args);
};
LogBox.ignoreAllLogs(true);

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
      <Stack.Screen name="google" />
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
        <NotificationProvider>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
          </View>
          <NotificationToastManager />
        </NotificationProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
