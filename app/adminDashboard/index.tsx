import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#6B46C1", "#8B5CF6"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Quản lý hệ thống tour du lịch</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Chào mừng Admin!</Text>
        <Text style={styles.description}>
          Đây là trang quản lý dành cho nhân viên và quản trị viên
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.primary.contrast,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.primary.contrast,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
