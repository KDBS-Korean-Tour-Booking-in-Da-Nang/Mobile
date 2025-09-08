import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

// This hook remains for login form logic
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      // Align with AuthContext and backend contract
      const response = await api.post("/api/auth/login", { email, password });
      return response?.data ?? null;
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

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "USER" | "BUSINESS"
  ) => {
    setLoading(true);
    setError(null);
    try {
      // Align with Website: use /api/users/register and send username, email, password
      const response = await api.post("/api/users/register", {
        username: fullName,
        email,
        password,
      });
      // Treat any 2xx as success; some backends return a boolean or message
      return response?.data ?? true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
};
