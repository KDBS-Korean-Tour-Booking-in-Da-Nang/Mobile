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
import { useLogin } from "../../src/hooks/useAuth";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function AdminLogin() {
  const { navigate } = useNavigation();
  const { login } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      // Hardcode the role as 'ADMIN'. We can add a toggle for 'STAFF' later.
      const response = await login(email.trim(), password, "ADMIN");

      if (response && response.result) {
        Alert.alert("Thành công", "Đăng nhập admin thành công!");
        navigate("/forum");
      } else {
        Alert.alert(
          "Lỗi",
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Lỗi", error.message || "Không thể kết nối đến máy chủ.");
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
          colors={colors.gradient.secondary as [string, string]}
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
            <Text style={styles.headerTitle}>Staff / Admin</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons
                  name="shield"
                  size={40}
                  color={colors.secondary.main}
                />
              </View>
            </View>

            <Text style={styles.formTitle}>Đăng nhập Admin</Text>
            <Text style={styles.formSubtitle}>Truy cập hệ thống quản trị</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập email admin"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigate("/forgot")}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
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
                  <Text style={styles.loginButtonText}>Đang đăng nhập...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập Admin</Text>
              )}
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.secondary.main}
              />
              <Text style={styles.securityNoteText}>
                Truy cập được bảo mật bằng mã hóa SSL
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
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.secondary.main,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: colors.secondary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  securityNoteText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    textAlign: "center",
  },
});
