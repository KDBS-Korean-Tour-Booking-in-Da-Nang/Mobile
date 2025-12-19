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
import { useNavigation } from "../../../navigation/navigation";
import { useLocalSearchParams } from "expo-router";
import api from "../../../services/api";
import styles from "../verify/styles";

export default function SetNewPassword() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const email = (params.email as string) || "";
  const otp = (params.otpCode as string) || "";

  const handleSetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../../assets/images/otp-set.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Set New Password</Text>
          <Text style={styles.formSubtitle}>
            Please enter a code from email
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New password</Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              value={newPassword}
              onChangeText={(text) => {
                // Remove spaces from password input
                const filteredText = text.replace(/\s/g, "");
                setNewPassword(filteredText);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm new password</Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              value={confirmPassword}
              onChangeText={(text) => {
                // Remove spaces from password input
                const filteredText = text.replace(/\s/g, "");
                setConfirmPassword(filteredText);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              loading && styles.verifyButtonDisabled,
            ]}
            onPress={handleSetPassword}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? "..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
