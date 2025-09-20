import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/userLogin" />
      <Stack.Screen name="login/adminLogin" />
      <Stack.Screen name="signup/index" />
      <Stack.Screen name="forgot/index" />
      <Stack.Screen name="reset/index" />
      <Stack.Screen name="verify/index" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/businessInfo" />
      <Stack.Screen name="profile/userProfile" />
    </Stack>
  );
}
