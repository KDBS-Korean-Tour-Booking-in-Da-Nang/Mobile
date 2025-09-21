import { Stack } from "expo-router";

export default function TourLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="buying/index" />
    </Stack>
  );
}
