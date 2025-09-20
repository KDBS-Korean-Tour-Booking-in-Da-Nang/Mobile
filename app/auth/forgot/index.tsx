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
  Image,
} from "react-native";
import { useNavigation } from "../../../src/navigation";
import { useForgotPassword } from "../../../src/hooks/useAuth";
import { useTranslation } from "react-i18next";
import styles from "./styles";

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
      Alert.alert(t("auth.login.error"), t("auth.login.invalidEmail"));
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

        navigate(`/auth/verify?${params.toString()}`);
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
            source={require("../../../assets/images/forgotpassword.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Form Card overlapping */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t("auth.forgot.title")}</Text>
          <Text style={styles.formSubtitle}>{t("auth.forgot.subtitle")}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t("auth.common.email")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("auth.forgot.emailPlaceholder")}
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
            <Text style={styles.sendButtonText}>{t("auth.forgot.send")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
