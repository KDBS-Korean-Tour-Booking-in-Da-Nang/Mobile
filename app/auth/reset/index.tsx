import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "../../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import api from "../../../src/services/api";
import { colors } from "../../../src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = params.email as string;
  const otp = (params.otpCode as string) || "";

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t("auth.login.error"), t("auth.reset.fillAll"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("auth.login.error"), t("auth.reset.passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("auth.login.error"), t("auth.reset.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post("/api/auth/forgot-password/reset", {
        email,
        otpCode: otp,
        newPassword,
      });
      const ok = resp?.data?.code === 1000 || resp?.status === 200;
      if (ok) {
        Alert.alert(t("common.success"), t("auth.reset.resetSuccess"), [
          {
            text: "OK",
            onPress: () => navigate("/auth/login/userLogin"),
          },
        ]);
      } else {
        Alert.alert(
          t("auth.login.error"),
          resp?.data?.message || t("auth.reset.cannotReset")
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert(t("auth.login.error"), t("common.networkError"));
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
        {/* Header removed */}

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
              <TouchableOpacity
                onPress={() => navigate("/auth/login/userLogin")}
              >
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
