import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { useForgotPassword } from "../src/hooks/useAuth";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../src/constants/theme";

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const { forgotPassword, loading, error } = useForgotPassword();

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    const res = await forgotPassword(email);
    if (res) {
      setStep("otp");
      Alert.alert("Success", "OTP sent to your email");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }
    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // TODO: Implement reset password API call
    Alert.alert("Success", "Password reset successfully");
    router.replace("/login");
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.stepTitle}>Forgot Password</Text>
      <Text style={styles.stepDescription}>
        Enter your email address to receive a verification code
      </Text>

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        error={error || undefined}
      />

      <Button
        title={loading ? "Sending..." : "Send OTP"}
        onPress={handleSendOTP}
        loading={loading}
        style={styles.button}
      />
    </>
  );

  const renderOTPStep = () => (
    <>
      <Text style={styles.stepTitle}>Enter OTP</Text>
      <Text style={styles.stepDescription}>
        We have sent a verification code to {email}
      </Text>

      <Input
        label="OTP Code"
        placeholder="Enter 6-digit code"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
      />

      <Button
        title="Verify OTP"
        onPress={handleVerifyOTP}
        style={styles.button}
      />

      <Button
        title="Resend OTP"
        onPress={handleSendOTP}
        variant="outline"
        style={styles.button}
      />
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Text style={styles.stepTitle}>New Password</Text>
      <Text style={styles.stepDescription}>Enter your new password</Text>

      <Input
        label="New Password"
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <Button
        title="Reset Password"
        onPress={handleResetPassword}
        style={styles.button}
      />
    </>
  );

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
        <Text style={styles.headerTitle}>Reset Password</Text>
        <Text style={styles.headerSubtitle}>
          Follow the steps to reset your password
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {step === "email" && renderEmailStep()}
        {step === "otp" && renderOTPStep()}
        {step === "password" && renderPasswordStep()}

        <Button
          title="Back to Login"
          onPress={() => router.back()}
          variant="ghost"
          style={styles.backButton}
        />
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
  stepTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  button: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.xl,
  },
});
