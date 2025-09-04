import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LoginRequest {
  email: string;
  password: string;
  role: string; // Add role for multi-user login
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

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface BusinessDocumentRequest {
  email: string;
  fullName: string;
  businessLicense: any;
  idCardFront: any;
  idCardBack: any;
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

let currentUser: any = null;

class AuthService {
  // Login
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        "/api/auth/login",
        data
      );

      if (response.data.result?.token) {
        await AsyncStorage.setItem("authToken", response.data.result.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.result.user)
        );
        currentUser = response.data.result.user;
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Lỗi từ server (ví dụ: sai mật khẩu, tài khoản không tồn tại)
        const serverMessage =
          error.response.data?.message || JSON.stringify(error.response.data);
        throw new Error(serverMessage);
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        throw new Error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và địa chỉ server."
        );
      } else {
        // Lỗi không xác định
        throw new Error(error.message || "Lỗi không xác định khi đăng nhập.");
      }
    }
  }

  // Signup
  async signup(data: SignupRequest): Promise<ApiResponse<string>> {
    try {
      const response = await api.post<ApiResponse<string>>(
        "/api/users/register",
        data
      );
      return response.data;
    } catch (error: any) {
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
        "/api/auth/forgot-password/request",
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
        "/api/auth/forgot-password/reset",
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
      await api.post("/api/auth/logout");
    } catch (error) {
    } finally {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      currentUser = null;
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
    if (currentUser) {
      return currentUser;
    }
    try {
      const userData = await AsyncStorage.getItem("userData");
      currentUser = userData ? JSON.parse(userData) : null;
      return currentUser;
    } catch (error) {
      return null;
    }
  }

  // Send OTP for email verification
  async sendOtp(data: SendOtpRequest): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(
        "/api/auth/send-otp",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to send OTP");
    }
  }

  // Verify OTP for email verification
  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<void>> {
    try {
      const response = await api.post<ApiResponse<void>>(
        "/api/auth/verify-otp",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Invalid OTP");
    }
  }

  // Upload business documents
  async uploadBusinessDocuments(
    data: BusinessDocumentRequest
  ): Promise<ApiResponse<void>> {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("fullName", data.fullName);

      // Append business license
      formData.append("businessLicense", {
        uri: data.businessLicense.uri,
        type: "application/pdf",
        name: data.businessLicense.name,
      } as any);

      // Append ID card front
      formData.append("idCardFront", {
        uri: data.idCardFront.uri,
        type: "image/jpeg",
        name: "idCardFront.jpg",
      } as any);

      // Append ID card back
      formData.append("idCardBack", {
        uri: data.idCardBack.uri,
        type: "image/jpeg",
        name: "idCardBack.jpg",
      } as any);

      const response = await api.post<ApiResponse<void>>(
        "/api/business/upload-documents",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to upload documents"
      );
    }
  }
}

export default new AuthService();
