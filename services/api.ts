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
export const apiForm = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for file uploads
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
        const email: string | undefined = user?.email;
        if (email) (config.headers as any)["User-Email"] = email;
      }

      const urlPath = url.split("?")[0];
      const pathParts = urlPath.split("/").filter(Boolean);

      if (pathParts.length >= 3 && pathParts[0] === "api") {
        const endpoint = pathParts[1];
        const pathVar = pathParts[2];
        const nextPathVar = pathParts[3];

        // Chỉ kiểm tra userId cho endpoint transactions nếu pathVar là số (userId)
        // Bỏ qua các endpoint như change-status, create, etc.
        if (endpoint === "transactions" && pathVar) {
          // Bỏ qua các endpoint không có userId trong path
          const skipValidationEndpoints = ["change-status", "create", "update"];
          if (skipValidationEndpoints.includes(pathVar)) {
            // Không cần kiểm tra userId cho các endpoint này
          } else if (/[a-zA-Z]/.test(pathVar)) {
            // Chỉ kiểm tra nếu pathVar có chữ cái và không phải là endpoint đặc biệt
            console.error("[API Interceptor] Invalid userId in URL path:", {
              url,
              endpoint,
              pathVar,
              pathParts,
            });
            return Promise.reject(
              new Error(
                `Invalid userId in API URL: ${pathVar}. Expected a number, got what appears to be a username.`
              )
            );
          }
        }

        if (endpoint === "chat" && pathVar === "all" && nextPathVar) {
          if (/[a-zA-Z]/.test(nextPathVar)) {
            console.error("[API Interceptor] Invalid userId in URL path:", {
              url,
              endpoint,
              pathVar,
              nextPathVar,
              pathParts,
            });
            return Promise.reject(
              new Error(
                `Invalid userId in API URL: ${nextPathVar}. Expected a number, got what appears to be a username.`
              )
            );
          }
        }
      }
    } catch (error) {
      console.error("[API Interceptor] Error in request interceptor:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiForm.interceptors.request.use(
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
        const email: string | undefined = user?.email;
        if (email) (config.headers as any)["User-Email"] = email;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
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

apiForm.interceptors.response.use(
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
