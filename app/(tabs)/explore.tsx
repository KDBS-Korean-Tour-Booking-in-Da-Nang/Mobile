import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
} from "../../src/constants/theme";

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          Discover what you can do with our app
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🔐</Text>
          <Text style={styles.featureTitle}>Secure Authentication</Text>
          <Text style={styles.featureDescription}>
            Login with email/password or OAuth providers like Google and Naver
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📱</Text>
          <Text style={styles.featureTitle}>Mobile First</Text>
          <Text style={styles.featureDescription}>
            Built with React Native for the best mobile experience
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🎨</Text>
          <Text style={styles.featureTitle}>Beautiful UI</Text>
          <Text style={styles.featureDescription}>
            Modern design with smooth animations and intuitive navigation
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureTitle}>Fast & Responsive</Text>
          <Text style={styles.featureDescription}>
            Optimized performance with efficient state management
          </Text>
        </View>
      </View>

      <View style={styles.techStackContainer}>
        <Text style={styles.sectionTitle}>Technology Stack</Text>
        <View style={styles.techGrid}>
          <View style={styles.techItem}>
            <Text style={styles.techName}>React Native</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techName}>Expo</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techName}>TypeScript</Text>
          </View>
          <View style={styles.techItem}>
            <Text style={styles.techName}>Axios</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
    ...shadows.medium,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  techStackContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  techGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  techItem: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    width: "48%",
    alignItems: "center",
  },
  techName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary.contrast,
  },
});
