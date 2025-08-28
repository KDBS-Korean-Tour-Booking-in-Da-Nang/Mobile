import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  authenticated: boolean;
  user: {
    userId: number;
    username: string;
    email: string;
    role: string;
    status: string;
  };
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

class AuthService {
  // Login
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        data
      );

      if (response.data.result?.token) {
        await AsyncStorage.setItem("authToken", response.data.result.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.result.user)
        );
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  // Signup
  async signup(data: SignupRequest): Promise<ApiResponse<string>> {
    try {
      const response = await api.post<ApiResponse<string>>(
        "/users/register",
        data
      );
      return response.data;
    } catch (error: any) {
      console.log("Signup error object:", error);
      console.log("Signup error response:", error.response);
      console.log("Signup error response data:", error.response?.data);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.result ||
          JSON.stringify(error.response?.data) ||
          "Signup failed"
      );
    }
  }

  // Forgot Password
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(
        "/auth/forgot-password/request",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Forgot password failed"
      );
    }
  }

  // Reset Password
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(
        "/auth/forgot-password/reset",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Reset password failed");
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("authToken");
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
