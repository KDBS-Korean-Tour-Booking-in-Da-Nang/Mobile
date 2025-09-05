import api from "../services/api";

export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  avatar: string;
  role: string;
}

export async function getAllUsers(): Promise<UserResponse[]> {
  const response = await api.get<{ result: UserResponse[] }>("/api/users");
  return response.data.result;
}
