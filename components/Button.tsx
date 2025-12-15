import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primary.main
              : colors.primary.contrast
          }
          size="small"
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.small,
  },

  primary: {
    backgroundColor: colors.primary.main,
  },
  secondary: {
    backgroundColor: colors.secondary.main,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  ghost: {
    backgroundColor: "transparent",
  },

  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },

  text: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.primary.contrast,
  },
  secondaryText: {
    color: colors.secondary.contrast,
  },
  outlineText: {
    color: colors.primary.main,
  },
  ghostText: {
    color: colors.primary.main,
  },

  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.text.disabled,
  },
});
