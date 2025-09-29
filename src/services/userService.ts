import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserUpdateRequest {
  username?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  cccd?: string;
}

export interface UserUpdateResponse {
  success: boolean;
  message: string;
  user?: any;
}

export interface UserLite {
  id: number;
  username: string;
  email?: string;
}

// Real API call to backend
export const updateUserProfile = async (
  email: string,
  updateData: UserUpdateRequest
): Promise<UserUpdateResponse> => {
  try {
    // Client-side validation
    if (updateData.username && updateData.username.length < 2) {
      return {
        success: false,
        message: "Tên người dùng phải có ít nhất 2 ký tự",
      };
    }

    if (updateData.phone && !/^[0-9]{10,11}$/.test(updateData.phone)) {
      return {
        success: false,
        message: "Số điện thoại phải có 10-11 chữ số",
      };
    }

    if (
      updateData.gender &&
      !["Nam", "Nữ", "Khác"].includes(updateData.gender)
    ) {
      return {
        success: false,
        message: "Giới tính phải là Nam, Nữ hoặc Khác",
      };
    }

    if (updateData.cccd && !/^[0-9]{12}$/.test(updateData.cccd)) {
      return {
        success: false,
        message: "CCCD phải có đúng 12 chữ số",
      };
    }

    // Call real API
    const response = await api.put(
      `/api/users/profile?email=${encodeURIComponent(email)}`,
      updateData
    );

    return {
      success: true,
      message: response.data.message || "Cập nhật thông tin thành công",
      user: response.data.result,
    };
  } catch (error: any) {
    console.error("API Error:", error);

    // Handle different error types
    if (error.response?.data?.message) {
      return {
        success: false,
        message: error.response.data.message,
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Không tìm thấy người dùng",
      };
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
      };
    }

    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau",
    };
  }
};

export const getAllUsers = async (): Promise<UserLite[]> => {
  const token = await AsyncStorage.getItem("authToken");
  const res = await api.get("/api/users", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const data = (res?.data?.result ?? res?.data) as any[];
  if (Array.isArray(data)) {
    return data
      .map((u: any) => {
        const normalizedId = u?.id ?? u?.userId ?? u?.user_id;
        return {
          id: normalizedId,
          username:
            u?.username ||
            u?.fullName ||
            u?.name ||
            (u?.email ? String(u.email).split("@")[0] : undefined),
          email: u?.email,
        } as UserLite;
      })
      .filter((u: any) => u?.id != null && u?.username);
  }
  return [];
};

export const getUserLiteById = async (
  userId: number
): Promise<UserLite | null> => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const res = await api.get(`/api/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = (res?.data?.result ?? res?.data) as any[];
    if (Array.isArray(data)) {
      const u = data.find((x: any) => {
        const xid = x?.id ?? x?.userId ?? x?.user_id;
        return String(xid) === String(userId);
      });
      if (!u) return null;
      return {
        id: u?.id ?? u?.userId ?? u?.user_id,
        username:
          u?.username ||
          u?.fullName ||
          u?.name ||
          (u?.email ? String(u.email).split("@")[0] : undefined),
        email: u?.email,
      };
    }
    return null;
  } catch {
    return null;
  }
};
