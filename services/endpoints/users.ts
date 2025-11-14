import api, { apiForm } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UpdateUserRequest = {
  email: string;
  username?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  avatarImg?: { uri: string; name?: string; type?: string } | any;
};

async function updateUser(params: UpdateUserRequest) {
  const form = new FormData();
  const data = {
    username: params.username,
    phone: params.phone,
    dob: params.birthDate,
    gender: params.gender,
    cccd: 99,
  } as Record<string, any>;
  try {
  } catch {}
  form.append("data", JSON.stringify(data));
  console.log("[users.updateUser] request", form);

  form.append("email", params.email);
  if (params.avatarImg) {
    const file: any = params.avatarImg;
    const name = file?.name || "avatar.jpg";
    const type = file?.type || "image/jpeg";
    form.append("avatarImg", { uri: file.uri, name, type } as any);
  }
  try {
    const parts: any[] = (form as any)?._parts || [];
    console.log(
      "[users.updateUser] form parts",
      parts.map((p: any) => {
        const key = p?.[0];
        const val = p?.[1];
        if (key === "avatarImg") {
          return [key, { uri: val?.uri, name: val?.name, type: val?.type }];
        }
        return [
          key,
          typeof val === "string"
            ? val
            : (val && val.constructor && val.constructor.name) || typeof val,
        ];
      })
    );
  } catch {}
  const token = await AsyncStorage.getItem("authToken");
  try {
    console.log("[users.updateUser] will PUT /api/users/update with headers", {
      "Content-Type": "multipart/form-data",
      Authorization: token ? "Bearer ***" : undefined,
    });
  } catch {}
  console.log("[users.updateUser] request", form);

  return apiForm.put("/api/users/update", form, {
    headers: {
      // "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export const usersEndpoints = {
  getAll: () => api.get("/api/users"),

  register: (payload: { username: string; email: string; password: string }) =>
    api.post("/api/users/register", { ...payload, role: "USER" }),

  regenerateOtp: (payload: { email: string }) =>
    api.post("/api/users/regenerate-otp", payload),

  verifyEmail: (payload: { email: string; otpCode: string }) =>
    api.post("/api/users/verify-email", payload),
  updateUser,
};

export default usersEndpoints;
