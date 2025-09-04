import api from "./api";

// =================================
// INTERFACES
// =================================

// Interface cho dữ liệu người dùng trả về từ API
export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
}

// =================================
// SERVICE CLASS
// =================================

class UserService {
  // Lấy tất cả người dùng
  async getAllUsers(): Promise<UserResponse[]> {
    try {
      // The backend returns an ApiResponse object with a 'result' field
      const response = await api.get<{ result: UserResponse[] }>("/api/users");
      return response.data.result;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  }
}

export default new UserService();
