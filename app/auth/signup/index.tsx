import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "../../../src/navigation";
import { useSignUp } from "../../../src/hooks/useAuth";
import { useTranslation } from "react-i18next";
import styles from "./styles";

export default function SignUp() {
  const { navigate } = useNavigation();
  const { signUp } = useSignUp();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    if (password.length < 6) {
      return;
    }

    setLoading(true);

    try {
      const response = await signUp(email, password, fullName, "USER");

      if (response) {
        navigate(
          `/auth/verify?email=${encodeURIComponent(
            email
          )}&fullName=${encodeURIComponent(fullName)}&role=USER&isSignUp=true`
        );
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("../../../assets/images/signup.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Form Card overlapping -140 */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{t("auth.signup.title")}</Text>
        <Text style={styles.formSubtitle}>{t("auth.signup.subtitle")}</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t("auth.common.fullName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.signup.fullNamePlaceholder")}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t("auth.common.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.signup.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t("auth.common.password")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.signup.passwordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.signUpButtonText}>{t("auth.signup.title")}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("auth.common.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={require("../../../assets/images/google.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={require("../../../assets/images/naver.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t("auth.signup.haveAccount")}</Text>
          <TouchableOpacity onPress={() => navigate("/auth/login/userLogin")}>
            <Text style={styles.footerLink}>{t("auth.signup.signIn")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
