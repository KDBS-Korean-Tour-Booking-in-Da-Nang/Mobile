export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  token: string;
}

export interface ForgotPasswordRequestRequest {
  email: string;
}

export interface ForgotPasswordResetRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}