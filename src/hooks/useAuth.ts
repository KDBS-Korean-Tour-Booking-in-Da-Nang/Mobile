import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This hook remains for login form logic
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      // Deprecated: prefer AuthContext.login; kept for compatibility if used elsewhere
      const res = await fetch("/api/auth/login");
      return (res as any) || null;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

// This hook can be used to get the initial auth status without causing dependency cycles
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("authToken");
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  return { isAuthenticated, loading };
};

// Other hooks like useSignUp, useForgotPassword can remain here as they are independent
export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      // Deprecated: prefer an endpoint function; return null for now
      return null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
};
