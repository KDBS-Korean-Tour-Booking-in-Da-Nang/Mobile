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
import authService from "../../src/services/authService";
import { useNavigation } from "../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function VerifyEmail() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = params.email as string;
  const fullName = params.fullName as string;
  const role = params.role as string;
  const isSignUp = params.isSignUp === "true";

  useEffect(() => {
    // Tự động gửi OTP khi component mount
    sendOTP();
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
      if (isSignUp) {
        await authService.sendOtp({ email });
      } else {
        await authService.forgotPassword({ email });
      }
      setCountdown(60);
      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi mã OTP. Vui lòng thử lại."
      );
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 số");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.verifyOtp({ email, otp: otp.trim() });
        if (role === "BUSINESS") {
          const params = new URLSearchParams({ email, fullName });
          navigate(`/businessInfo?${params.toString()}`);
        } else {
          Alert.alert(
            "Thành công",
            "Tài khoản đã được xác thực thành công! Vui lòng đăng nhập."
          );
          navigate("/loginSelection");
        }
      } else {
        // This part is for password reset, which is not yet fully implemented.
        // For now, we'll just verify the OTP and navigate to the reset screen.
        await authService.verifyOtp({ email, otp: otp.trim() }); // Assuming the same endpoint for now
        const params = new URLSearchParams({ email });
        navigate(`/resetPassword?${params.toString()}`);
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Mã OTP không đúng. Vui lòng thử lại."
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
            <Text style={styles.headerTitle}>Xác thực Email</Text>
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

            <Text style={styles.formTitle}>Xác thực Email</Text>
            <Text style={styles.formSubtitle}>
              Chúng tôi đã gửi mã xác thực đến
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.otpContainer}>
              <Text style={styles.otpLabel}>Nhập mã OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
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
                  <Text style={styles.verifyButtonText}>Đang xác thực...</Text>
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Xác thực</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Không nhận được mã?</Text>
              <TouchableOpacity
                onPress={sendOTP}
                disabled={countdown > 0 || resendLoading}
                style={styles.resendButton}
              >
                {resendLoading ? (
                  <Text style={styles.resendButtonText}>Đang gửi...</Text>
                ) : countdown > 0 ? (
                  <Text style={styles.resendButtonTextDisabled}>
                    Gửi lại sau {countdown}s
                  </Text>
                ) : (
                  <Text style={styles.resendButtonText}>Gửi lại</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.infoText}>
                Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra hộp thư và
                thư mục spam.
              </Text>
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
