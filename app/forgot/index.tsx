import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useForgotPassword } from "../../src/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function ForgotPassword() {
  const { navigate } = useNavigation();
  const { forgotPassword } = useForgotPassword();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t("auth.login.error"), t("auth.common.email"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("auth.login.error"), t("auth.login.error"));
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());

      if (response) {
        const params = new URLSearchParams({
          email: email.trim(),
          isSignUp: "false",
        });

        navigate(`/verifyEmail?${params.toString()}`);
        Alert.alert(t("auth.common.send"), t("auth.login.successMessage"));
      } else {
        Alert.alert(t("auth.login.error"), t("auth.login.error"));
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      Alert.alert(
        t("auth.login.error"),
        error.message || t("auth.login.error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={colors.gradient.primary as [string, string]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigate("/loginSelection")}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t("auth.login.forgotPassword")}
            </Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="key" size={48} color={colors.primary.main} />
              </View>
            </View>

            <Text style={styles.formTitle}>
              {t("auth.login.forgotPassword")}
            </Text>
            <Text style={styles.formSubtitle}>{t("auth.common.send")}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.common.email")}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={t("auth.common.email")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons
                    name="reload"
                    size={20}
                    color="white"
                    style={styles.spinning}
                  />
                  <Text style={styles.submitButtonText}>
                    {t("auth.common.sending")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("auth.common.send")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.infoText}>{t("auth.common.otp")}</Text>
            </View>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => navigate("/loginSelection")}>
                <Text style={styles.backLink}>← {t("auth.login.title")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  linksContainer: {
    alignItems: "center",
  },
  backLink: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: "500",
  },
});
