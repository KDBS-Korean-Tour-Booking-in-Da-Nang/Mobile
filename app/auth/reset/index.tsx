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
// Hardcode English for auth flows

export default function ResetPassword() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
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
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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
        Alert.alert("Success", "Password has been reset successfully", [
          {
            text: "OK",
            onPress: () => navigate("/auth/login/userLogin"),
          },
        ]);
      } else {
        Alert.alert("Error", resp?.data?.message || "Cannot reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Network error. Please try again.");
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

            <Text style={styles.formTitle}>Create new password</Text>
            <Text style={styles.formSubtitle}>
              Please enter a new password for your account
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
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
              <Text style={styles.inputLabel}>Confirm new password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter new password"
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
              <Text style={styles.requirementsTitle}>
                Password requirements:
              </Text>
              <Text style={styles.requirementItem}>
                • At least 6 characters
              </Text>
              <Text style={styles.requirementItem}>
                • Should include upper and lower case
              </Text>
              <Text style={styles.requirementItem}>
                • Should include numbers and special characters
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
                  <Text style={styles.resetButtonText}>Resetting...</Text>
                </View>
              ) : (
                <Text style={styles.resetButtonText}>Reset password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity
                onPress={() => navigate("/auth/login/userLogin")}
              >
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
