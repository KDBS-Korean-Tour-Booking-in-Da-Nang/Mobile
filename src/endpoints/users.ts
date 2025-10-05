import api from "../services/api";

export const userEndpoints = {
  getAll: () => api.get("/api/users"),
  
  register: (payload: { username: string; email: string; password: string }) =>
    api.post("/api/users/register", payload),
  
  regenerateOtp: (payload: { email: string }) =>
    api.post("/api/users/regenerate-otp", payload),
  
  verifyEmail: (payload: { email: string; otpCode: string }) =>
    api.post("/api/users/verify-email", payload),
};

export default userEndpoints;