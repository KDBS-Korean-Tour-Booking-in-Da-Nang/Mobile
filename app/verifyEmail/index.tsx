import React, { useState, useEffect } from "react";
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
import api from "../../src/services/api";
import { useNavigation } from "../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing, borderRadius } from "../../src/constants/theme";

export default function VerifyEmail() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = params.email as string;
  const fullName = params.fullName as string;
  const role = params.role as string;
  const isSignUp = params.isSignUp === "true";

  useEffect(() => {
    // Always send one OTP on entry to ensure delivery
    (async () => {
      await sendOTP();
    })();
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOTP = async () => {
    setResendLoading(true);
    try {
      const resp = await api.post("/api/users/regenerate-otp", { email });
      const data = resp?.data;
      if (data?.code === 1000 || data?.code === 0) {
        setCountdown(60);
      } else {
        Alert.alert(
          t("auth.login.error"),
          data?.message || t("auth.login.error")
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("auth.login.error"),
        error?.response?.data?.message ||
          error?.message ||
          t("auth.login.error")
      );
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert(t("auth.login.error"), t("auth.common.otpPlaceholder"));
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post("/api/users/verify-email", {
        email,
        otpCode: otp,
      });
      const data = resp?.data;
      if ((data?.code === 1000 || data?.code === 0) && data?.result === true) {
        if (isSignUp) {
          if (role === "BUSINESS") {
            const params = new URLSearchParams({ email, fullName });
            navigate(`/businessInfo?${params.toString()}`);
          } else {
            navigate("/loginSelection");
          }
        } else {
          const params = new URLSearchParams({ email });
          navigate(`/resetPassword?${params.toString()}`);
        }
      } else {
        Alert.alert(
          t("auth.login.error"),
          data?.message || t("auth.login.error")
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("auth.login.error"),
        error?.response?.data?.message ||
          error?.message ||
          t("auth.login.error")
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
            <Text style={styles.headerTitle}>{t("auth.login.title")}</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="mail" size={48} color={colors.primary.main} />
              </View>
            </View>

            <Text style={styles.formTitle}>{t("auth.login.title")}</Text>
            <Text style={styles.formSubtitle}>
              {t("auth.common.notReceivedCode")}
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>{t("auth.common.otp")}</Text>
              <TextInput
                style={styles.otpInput}
                placeholder={t("auth.common.otpPlaceholder")}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                loading && styles.verifyButtonDisabled,
              ]}
              onPress={verifyOTP}
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
                  <Text style={styles.verifyButtonText}>
                    {t("auth.register.submitting")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>
                  {t("auth.common.send")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {t("auth.common.notReceivedCode")}
              </Text>
              <TouchableOpacity
                onPress={sendOTP}
                disabled={countdown > 0 || resendLoading}
                style={styles.resendButton}
              >
                {resendLoading ? (
                  <Text style={styles.resendButtonText}>
                    {t("auth.common.sending")}
                  </Text>
                ) : countdown > 0 ? (
                  <Text style={styles.resendButtonTextDisabled}>
                    {t("auth.common.resendIn", { seconds: countdown })}
                  </Text>
                ) : (
                  <Text style={styles.resendButtonText}>
                    {t("auth.common.resend")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.infoText}>{t("auth.login.subtitle")}</Text>
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
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary.main,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  otpContainer: {
    marginBottom: spacing.xl,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  otpInput: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.medium,
    textAlign: "center",
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  resendText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  resendButton: {
    padding: spacing.sm,
  },
  resendButtonText: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    fontSize: 16,
    color: colors.text.disabled,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});
