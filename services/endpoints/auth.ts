import api from "../../services/api";

export const authEndpoints = {
  login: (payload: { email: string; password: string }) =>
    api.post("/api/auth/login", payload),

  logout: (token: string) => api.post("/api/auth/logout", { token }),

  forgotPasswordRequest: (payload: { email: string }) =>
    api.post("/api/auth/forgot-password/request", payload),

  forgotPasswordVerifyOtp: () =>
    api.post("/api/auth/forgot-password/verify-otp", undefined),

  forgotPasswordReset: (payload: {
    email: string;
    otpCode: string;
    newPassword: string;
  }) => api.post("/api/auth/forgot-password/reset", payload),
};

export default authEndpoints;
