import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { GoogleButton } from "../src/components/GoogleButton";
import { useLogin } from "../src/hooks/useAuth";
import { useGoogleAuth } from "../src/hooks/useGoogleAuth";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../src/constants/theme";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useLogin();
  const {
    loginWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.result?.authenticated && res.result?.token) {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        await AsyncStorage.setItem("token", res.result.token);
        // Nếu có thông tin user, lưu vào context (nếu có)
        // Ví dụ: loginUser(res.result.user);
        Alert.alert("Thành công", "Đăng nhập thành công!");
        router.replace("/(tabs)");
      } else {
        setError(res?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (error: any) {
      setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      Alert.alert("Google Login Error", error.message);
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
        <Text style={styles.headerTitle}>Welcome Back!</Text>
        <Text style={styles.headerSubtitle}>Sign in to your account</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Login</Text>

        {/* Hiển thị lỗi nếu có */}
        {error ? (
          <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
        ) : null}

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={loading ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          loading={loading}
          style={styles.loginButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleButton
          onPress={handleGoogle}
          loading={googleLoading}
          style={styles.googleButton}
        />

        <View style={styles.linksContainer}>
          <Link href="/forgot" asChild>
            <Text style={styles.link}>Forgot Password?</Text>
          </Link>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Do not have an account? </Text>
            <Link href="/signup" asChild>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Link>
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
  loginButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  googleButton: {
    marginBottom: spacing.lg,
  },
  linksContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  link: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signupText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  signupLink: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
