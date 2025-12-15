import { Stack } from "expo-router";

export default function VoucherListLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="voucherDetail" />
    </Stack>
  );
}
