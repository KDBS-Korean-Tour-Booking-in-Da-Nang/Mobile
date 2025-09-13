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
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "../../src/navigation";
import { useForgotPassword } from "../../src/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { spacing } from "../../src/constants/theme";

const { width } = Dimensions.get("window");

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
        {/* Top Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/forgotpassword.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Form Card overlapping */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Forgot Password</Text>
          <Text style={styles.formSubtitle}>
            Please enter your email for sending OTP
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="youremails@yahoo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
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

  sendButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: "#fff", fontWeight: "700" },
});
