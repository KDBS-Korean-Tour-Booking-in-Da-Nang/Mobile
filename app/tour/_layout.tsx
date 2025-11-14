import { Stack } from "expo-router";

export default function TourLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="buying/index" />
      <Stack.Screen name="voucherList" />
    </Stack>
  );
}
