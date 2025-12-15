import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../navigation/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";
import styles from "./styles";

export default function UserLogin() {
  const { navigate, replace } = useNavigation();
  const { login, checkAuthStatus } = useAuthContext();
  const { t } = useTranslation();
  const {
    loginWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, "USER");
      await checkAuthStatus();
      replace("/home");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      await checkAuthStatus();
    } catch {

    }
  };

  useEffect(() => {
    if (googleError) {
      Alert.alert("Error", googleError);
    }
  }, [googleError]);

  return (
    <View style={styles.container}>
      {Platform.OS === "android" && (
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
      )}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {}
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../../assets/images/signin.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formSubtitle}>Please enter a valid account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="youremails@yahoo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="********"
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
                  color="#000"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => navigate("/auth/forgot")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.signInButton,
              loading && styles.signInButtonDisabled,
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
                <Text style={styles.signInButtonText}>Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                (googleLoading || loading) && styles.socialButtonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Image
                  source={require("../../../assets/images/google.png")}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("../../../assets/images/naver.png")}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have account? </Text>
            <TouchableOpacity onPress={() => navigate("/auth/signup")}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}
