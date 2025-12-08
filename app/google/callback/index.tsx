import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthContext } from "../../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const processedRef = useRef(false);
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
    // Prevent multiple processing
    if (processedRef.current) return;

    const handleCallback = async () => {
      try {
        console.log("[Google Callback] Received params:", {
          hasToken: !!token,
          hasUserId: !!userId,
          userIdValue: userId,
          hasEmail: !!email,
          hasUsername: !!username,
          usernameValue: username,
          hasError: !!errorParam,
        });

        // Check for error first
        if (errorParam) {
          const errorMessage = decodeURIComponent(errorParam);
          console.error("[Google Callback] Error from backend:", errorMessage);
          setError(errorMessage);
          setLoading(false);
          Alert.alert(t("common.error") || "Login Failed", errorMessage, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        // Validate required params
        if (!token || !userId || !email) {
          const errorMsg =
            t("auth.oauth.missingInfo") ||
            "Missing required authentication data";
          console.error("[Google Callback]", errorMsg);
          setError(errorMsg);
          setLoading(false);
          Alert.alert(t("common.error") || "Login Failed", errorMsg, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        // Decode token
        const decodedToken = decodeURIComponent(token);

        // Get rememberMe preference (default to true for mobile if not set)
        const rememberMePref = await AsyncStorage.getItem("oauth_remember_me");
        const rememberMe = rememberMePref === "true" || rememberMePref === null;
        await AsyncStorage.removeItem("oauth_remember_me");

        // Store rememberMe preference
        await AsyncStorage.setItem("rememberMe", rememberMe ? "true" : "false");

        // Clean up OAuth provider flag if exists
        await AsyncStorage.removeItem("oauth_provider");

        // Decode user data
        const decodedEmail = decodeURIComponent(email);
        const decodedRole = role ? decodeURIComponent(role) : "USER";
        const decodedUsername = username
          ? decodeURIComponent(username)
          : decodedEmail.includes("@")
          ? decodedEmail.split("@")[0]
          : "user";
        const decodedAvatar = avatar ? decodeURIComponent(avatar) : undefined;
        const decodedBalance = balance ? parseFloat(balance) : 0;

        // Decode and validate userId - it should be a number
        // Try to decode first in case it's URL encoded, but userId should be a plain number
        let decodedUserId: string = userId;
        try {
          // Try decoding in case it's encoded
          decodedUserId = decodeURIComponent(userId);
        } catch {
          // If decode fails, use original value
          decodedUserId = userId;
        }

        // Validate userId is a valid number
        const parsedUserId = parseInt(decodedUserId, 10);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
          console.error("[Google Callback] Invalid userId:", {
            original: userId,
            decoded: decodedUserId,
            parsed: parsedUserId,
            username: decodedUsername,
            allParams: {
              token,
              userId,
              email,
              username,
              role,
              avatar,
              balance,
            },
          });
          const errorMsg =
            "Invalid user ID received from authentication server. Please try logging in again.";
          setError(errorMsg);
          setLoading(false);
          Alert.alert(t("common.error") || "Login Failed", errorMsg, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        console.log("[Google Callback] Validated userId:", {
          original: userId,
          decoded: decodedUserId,
          parsed: parsedUserId,
        });

        // Validate role - only USER is allowed for mobile
        if (decodedRole !== "USER") {
          const errorMsg =
            "Only USER role is allowed for mobile app. Please use web app for other roles.";
          console.error("[Google Callback]", errorMsg);
          setError(errorMsg);
          setLoading(false);
          Alert.alert(t("common.error") || "Login Failed", errorMsg, [
            {
              text: "OK",
              onPress: () => router.replace("/auth/login/userLogin"),
            },
          ]);
          return;
        }

        // Prepare user object
        const user = {
          userId: parsedUserId,
          username: decodedUsername,
          email: decodedEmail,
          role: decodedRole,
          status: "ACTIVE",
          avatar: decodedAvatar,
          balance: decodedBalance,
        };

        console.log("[Google Callback] Saving user data:", {
          userId: user.userId,
          email: user.email,
          username: user.username,
          role: user.role,
        });

        // Store token in AsyncStorage (mobile always uses AsyncStorage)
        await AsyncStorage.setItem("authToken", decodedToken);
        if (rememberMe) {
          const expiryAt = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
          await AsyncStorage.setItem("tokenExpiry", String(expiryAt));
        } else {
          await AsyncStorage.removeItem("tokenExpiry");
        }

        // Store user data
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        console.log("[Google Callback] Auth data saved successfully");

        // Check for returnAfterLogin
        const returnAfterLogin = await AsyncStorage.getItem("returnAfterLogin");
        if (returnAfterLogin) {
          await AsyncStorage.removeItem("returnAfterLogin");
        }

        // Refresh auth status
        await checkAuthStatus();

        console.log("[Google Callback] Redirecting...");

        // Navigate to home or returnAfterLogin
        if (returnAfterLogin) {
          router.replace(returnAfterLogin as any);
        } else {
          router.replace("/(tabs)");
        }
      } catch (err: any) {
        console.error("[Google Callback] Error:", {
          message: err.message,
          stack: err.stack,
        });
        const errorMsg =
          t("auth.oauth.failed", {
            message: err.message || "Unknown error",
          }) ||
          `Failed to complete Google login: ${err.message || "Unknown error"}`;
        setError(errorMsg);
        setLoading(false);
        Alert.alert(t("common.error") || "Login Failed", errorMsg, [
          {
            text: "OK",
            onPress: () => router.replace("/auth/login/userLogin"),
          },
        ]);
      }
    };

    processedRef.current = true;
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
    t,
  ]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {t("auth.login.submitting") || "Completing login..."}
        </Text>
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
