import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const expoDev = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_DEV) as string | undefined;
const expoProd = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL_PROD) as string | undefined;

const API_BASE_URL_DEV = (expoDev || "").replace(/\/$/, "");
const API_BASE_URL_PROD = (expoProd ?? "").replace(/\/$/, "");

const API_BASE_URL = __DEV__ ? API_BASE_URL_DEV : API_BASE_URL_PROD;

// WebSocket URL configuration
// NOTE: On mobile devices, use your computer's IP address instead of localhost
// 
// OPTIONAL: Only set these if WebSocket runs on different server/port than REST API
// If not set, WebSocket will AUTOMATICALLY use the same base URL as API_BASE_URL
// 
// Example (only if needed):
//   EXPO_PUBLIC_WS_URL_DEV=ws://192.168.1.100:8080/ws
//   EXPO_PUBLIC_WS_URL_PROD=wss://your-domain.com/ws
const expoWsDev = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_WS_URL_DEV) as string | undefined;
const expoWsProd = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_WS_URL_PROD) as string | undefined;
const expoWs = (typeof process !== "undefined" &&
  (process.env as any)?.EXPO_PUBLIC_WS_URL) as string | undefined;

// Helper function to convert WebSocket URL to HTTP base URL for SockJS
function getWsBaseUrl(wsUrl?: string, apiBase?: string): string {
  if (wsUrl) {
    try {
      // Remove trailing /ws if present, then convert ws:// to http://
      const cleanUrl = wsUrl.replace(/\/ws\/?$/, "");
      const url = new URL(cleanUrl);
      // SockJS needs http/https, not ws/wss
      if (url.protocol === "ws:") {
        url.protocol = "http:";
      } else if (url.protocol === "wss:") {
        url.protocol = "https:";
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      // If URL parsing fails, try manual conversion
      const cleanUrl = wsUrl.replace(/\/ws\/?$/, "");
      return cleanUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
    }
  }
  // Fallback: automatically use API_BASE_URL (which should already have the correct IP/domain)
  // This ensures WebSocket uses the same server as the REST API
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      return `${url.protocol}//${url.host}`;
    } catch {
      return apiBase.replace(/\/$/, "");
    }
  }
  return "";
}

// Use WS_URL if provided, otherwise fallback to WS_URL_DEV/PROD, or automatically derive from API_BASE_URL
// This way, if API_BASE_URL is set to http://192.168.1.100:8080, WebSocket will automatically use the same IP
const WS_URL_DEV = getWsBaseUrl(expoWs || expoWsDev, API_BASE_URL_DEV);
const WS_URL_PROD = getWsBaseUrl(expoWs || expoWsProd, API_BASE_URL_PROD);
const WS_URL = __DEV__ ? WS_URL_DEV : WS_URL_PROD;

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
        try {
          const user = JSON.parse(userData);
          const email: string | undefined = user?.email || user?.userEmail;
          if (email) (config.headers as any)["User-Email"] = email;
        } catch (error) {
          console.error("[API Interceptor] Error parsing userData:", error);
        }
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
        try {
          const user = JSON.parse(userData);
          const email: string | undefined = user?.email || user?.userEmail;
          if (email) (config.headers as any)["User-Email"] = email;
        } catch (error) {
          console.error("[API Interceptor] Error parsing userData:", error);
        }
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
export const WS_BASE = WS_URL;
export default api;
