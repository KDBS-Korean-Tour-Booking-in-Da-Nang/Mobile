import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { colors, spacing, borderRadius, shadows } from "../constants/theme";

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.primary} size="small" />
      ) : (
        <>
          <Text style={styles.googleIcon}>🔍</Text>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    ...shadows.small,
  },
  disabled: {
    opacity: 0.5,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
});
