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
    if (processedRef.current) return;

    const handleCallback = async () => {
      try {
        if (errorParam) {
          const errorMessage = decodeURIComponent(errorParam);
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

        if (!token || !userId || !email) {
          const errorMsg =
            t("auth.oauth.missingInfo") ||
            "Missing required authentication data";
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

        const decodedToken = decodeURIComponent(token);

        const rememberMePref = await AsyncStorage.getItem("oauth_remember_me");
        const rememberMe = rememberMePref === "true" || rememberMePref === null;
        await AsyncStorage.removeItem("oauth_remember_me");

        await AsyncStorage.setItem("rememberMe", rememberMe ? "true" : "false");

        await AsyncStorage.removeItem("oauth_provider");

        const decodedEmail = decodeURIComponent(email);
        const decodedRole = role ? decodeURIComponent(role) : "USER";
        const decodedUsername = username
          ? decodeURIComponent(username)
          : decodedEmail.includes("@")
          ? decodedEmail.split("@")[0]
          : "user";
        const decodedAvatar = avatar ? decodeURIComponent(avatar) : undefined;
        const decodedBalance = balance ? parseFloat(balance) : 0;

        let decodedUserId: string = userId;
        try {
          decodedUserId = decodeURIComponent(userId);
        } catch {
          decodedUserId = userId;
        }

        const parsedUserId = parseInt(decodedUserId, 10);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
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

        if (decodedRole !== "USER") {
          const errorMsg =
            "Only USER role is allowed for mobile app. Please use web app for other roles.";
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

        const user = {
          userId: parsedUserId,
          username: decodedUsername,
          email: decodedEmail,
          role: decodedRole,
          status: "ACTIVE",
          avatar: decodedAvatar,
          balance: decodedBalance,
        };

        await AsyncStorage.setItem("authToken", decodedToken);
        if (rememberMe) {
          const expiryAt = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
          await AsyncStorage.setItem("tokenExpiry", String(expiryAt));
        } else {
          await AsyncStorage.removeItem("tokenExpiry");
        }

        await AsyncStorage.setItem("userData", JSON.stringify(user));

        const returnAfterLogin = await AsyncStorage.getItem("returnAfterLogin");
        if (returnAfterLogin) {
          await AsyncStorage.removeItem("returnAfterLogin");
        }

        await checkAuthStatus();

        if (returnAfterLogin) {
          router.replace(returnAfterLogin as any);
        } else {
          router.replace("/(tabs)");
        }
      } catch (err: any) {
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
