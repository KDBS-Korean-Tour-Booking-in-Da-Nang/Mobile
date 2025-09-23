import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const expoDev = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_DEV) as string | undefined;
const expoProd = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_PROD) as string | undefined;

// Final base URLs with sensible defaults to avoid crashes
const API_BASE_URL_DEV = (expoDev || "http://localhost:8080").replace(
  /\/$/,
  ""
);
const API_BASE_URL_PROD = (expoProd ?? "https://example.com").replace(
  /\/$/,
  ""
);

const API_BASE_URL = __DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      const url = config.url || "";

      // Do NOT attach Authorization for auth endpoints (e.g., login/logout)
      const isAuthEndpoint = url.startsWith("/api/auth/");

      if (token && !isAuthEndpoint) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      if (userData) {
        const user = JSON.parse(userData);
        if (user.email) {
          (config.headers as any)["User-Email"] = user.email;
        }
      }

      // Ensure comments endpoints also receive User-Email for compatibility
    } catch {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

export default api;
