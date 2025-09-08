import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "../../src/navigation";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp } from "../../src/hooks/useAuth";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { useTranslation } from "react-i18next";
import { colors, spacing, borderRadius } from "../../src/constants/theme";

export default function SignUp() {
  const { navigate } = useNavigation();
  const { signUp } = useSignUp();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"USER" | "BUSINESS" | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName || !selectedRole) {
      setError(t("auth.login.error"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.register.errors.passwordMinLength"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await signUp(email, password, fullName, selectedRole);

      if (response) {
        navigate(
          `/verifyEmail?email=${encodeURIComponent(
            email
          )}&fullName=${encodeURIComponent(
            fullName
          )}&role=${selectedRole}&isSignUp=true`
        );
      } else {
        setError(t("auth.register.errors.registerFailed"));
      }
    } catch (error: any) {
      setError(error.message || t("auth.register.errors.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <LinearGradient
        colors={colors.gradient.primary as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>{t("auth.register.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("auth.register.title")}</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{t("auth.register.title")}</Text>

        {/* Hiển thị lỗi nếu có */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          label={t("auth.register.username")}
          placeholder={t("auth.register.usernamePlaceholder")}
          value={fullName}
          onChangeText={setFullName}
        />

        <Input
          label={t("auth.common.email")}
          placeholder={t("auth.common.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Input
          label={t("auth.common.password")}
          placeholder={t("auth.register.submitting")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Input
          label={t("auth.register.confirmPassword")}
          placeholder={t("auth.register.confirmPassword")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>{t("auth.register.roleSelect")}</Text>

          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === "USER" && styles.roleButtonSelected,
              ]}
              onPress={() => setSelectedRole("USER")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === "USER" && styles.roleButtonTextSelected,
                ]}
              >
                👤 User
              </Text>
              <Text style={styles.roleDescription}>
                {t("auth.register.roleUserTitle")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === "BUSINESS" && styles.roleButtonSelected,
              ]}
              onPress={() => setSelectedRole("BUSINESS")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === "BUSINESS" && styles.roleButtonTextSelected,
                ]}
              >
                🏢 Business
              </Text>
              <Text style={styles.roleDescription}>
                {t("auth.register.roleBusinessTitle")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title={
            loading ? t("auth.register.submitting") : t("auth.register.submit")
          }
          onPress={handleSignUp}
          loading={loading}
          style={styles.signupButton}
        />

        <View style={styles.linksContainer}>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {t("auth.register.haveAccount")} {""}
            </Text>
            <TouchableOpacity onPress={() => navigate("/loginSelection")}>
              <Text style={styles.loginLink}>{t("auth.login.title")}</Text>
            </TouchableOpacity>
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
  },
  contentContainer: {
    flexGrow: 1,
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
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  roleContainer: {
    marginVertical: spacing.lg,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  roleButtons: {
    gap: spacing.md,
  },
  roleButton: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary || "#F9FAFB",
  },
  roleButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light || "#E3F2FD",
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  roleButtonTextSelected: {
    color: colors.primary.main,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signupButton: {
    marginTop: spacing.lg,
  },
  linksContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
