import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = __DEV__
  ? "https://8002b8712600.ngrok-free.app"
  : "https://kdbs.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      console.log("API Request - Token:", token ? "Present" : "Missing");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("API Request - Authorization header set");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

export default api;
