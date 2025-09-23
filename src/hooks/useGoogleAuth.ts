import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { addEventListener } from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCallback = useCallback(
    async (url: string) => {
      try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        const errorParam = params.get("error");
        if (errorParam) throw new Error(decodeURIComponent(errorParam));

        const token = params.get("token");
        const userId = params.get("userId");
        const email = params.get("email");
        const username = params.get("username");
        const role = params.get("role");
        const avatar = params.get("avatar");

        if (!token || !userId || !email)
          throw new Error("Invalid callback data");

        const user = {
          userId: parseInt(userId),
          username:
            username || (email.includes("@") ? email.split("@")[0] : "user"),
          email: decodeURIComponent(email),
          role: decodeURIComponent(role || "USER"),
          status: "ACTIVE",
          avatar: avatar ? decodeURIComponent(avatar) : undefined,
        };

        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        setLoading(false);
        setError(null);
        router.replace("/(tabs)");
      } catch (err: any) {
        setLoading(false);
        setError(err.message || "Google login failed");
      }
    },
    [router]
  );

  useEffect(() => {
    const subscription = addEventListener("url", ({ url }) => {
      if (url.includes("google/callback")) {
        handleCallback(url);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [handleCallback]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try getting auth URL from backend (proxied via api baseURL)
      const res = await api.get<{ code?: number; result?: string }>(
        "/api/auth/google/login"
      );
      const rawAuthUrl = res.data?.result;
      if (!rawAuthUrl) throw new Error("Cannot get Google authorization URL");

      const updated = new URL(rawAuthUrl);
      const params = updated.searchParams;
      const redirectApi =
        (process.env as any)?.EXPO_PUBLIC_GOOGLE_REDIRECT_API ||
        `${(api.defaults.baseURL || "").replace(
          /\/$/,
          ""
        )}/api/auth/google/callback`;
      params.set("redirect_uri", redirectApi);
      params.set("prompt", "select_account");
      updated.search = params.toString();
      const authUrl = updated.toString();

      const appRedirect =
        (process.env as any)?.EXPO_PUBLIC_GOOGLE_REDIRECT_APP ||
        `${(api.defaults.baseURL || "").replace(/\/$/, "")}/google/callback`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appRedirect
      );

      if (result.type === "success" && result.url) {
        await handleCallback(result.url);
      } else if (result.type === "cancel") {
        setLoading(false);
      } else {
        setLoading(false);
        setError("Google login was not completed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to start Google OAuth");
    }
  }, [handleCallback]);

  return {
    loginWithGoogle,
    loading,
    error,
  };
};
