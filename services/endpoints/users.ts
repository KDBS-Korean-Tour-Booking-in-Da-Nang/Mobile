import api, { apiForm } from "../api";
import {
  UpdateUserRequest,
  RegisterRequest,
  RegenerateOtpRequest,
  VerifyEmailRequest,
} from "../../src/types/request/user.request";

async function updateUser(params: UpdateUserRequest) {
  const form = new FormData();

  if (params.email) {
    form.append("email", params.email);
  }

  const data = {
    username: params.username,
    phone: params.phone,
    dob: params.birthDate,
    gender: params.gender,
  } as Record<string, any>;

  if (params.address !== undefined && params.address !== null) {
    data.address = params.address;
  }

  form.append("data", JSON.stringify(data));

  if (params.avatarImg) {
    const file: any = params.avatarImg;
    const uri: string = file?.uri || file?.path || "";

    const clean = uri.split("?")[0];

    const ext = (clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg").toLowerCase();

    const mime =
      file?.type ||
      (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);

    const name = file?.name || `avatar_${Date.now()}.${ext}`;

    if (uri) {
      form.append("avatarImg", {
        uri: uri, 
        name,
        type: mime,
      } as any);
    }
  }

  return apiForm.put("/api/users/update", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export const usersEndpoints = {
  getAll: () => api.get("/api/users"),

  register: (payload: RegisterRequest) =>
    api.post("/api/users/register", { ...payload, role: "USER" }),

  regenerateOtp: (payload: RegenerateOtpRequest) =>
    api.post("/api/users/regenerate-otp", payload),

  verifyEmail: (payload: VerifyEmailRequest) =>
    api.post("/api/users/verify-email", payload),
  updateUser,
};

export default usersEndpoints;
