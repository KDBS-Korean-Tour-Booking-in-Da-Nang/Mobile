import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import googleOAuthService, {
  GoogleAuthResponse,
} from "../services/googleOAuthService";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Khởi tạo Google OAuth service
    googleOAuthService.initializeGoogleAuth();

    // Set up callbacks
    googleOAuthService.onGoogleLoginSuccess = (
      response: GoogleAuthResponse
    ) => {
      setLoading(false);
      setError(null);
      // Redirect to home screen sau khi login thành công
      router.replace("/(tabs)");
    };

    googleOAuthService.onGoogleLoginError = (error: Error) => {
      setLoading(false);
      setError(error.message);
    };

    // Cleanup khi component unmount
    return () => {
      googleOAuthService.cleanup();
    };
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await googleOAuthService.startGoogleLogin();
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  }, []);

  return {
    loginWithGoogle,
    loading,
    error,
  };
};
