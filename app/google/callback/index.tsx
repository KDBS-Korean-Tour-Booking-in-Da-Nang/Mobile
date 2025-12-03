import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthContext } from "../../../src/contexts/authContext";
import styles from "./styles";

interface GoogleCallbackParams {
  token?: string;
  userId?: string;
  email?: string;
  username?: string;
  role?: string;
  avatar?: string;
  balance?: string;
  error?: string;
}

export default function GoogleCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { checkAuthStatus } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    token,
    userId,
    email,
    username,
    role,
    avatar,
    balance,
    error: errorParam,
  } = params as unknown as GoogleCallbackParams;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[Google Callback] Received params:", {
          hasToken: !!token,
          hasUserId: !!userId,
          hasEmail: !!email,
          hasError: !!errorParam,
        });

        // Check for error first
        if (errorParam) {
          const errorMessage = decodeURIComponent(errorParam);
          console.error("[Google Callback] Error from backend:", errorMessage);
          setError(errorMessage);
          setLoading(false);
          Alert.alert("Login Failed", errorMessage, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        // Validate required params
        if (!token || !userId || !email) {
          const errorMsg = "Missing required authentication data";
          console.error("[Google Callback]", errorMsg);
          setError(errorMsg);
          setLoading(false);
          Alert.alert("Login Failed", errorMsg, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        // Prepare user data
        const user = {
          userId: parseInt(userId),
          username: username
            ? decodeURIComponent(username)
            : email.includes("@")
            ? email.split("@")[0]
            : "user",
          email: decodeURIComponent(email),
          role: decodeURIComponent(role || "USER"),
          status: "ACTIVE",
          avatar: avatar ? decodeURIComponent(avatar) : undefined,
          balance: balance ? parseFloat(balance) : 0,
        };

        console.log("[Google Callback] Saving user data:", {
          userId: user.userId,
          email: user.email,
          username: user.username,
          role: user.role,
        });

        // Save to AsyncStorage
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        console.log("[Google Callback] Auth data saved successfully");

        // Refresh auth status
        await checkAuthStatus();

        console.log("[Google Callback] Redirecting to home...");

        // Redirect to home
        router.replace("/(tabs)");
      } catch (err: any) {
        console.error("[Google Callback] Error:", {
          message: err.message,
          stack: err.stack,
        });
        const errorMsg = err.message || "Failed to complete Google login";
        setError(errorMsg);
        setLoading(false);
        Alert.alert("Login Failed", errorMsg, [
          {
            text: "OK",
            onPress: () => router.replace("/auth/login/userLogin"),
          },
        ]);
      }
    };

    handleCallback();
  }, [
    token,
    userId,
    email,
    username,
    role,
    avatar,
    balance,
    errorParam,
    router,
    checkAuthStatus,
  ]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Completing login...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return null;
}
