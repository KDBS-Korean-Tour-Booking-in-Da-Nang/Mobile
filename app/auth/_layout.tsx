import { Stack } from "expo-router";
import { StatusBar, Platform } from "react-native";
import { useEffect } from "react";

export default function AuthLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setBarStyle("light-content", true);
    }
  }, []);

  return (
    <>
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login/userLogin" />
        <Stack.Screen name="signup/index" />
        <Stack.Screen name="forgot/index" />
        <Stack.Screen name="reset/index" />
        <Stack.Screen name="verify/index" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/edit/index" />
      </Stack>
    </>
  );
}
