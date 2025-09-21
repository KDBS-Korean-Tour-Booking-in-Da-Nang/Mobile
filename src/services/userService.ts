import api from "./api";

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
