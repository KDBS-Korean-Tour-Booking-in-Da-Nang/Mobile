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
        console.log("[Google Auth] Handling callback URL:", url);

        // Handle both deep links (mobilefe://) and HTTP URLs
        let urlObj: URL;
        try {
          urlObj = new URL(url);
        } catch {
          // If URL is relative or malformed, try to construct full URL
          const baseUrl = api.defaults.baseURL || "http://localhost:8080";
          urlObj = new URL(url, baseUrl);
        }

        const params = urlObj.searchParams;
        const errorParam = params.get("error");

        if (errorParam) {
          console.error("[Google Auth] Error in callback:", errorParam);
          throw new Error(decodeURIComponent(errorParam));
        }

        // Check if this is a direct callback with token (from backend redirect)
        const token = params.get("token");
        const userId = params.get("userId");
        const email = params.get("email");
        const username = params.get("username");
        const role = params.get("role");
        const avatar = params.get("avatar");
        const balance = params.get("balance");

        console.log("[Google Auth] Callback params:", {
          hasToken: !!token,
          hasUserId: !!userId,
          userIdValue: userId,
          hasEmail: !!email,
          hasUsername: !!username,
          hasRole: !!role,
          hasAvatar: !!avatar,
          hasBalance: !!balance,
        });

        // If we have token, userId, email - this is a direct callback from backend
        if (token && userId && email) {
          // Validate userId is a valid number
          let decodedUserId: string = userId;
          try {
            decodedUserId = decodeURIComponent(userId);
          } catch {
            decodedUserId = userId;
          }

          const parsedUserId = parseInt(decodedUserId, 10);
          if (isNaN(parsedUserId) || parsedUserId <= 0) {
            console.error("[Google Auth] Invalid userId in callback:", {
              original: userId,
              decoded: decodedUserId,
              parsed: parsedUserId,
            });
            throw new Error(
              "Invalid user ID received from authentication server"
            );
          }

          console.log("[Google Auth] Direct callback with auth data");

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

          console.log("[Google Auth] User data prepared:", {
            userId: user.userId,
            email: user.email,
            username: user.username,
            role: user.role,
          });

          await AsyncStorage.setItem("authToken", token);
          await AsyncStorage.setItem("userData", JSON.stringify(user));

          console.log("[Google Auth] Auth data saved to AsyncStorage");
          console.log("[Google Auth] Redirecting to tabs...");

          setLoading(false);
          setError(null);
          router.replace("/(tabs)");
          return;
        }

        // Otherwise, this might be an OAuth callback with code that needs to be processed
        // But for now, we expect backend to handle it and redirect with token
        console.error(
          "[Google Auth] Missing required callback data (token, userId, email)"
        );
        throw new Error(
          "Invalid callback data - missing authentication tokens"
        );
      } catch (err: any) {
        console.error("[Google Auth] Callback error:", {
          message: err.message,
          stack: err.stack,
        });
        setLoading(false);
        setError(err.message || "Google login failed");
      }
    },
    [router]
  );

  useEffect(() => {
    const subscription = addEventListener("url", ({ url }) => {
      console.log("[Google Auth] URL received:", url);

      if (url.includes("google/callback")) {
        console.log("[Google Auth] Processing callback URL...");

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

          // Validate userId is a valid number before passing to router
          let validatedUserId = userId || "";
          if (userId) {
            try {
              // Try to decode in case it's encoded
              const decoded = decodeURIComponent(userId);
              const parsed = parseInt(decoded, 10);
              if (isNaN(parsed) || parsed <= 0) {
                console.error("[Google Auth] Invalid userId in URL params:", {
                  original: userId,
                  decoded,
                  parsed,
                });
                // Don't pass invalid userId - let callback handler deal with it
                validatedUserId = "";
              } else {
                validatedUserId = String(parsed);
              }
            } catch {
              // If decode fails, try parsing directly
              const parsed = parseInt(userId, 10);
              if (isNaN(parsed) || parsed <= 0) {
                console.error(
                  "[Google Auth] Invalid userId in URL params:",
                  userId
                );
                validatedUserId = "";
              } else {
                validatedUserId = String(parsed);
              }
            }
          }

          // Navigate to google/callback screen with params (similar to transactionResult)
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
        } catch (err) {
          console.error("[Google Auth] Error parsing URL:", err);
          // Fallback: try to handle directly
          handleCallback(url);
        }
      }

      // Handle OAuth callback with code parameter (if Google redirects directly)
      if (url.includes("code=") && url.includes("scope=")) {
        console.log("[Google Auth] Processing OAuth callback with code...");
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

      console.log("[Google Auth] Starting Google login flow");
      console.log("[Google Auth] API Base URL:", api.defaults.baseURL);

      // Try getting auth URL from backend (proxied via api baseURL)
      // Pass platform=mobile so backend knows to redirect to deep link
      console.log("[Google Auth] Fetching auth URL from backend...");
      const res = await api.get<{ code?: number; result?: string }>(
        "/api/auth/google/login",
        {
          params: {
            platform: "mobile",
          },
        }
      );
      console.log("[Google Auth] Backend response:", {
        code: res.data?.code,
        hasResult: !!res.data?.result,
      });

      const rawAuthUrl = res.data?.result;
      if (!rawAuthUrl) {
        console.error("[Google Auth] No auth URL received from backend");
        throw new Error("Cannot get Google authorization URL");
      }

      console.log("[Google Auth] Raw auth URL:", rawAuthUrl);

      const updated = new URL(rawAuthUrl);
      const params = updated.searchParams;

      // Build redirect_uri - must match exactly what's registered in Google OAuth Console
      // Do NOT add query params to redirect_uri as Google will reject it
      let baseRedirectApi: string;
      const envRedirectApi = (process.env as any)
        ?.EXPO_PUBLIC_GOOGLE_REDIRECT_API;
      if (envRedirectApi) {
        // If env variable is set, use it but ensure it has the callback path
        baseRedirectApi = envRedirectApi.endsWith("/api/auth/google/callback")
          ? envRedirectApi
          : `${envRedirectApi.replace(/\/$/, "")}/api/auth/google/callback`;
      } else {
        // Default: use API base URL
        baseRedirectApi = `${(api.defaults.baseURL || "").replace(
          /\/$/,
          ""
        )}/api/auth/google/callback`;
      }

      console.log("[Google Auth] Redirect API:", baseRedirectApi);

      // Set redirect_uri without query params (must match Google Console exactly)
      params.set("redirect_uri", baseRedirectApi);

      // Use state parameter to pass platform info (Google will return it in callback)
      params.set("state", "platform=mobile");
      params.set("prompt", "select_account");
      updated.search = params.toString();
      const authUrl = updated.toString();

      console.log("[Google Auth] Final auth URL:", authUrl);

      const appRedirect =
        (process.env as any)?.EXPO_PUBLIC_GOOGLE_REDIRECT_APP ||
        "mobilefe://google/callback";

      console.log("[Google Auth] App redirect URI (deep link):", appRedirect);
      console.log("[Google Auth] Opening WebBrowser...");

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appRedirect
      );

      console.log("[Google Auth] WebBrowser result:", {
        type: result.type,
        hasUrl: !!(result.type === "success" && result.url),
      });

      WebBrowser.maybeCompleteAuthSession();

      if (result.type === "success" && result.url) {
        console.log("[Google Auth] Success! URL received:", result.url);

        if (
          result.url.includes("google/callback") ||
          result.url.includes("mobilefe://")
        ) {
          console.log("[Google Auth] Processing callback URL from result...");

          try {
            // Handle both deep link and HTTP URL
            let urlObj: URL;
            try {
              urlObj = new URL(result.url);
            } catch {
              // If URL is malformed, try to construct from deep link
              if (result.url.startsWith("mobilefe://")) {
                urlObj = new URL(result.url.replace("mobilefe://", "http://"));
              } else {
                throw new Error("Invalid URL format");
              }
            }

            const params = urlObj.searchParams;

            // Extract all params similar to Toss payment
            const token = params.get("token");
            const userId = params.get("userId");
            const email = params.get("email");
            const username = params.get("username");
            const role = params.get("role");
            const avatar = params.get("avatar");
            const balance = params.get("balance");
            const error = params.get("error");

            // Validate userId is a valid number before passing to router
            let validatedUserId = userId || "";
            if (userId) {
              try {
                // Try to decode in case it's encoded
                const decoded = decodeURIComponent(userId);
                const parsed = parseInt(decoded, 10);
                if (isNaN(parsed) || parsed <= 0) {
                  console.error("[Google Auth] Invalid userId in URL params:", {
                    original: userId,
                    decoded,
                    parsed,
                  });
                  // Don't pass invalid userId - let callback handler deal with it
                  validatedUserId = "";
                } else {
                  validatedUserId = String(parsed);
                }
              } catch {
                // If decode fails, try parsing directly
                const parsed = parseInt(userId, 10);
                if (isNaN(parsed) || parsed <= 0) {
                  console.error(
                    "[Google Auth] Invalid userId in URL params:",
                    userId
                  );
                  validatedUserId = "";
                } else {
                  validatedUserId = String(parsed);
                }
              }
            }

            // Navigate to google/callback screen with params (similar to transactionResult)
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
          } catch (err) {
            console.error("[Google Auth] Error parsing URL from result:", err);
            // Fallback: try to handle directly
            await handleCallback(result.url);
            setLoading(false);
            return;
          }
        }

        // If URL doesn't contain google/callback, try to handle it anyway
        console.log(
          "[Google Auth] URL doesn't contain google/callback, trying handleCallback..."
        );
        await handleCallback(result.url);
        setLoading(false);
      } else if (result.type === "cancel") {
        console.log("[Google Auth] User cancelled");
        setLoading(false);
      } else {
        console.warn("[Google Auth] Unexpected result type:", result.type);
        setLoading(false);
        setError("Google login was not completed");
      }
    } catch (err: any) {
      console.error("[Google Auth] Error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setLoading(false);
      setError(err.message || "Failed to start Google OAuth");
    }
  }, []);

  return {
    loginWithGoogle,
    loading,
    error,
  };
};
