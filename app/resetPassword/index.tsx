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
import { useLocalSearchParams } from "expo-router";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function ResetPassword() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = params.email as string;

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && (data.code === 1000 || data.code === 0)) {
        Alert.alert(
          "Thành công",
          "Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.",
          [
            {
              text: "OK",
              onPress: () => navigate("/loginSelection"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Lỗi",
          data.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
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
              onPress={() => navigate("/verifyEmail")}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đặt lại mật khẩu</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="lock-open"
                  size={48}
                  color={colors.primary.main}
                />
              </View>
            </View>

            <Text style={styles.formTitle}>Tạo mật khẩu mới</Text>
            <Text style={styles.formSubtitle}>
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
              <Text style={styles.requirementItem}>• Ít nhất 6 ký tự</Text>
              <Text style={styles.requirementItem}>
                • Nên có chữ hoa, chữ thường
              </Text>
              <Text style={styles.requirementItem}>
                • Nên có số và ký tự đặc biệt
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.resetButton,
                loading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
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
                  <Text style={styles.resetButtonText}>Đang đặt lại...</Text>
                </View>
              ) : (
                <Text style={styles.resetButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã nhớ mật khẩu? </Text>
              <TouchableOpacity onPress={() => navigate("/loginSelection")}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
  },
  inputContainer: {
    marginBottom: spacing.lg,
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
  eyeButton: {
    padding: spacing.sm,
  },
  passwordRequirements: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  resetButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: "600",
  },
});
