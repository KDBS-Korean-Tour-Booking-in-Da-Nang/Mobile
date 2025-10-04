import React, { useState, useEffect, useRef } from "react";
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
// Hardcode English strings for this auth screen
import i18n from "../../../src/i18n";
import styles from "./styles";

export default function SignUp() {
  const { navigate } = useNavigation();
  const { signUp } = useSignUp();
  const previousLangRef = useRef<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Force English on this screen and restore previous language on leave
  useEffect(() => {
    previousLangRef.current = i18n.language;
    if (i18n.language !== "en") {
      i18n.changeLanguage("en");
    }
    return () => {
      if (previousLangRef.current && previousLangRef.current !== "en") {
        i18n.changeLanguage(previousLangRef.current);
      }
    };
  }, []);

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
        <Text style={styles.formTitle}>Sign Up</Text>
        <Text style={styles.formSubtitle}>Create a new account</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
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
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigate("/auth/login/userLogin")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
