import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const expoDev = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_DEV) as string | undefined;
const expoProd = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_PROD) as string | undefined;

const API_BASE_URL_DEV = (expoDev || "").replace(/\/$/, "");
const API_BASE_URL_PROD = (expoProd ?? "").replace(/\/$/, "");

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

      const isAuthEndpoint = url.startsWith("/api/auth/");

      if (token && !isAuthEndpoint) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      if (userData) {
        const user = JSON.parse(userData);
        let email: string | undefined = user?.email;
        if (!email) {
          email = user?.userEmail || user?.emailAddress || user?.mail;
        }
        if (email) {
          (config.headers as any)["User-Email"] = email;
        }
      }
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

export const API_BASE = API_BASE_URL;
export default api;
