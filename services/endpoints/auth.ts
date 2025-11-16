import api from "../../services/api";
import {
  LoginRequest,
  LogoutRequest,
  ForgotPasswordRequestRequest,
  ForgotPasswordResetRequest,
} from "../../src/types/request/auth.request";

export const authEndpoints = {
  login: (payload: LoginRequest) => api.post("/api/auth/login", payload),

  logout: (payload: LogoutRequest) => api.post("/api/auth/logout", payload),

  forgotPasswordRequest: (payload: ForgotPasswordRequestRequest) =>
    api.post("/api/auth/forgot-password/request", payload),

  forgotPasswordVerifyOtp: () =>
    api.post("/api/auth/forgot-password/verify-otp", undefined),

  forgotPasswordReset: (payload: ForgotPasswordResetRequest) =>
    api.post("/api/auth/forgot-password/reset", payload),
};

export default authEndpoints;
