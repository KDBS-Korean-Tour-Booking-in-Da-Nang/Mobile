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
import { useForgotPassword } from "../../../hooks/useAuth";
import styles from "./styles";

export default function ForgotPassword() {
  const { navigate } = useNavigation();
  const { forgotPassword } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Invalid email address");
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
        Alert.alert("Error", "Request failed. Please try again.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Request failed. Please try again."
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
          <Text style={styles.formTitle}>Forgot Password</Text>
          <Text style={styles.formSubtitle}>Enter your email to continue</Text>

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
