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
import styles from "./styles";

export default function VerifyEmail() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = (params.email as string) || "";
  const fullName = (params.fullName as string) || "";
  const role = (params.role as string) || "USER";
  const isSignUp = params.isSignUp === "true";

  

  const sendOTP = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      if (isSignUp) {
        const resp = await api.post("/api/users/regenerate-otp", { email });
        if (resp?.data?.code === 1000 || resp?.data?.code === 0)
          setCountdown(60);
        else Alert.alert("Error", resp?.data?.message || "Request failed");
      } else {
        const resp = await api.post("/api/auth/forgot-password/request", {
          email,
        });
        if (resp?.data?.code === 1000 || resp?.data?.message?.includes("OTP"))
          setCountdown(60);
        else Alert.alert("Error", resp?.data?.message || "Request failed");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Request failed"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Error", "Invalid OTP code");
      return;
    }
    setLoading(true);
    try {
      let ok = false;
      if (isSignUp) {
        const resp = await api.post("/api/users/verify-email", {
          email,
          otpCode: otp,
        });
        ok =
          (resp?.data?.code === 1000 || resp?.data?.code === 0) &&
          resp?.data?.result === true;
      } else {
        const resp = await api.post(
          "/api/auth/forgot-password/verify-otp",
          undefined,
          { params: { email, otpCode: otp } }
        );
        ok = Boolean(resp?.data?.result ?? resp?.data);
      }

      if (!ok) throw new Error("Verify failed");

      if (isSignUp) {
        if (role === "BUSINESS")
          navigate(
            `/businessInfo?${new URLSearchParams({
              email,
              fullName,
            }).toString()}`
          );
        else navigate("/auth/login/userLogin");
      } else {
        navigate(
          `/auth/reset?${new URLSearchParams({
            email,
            otpCode: otp,
          }).toString()}`
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Verification failed");
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
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../../assets/images/otp-set.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>OTP Verification</Text>
          <Text style={styles.formSubtitle}>
            Please enter a code from email
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your code</Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              loading && styles.verifyButtonDisabled,
            ]}
            onPress={verifyOTP}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? "..." : "Verification"}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <TouchableOpacity
              onPress={sendOTP}
              disabled={countdown > 0 || resendLoading}
            >
              <Text
                style={
                  countdown > 0 ? styles.resendDisabled : styles.resendLink
                }
              >
                {resendLoading
                  ? "Sending..."
                  : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
