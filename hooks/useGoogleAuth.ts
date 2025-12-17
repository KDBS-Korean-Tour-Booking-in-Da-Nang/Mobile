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
        let urlObj: URL;
        try {
          urlObj = new URL(url);
        } catch {
          const baseUrl = api.defaults.baseURL || "http://localhost:8080";
          urlObj = new URL(url, baseUrl);
        }

        const params = urlObj.searchParams;
        const errorParam = params.get("error");

        if (errorParam) {
          throw new Error(decodeURIComponent(errorParam));
        }

        const token = params.get("token");
        const userId = params.get("userId");
        const email = params.get("email");
        const username = params.get("username");
        const role = params.get("role");
        const avatar = params.get("avatar");
        const balance = params.get("balance");


        if (token && userId && email) {
          let decodedUserId: string = userId;
          try {
            decodedUserId = decodeURIComponent(userId);
          } catch {
            decodedUserId = userId;
          }

          const parsedUserId = parseInt(decodedUserId, 10);
          if (isNaN(parsedUserId) || parsedUserId <= 0) {
            throw new Error(
              "Invalid user ID received from authentication server"
            );
          }

          const user = {
            userId: parsedUserId,
            username:
              username || (email.includes("@") ? email.split("@")[0] : "user"),
            email: decodeURIComponent(email),
            role: decodeURIComponent(role || "USER"),
            status: "ACTIVE",
            avatar: avatar ? decodeURIComponent(avatar) : undefined,
            balance: balance ? parseFloat(balance) : 0,
          };

          await AsyncStorage.setItem("authToken", token);
          await AsyncStorage.setItem("userData", JSON.stringify(user));

          setLoading(false);
          setError(null);
          router.replace("/(tabs)");
          return;
        }

        throw new Error(
          "Invalid callback data - missing authentication tokens"
        );
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

        try {
          let urlObj: URL;
          try {
            urlObj = new URL(url);
          } catch {
            if (url.startsWith("mobilefe://")) {
              urlObj = new URL(url.replace("mobilefe://", "http://"));
            } else {
              throw new Error("Invalid URL format");
            }
          }
          const params = urlObj.searchParams;

          const token = params.get("token");
          const userId = params.get("userId");
          const email = params.get("email");
          const username = params.get("username");
          const role = params.get("role");
          const avatar = params.get("avatar");
          const balance = params.get("balance");
          const error = params.get("error");

          let validatedUserId = userId || "";
          if (userId) {
            try {
              const decoded = decodeURIComponent(userId);
              const parsed = parseInt(decoded, 10);
              if (isNaN(parsed) || parsed <= 0) {
                validatedUserId = "";
              } else {
                validatedUserId = String(parsed);
              }
            } catch {
              const parsed = parseInt(userId, 10);
              if (isNaN(parsed) || parsed <= 0) {
                validatedUserId = "";
              } else {
                validatedUserId = String(parsed);
              }
            }
          }

          router.replace({
            pathname: "/google/callback" as any,
            params: {
              token: token || "",
              userId: validatedUserId,
              email: email || "",
              username: username || "",
              role: role || "",
              avatar: avatar || "",
              balance: balance || "",
              error: error || "",
            },
          });

          return;
        } catch {
          handleCallback(url);
        }
      }

      if (url.includes("code=") && url.includes("scope=")) {
        handleCallback(url);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [handleCallback, router]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<{ code?: number; result?: string }>(
        "/api/auth/google/login",
        {
          params: {
            platform: "mobile",
          },
        }
      );

      const rawAuthUrl = res.data?.result;
      if (!rawAuthUrl) {
        throw new Error("Cannot get Google authorization URL");
      }

      const updated = new URL(rawAuthUrl);
      const params = updated.searchParams;

      let baseRedirectApi: string;
      const envRedirectApi = (process.env as any)
        ?.EXPO_PUBLIC_GOOGLE_REDIRECT_API;
      if (envRedirectApi) {
        baseRedirectApi = envRedirectApi.endsWith("/api/auth/google/callback")
          ? envRedirectApi
          : `${envRedirectApi.replace(/\/$/, "")}/api/auth/google/callback`;
      } else {
        baseRedirectApi = `${(api.defaults.baseURL || "").replace(
          /\/$/,
          ""
        )}/api/auth/google/callback`;
      }

      params.set("redirect_uri", baseRedirectApi);
      params.set("state", "platform=mobile");
      params.set("prompt", "select_account");
      updated.search = params.toString();
      const authUrl = updated.toString();

      const appRedirect =
        (process.env as any)?.EXPO_PUBLIC_GOOGLE_REDIRECT_APP ||
        "mobilefe://google/callback";

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appRedirect
      );

      WebBrowser.maybeCompleteAuthSession();

      if (result.type === "success" && result.url) {
        if (
          result.url.includes("google/callback") ||
          result.url.includes("mobilefe://")
        ) {

          try {
            let urlObj: URL;
            try {
              urlObj = new URL(result.url);
            } catch {
              if (result.url.startsWith("mobilefe://")) {
                urlObj = new URL(result.url.replace("mobilefe://", "http://"));
              } else {
                throw new Error("Invalid URL format");
              }
            }

            const params = urlObj.searchParams;

            const token = params.get("token");
            const userId = params.get("userId");
            const email = params.get("email");
            const username = params.get("username");
            const role = params.get("role");
            const avatar = params.get("avatar");
            const balance = params.get("balance");
            const error = params.get("error");

            let validatedUserId = userId || "";
            if (userId) {
              try {
                const decoded = decodeURIComponent(userId);
                const parsed = parseInt(decoded, 10);
                if (isNaN(parsed) || parsed <= 0) {
                  validatedUserId = "";
                } else {
                  validatedUserId = String(parsed);
                }
              } catch {
                const parsed = parseInt(userId, 10);
                if (isNaN(parsed) || parsed <= 0) {
                  validatedUserId = "";
                } else {
                  validatedUserId = String(parsed);
                }
              }
            }

            router.replace({
              pathname: "/google/callback" as any,
              params: {
                token: token || "",
                userId: validatedUserId,
                email: email || "",
                username: username || "",
                role: role || "",
                avatar: avatar || "",
                balance: balance || "",
                error: error || "",
              },
            });

            setLoading(false);
            return;
          } catch {
            await handleCallback(result.url);
            setLoading(false);
            return;
          }
        }

        await handleCallback(result.url);
        setLoading(false);
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
  }, [handleCallback, router]);

  return {
    loginWithGoogle,
    loading,
    error,
  };
};
