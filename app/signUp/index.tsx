import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "../../src/navigation";
import { useSignUp } from "../../src/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { spacing } from "../../src/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function SignUp() {
  const { navigate } = useNavigation();
  const { signUp } = useSignUp();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      setError(t("auth.login.error"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.register.errors.passwordMinLength"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await signUp(email, password, fullName, "USER");

      if (response) {
        navigate(
          `/verifyEmail?email=${encodeURIComponent(
            email
          )}&fullName=${encodeURIComponent(fullName)}&role=USER&isSignUp=true`
        );
      } else {
        setError(t("auth.register.errors.registerFailed"));
      }
    } catch (error: any) {
      setError(error.message || t("auth.register.errors.registerFailed"));
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
          source={require("../../assets/images/signup.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Form Card overlapping -140 */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Sign Up</Text>
        <Text style={styles.formSubtitle}>Create an account, it’s free</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="youremails@yahoo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
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
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={require("../../assets/images/google.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image
              source={require("../../assets/images/naver.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Have account?</Text>
          <TouchableOpacity onPress={() => navigate("/userLogin")}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A8EEA" },
  contentContainer: { flexGrow: 1 },
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
    marginTop: -160,
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

  inputContainer: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: spacing.xs,
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

  signUpButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: "center",
  },
  signUpButtonText: { color: "#fff", fontWeight: "700" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#000" },
  dividerText: {
    marginHorizontal: spacing.md,
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },

  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
  },
  socialIcon: { width: 24, height: 24 },
  socialIconPlaceholder: { width: 24, height: 24 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 16, color: "#9CA3AF" },
  footerLink: { fontSize: 16, color: "#000", fontWeight: "700" },
});
