export interface UpdateUserRequest {
  email: string;
  username?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  avatarImg?: { uri: string; name?: string; type?: string } | any;
  currentAvatarUrl?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegenerateOtpRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}
