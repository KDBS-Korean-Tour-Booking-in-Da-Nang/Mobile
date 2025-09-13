import React, { useEffect, useState } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import api from "../../src/services/api";
import { spacing, borderRadius } from "../../src/constants/theme";

const { width } = Dimensions.get("window");

export default function VerifyEmail() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = (params.email as string) || "";
  const fullName = (params.fullName as string) || "";
  const role = (params.role as string) || "USER";
  const isSignUp = params.isSignUp === "true";

  useEffect(() => {
    sendOTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0)
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOTP = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      if (isSignUp) {
        // Sign up flow
        const resp = await api.post("/api/users/regenerate-otp", { email });
        if (resp?.data?.code === 1000 || resp?.data?.code === 0)
          setCountdown(60);
        else
          Alert.alert(
            t("auth.login.error"),
            resp?.data?.message || t("auth.login.error")
          );
      } else {
        // Forgot password flow
        const resp = await api.post("/api/auth/forgot-password/request", {
          email,
        });
        if (resp?.data?.code === 1000 || resp?.data?.message?.includes("OTP"))
          setCountdown(60);
        else
          Alert.alert(
            t("auth.login.error"),
            resp?.data?.message || t("auth.login.error")
          );
      }
    } catch (err: any) {
      Alert.alert(
        t("auth.login.error"),
        err?.response?.data?.message || err?.message || t("auth.login.error")
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
      let ok = false;
      if (isSignUp) {
        const resp = await api.post("/api/users/verify-email", {
          email,
          otpCode: otp,
        });
        ok =
          (resp?.data?.code === 1000 || resp?.data?.code === 0) &&
          resp?.data?.result === true;
      } else {
        const resp = await api.post(
          "/api/auth/forgot-password/verify-otp",
          undefined,
          { params: { email, otpCode: otp } }
        );
        ok = Boolean(resp?.data?.result ?? resp?.data);
      }

      if (!ok) throw new Error("Verify failed");

      if (isSignUp) {
        if (role === "BUSINESS")
          navigate(
            `/businessInfo?${new URLSearchParams({
              email,
              fullName,
            }).toString()}`
          );
        else navigate("/userLogin");
      } else {
        navigate(
          `/resetPassword?${new URLSearchParams({
            email,
            otpCode: otp,
          }).toString()}`
        );
      }
    } catch (err: any) {
      Alert.alert(t("auth.login.error"), err?.message || t("auth.login.error"));
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
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/otp-set.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>OTP Verification</Text>
          <Text style={styles.formSubtitle}>
            Please enter a code from email
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your code</Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
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
            <Text style={styles.verifyButtonText}>
              {loading ? "..." : "Verification"}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <TouchableOpacity
              onPress={sendOTP}
              disabled={countdown > 0 || resendLoading}
            >
              <Text
                style={
                  countdown > 0 ? styles.resendDisabled : styles.resendLink
                }
              >
                {resendLoading
                  ? t("auth.common.sending")
                  : countdown > 0
                  ? t("auth.common.resendIn", { seconds: countdown })
                  : t("auth.common.resend")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A8EEA" },
  scrollContent: { flexGrow: 1 },
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  illustration: { width: width * 0.8, height: width * 0.8 },
  formCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: -140,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000",
    marginBottom: spacing.sm,
    textAlign: "left",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#000",
    marginBottom: spacing.xl,
    textAlign: "left",
  },
  inputContainer: { marginBottom: spacing.lg },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#000",
  },
  verifyButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: "center",
  },
  verifyButtonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: "#fff", fontWeight: "700" },
  resendRow: { alignItems: "center", marginTop: spacing.lg },
  resendLink: { color: "#000", fontSize: 14, fontWeight: "500" },
  resendDisabled: { color: "#9CA3AF", fontSize: 14, fontWeight: "500" },
});
