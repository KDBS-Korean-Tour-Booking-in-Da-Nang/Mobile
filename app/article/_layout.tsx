import { Stack } from "expo-router";

export default function ArticleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="detailArticle" />
    </Stack>
  );
}
