import { Tabs } from "expo-router";
import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors, spacing } from "../../src/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.disabled,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopColor: colors.border.light,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { color }]}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { color }]}>🔍</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
});
