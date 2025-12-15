import api from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  UpdateUserRequest,
  RegisterRequest,
  RegenerateOtpRequest,
  VerifyEmailRequest,
} from "../../src/types/request/user.request";

async function updateUser(params: UpdateUserRequest) {
  const form = new FormData();

  // Append email first (required by backend)
  if (params.email) {
    form.append("email", params.email);
  }

  // Create the data object
  const data = {
    username: params.username,
    phone: params.phone,
    dob: params.birthDate,
    gender: params.gender,
    cccd: 99,
  } as Record<string, any>;

  // Include address if provided (backend supports it in UserUpdateRequest)
  if (params.address !== undefined && params.address !== null) {
    data.address = params.address;
  }

  // Append data as JSON string
  form.append("data", JSON.stringify(data));

  // Append avatar if provided - use exact same pattern as forum
  if (params.avatarImg) {
    const file: any = params.avatarImg;
    const uri: string = file?.uri || file?.path || "";

    // Clean URI (remove query params if any) - same as forum
    const clean = uri.split("?")[0];

    // Extract extension from URI or use default
    const ext = (clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg").toLowerCase();

    // Determine MIME type
    const mime =
      file?.type ||
      (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);

    // Use provided name or generate one
    const name = file?.name || `avatar_${Date.now()}.${ext}`;

    // Use original URI (not cleaned) - React Native FormData handles it
    if (uri) {
      form.append("avatarImg", {
        uri: uri, // Use original URI, not cleaned
        name,
        type: mime,
      } as any);
    }
  }

  const token = await AsyncStorage.getItem("authToken");

  // Log for debugging
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

  // Use api with explicit Content-Type header (same pattern as forum endpoints)
  return api.put("/api/users/update", form, {
    timeout: 60000, // 60 seconds for file uploads
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
