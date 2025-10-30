import api from "../api";

export type UpdateUserRequest = {
  email: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
};

async function updateUser(params: UpdateUserRequest) {
  return api.put("/api/users/update", undefined, { params });
}

export const usersEndpoints = {
  getAll: () => api.get("/api/users"),

  register: (payload: { username: string; email: string; password: string }) =>
    api.post("/api/users/register", payload),

  regenerateOtp: (payload: { email: string }) =>
    api.post("/api/users/regenerate-otp", payload),
  
  verifyEmail: (payload: { email: string; otpCode: string }) =>
    api.post("/api/users/verify-email", payload),
  updateUser,
};

export default usersEndpoints;
