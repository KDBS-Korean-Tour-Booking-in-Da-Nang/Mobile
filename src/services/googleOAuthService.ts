import { openAuthSessionAsync } from "expo-web-browser";
import { addEventListener } from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

export interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export interface GoogleAuthResponse {
  token: string;
  authenticated: boolean;
  user: {
    userId: number;
    username: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
    isPremium?: boolean;
    balance?: string;
  };
}

class GoogleOAuthService {
  private readonly BACKEND_URL = this.getBackendBaseUrl();

  private readonly PROXY_API_BASE = "/api";
  private readonly GOOGLE_AUTH_API = `${this.PROXY_API_BASE}/auth/google/login`;
  private readonly CALLBACK_URL =
    "https://2dc573f3a009.ngrok-free.app/google/callback";

  // Khởi tạo Google OAuth
  async initializeGoogleAuth(): Promise<void> {
    // Đăng ký URL scheme cho deep linking
    addEventListener("url", this.handleDeepLink);
  }

  private getBackendBaseUrl(): string {
    const envOverride = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (envOverride && envOverride.length > 0) {
      return envOverride.replace(/\/$/, "");
    }

    if (!__DEV__) {
      return "https://your-production-domain.com";
    }

    // Prefer LAN IP based on Metro host when running on device
    const hostUri = (Constants as any)?.expoConfig?.hostUri as
      | string
      | undefined;
    const lanHost = hostUri ? hostUri.split(":")[0] : undefined;

    if (Platform.OS === "android") {
      // Android emulator maps localhost to 10.0.2.2
      const emulatorHost = "10.0.2.2";
      const finalHost =
        lanHost && lanHost !== "localhost" ? lanHost : emulatorHost;
      return `http://${finalHost}:8080`;
    }

    // iOS simulator can use localhost; device should use LAN IP
    const finalHost = lanHost || "localhost";
    return `http://${finalHost}:8080`;
  }

  // Xử lý deep link khi Google callback
  private handleDeepLink = async (event: { url: string }) => {
    const url = event.url;
    if (url.includes("google/callback")) {
      await this.handleGoogleCallback(url);
    }
  };

  // Bắt đầu quá trình login Google
  async startGoogleLogin(): Promise<void> {
    try {
      // Thử gọi qua proxy trước
      let authUrl: string | undefined;
      try {
        const res = await fetch(this.GOOGLE_AUTH_API);
        if (res.ok) {
          const json = (await res.json()) as { code?: number; result?: string };
          authUrl = json?.result || undefined;
        }
      } catch {
        // ignore, sẽ fallback sang BASE URL
      }

      // Fallback gọi trực tiếp backend nếu proxy không dùng được (thiết bị thật)
      if (!authUrl) {
        const res2 = await fetch(`${this.BACKEND_URL}/api/auth/google/login`);
        if (res2.ok) {
          const json2 = (await res2.json()) as {
            code?: number;
            result?: string;
          };
          authUrl = json2?.result;
        }
      }

      if (!authUrl) throw new Error("Cannot get Google authorization URL");

      const updated = new URL(authUrl);
      const params = updated.searchParams;
      params.set(
        "redirect_uri",
        `https://2dc573f3a009.ngrok-free.app/api/auth/google/callback`
      );
      params.set("prompt", "select_account");
      const deviceId = `dev-${Platform.OS}`;
      const deviceName = `LDPlayer-${Platform.OS}`;
      params.set("device_id", deviceId);
      params.set("device_name", deviceName);
      updated.search = params.toString();
      const authUrlWithPrompt = updated.toString();

      const result = await openAuthSessionAsync(
        authUrlWithPrompt,
        this.CALLBACK_URL
      );

      if (result.type === "success" && result.url) {
        await this.handleGoogleCallback(result.url);
      } else if (result.type === "cancel") {
      }
    } catch (error) {
      throw new Error("Failed to start Google OAuth");
    }
  }

  private async handleGoogleCallback(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      // Kiểm tra có error không
      const error = params.get("error");
      if (error) {
        throw new Error(decodeURIComponent(error));
      }

      // Lấy thông tin user từ callback
      const token = params.get("token");
      const userId = params.get("userId");
      const email = params.get("email");
      const username = params.get("username");
      const role = params.get("role");
      const avatar = params.get("avatar");
      const isPremium = params.get("isPremium");
      const balance = params.get("balance");

      if (!token || !userId || !email) {
        throw new Error("Invalid callback data from Google OAuth");
      }

      // Tạo user object
      const user = {
        userId: parseInt(userId),
        username: username || email.split("@")[0],
        email: decodeURIComponent(email),
        role: decodeURIComponent(role || "USER"),
        status: "ACTIVE",
        avatar: avatar ? decodeURIComponent(avatar) : undefined,
        isPremium: isPremium === "true",
        balance: balance || "0",
      };

      // Lưu token và user data vào AsyncStorage
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));

      // Emit event để notify app về login thành công
      this.onGoogleLoginSuccess?.({ token, authenticated: true, user });
    } catch (error) {
      this.onGoogleLoginError?.(error as Error);
    }
  }

  // Callback functions
  onGoogleLoginSuccess?: (response: GoogleAuthResponse) => void;
  onGoogleLoginError?: (error: Error) => void;

  // Cleanup
  cleanup(): void {
    // Note: expo-linking doesn't have removeAllListeners
    // The listener will be automatically cleaned up when the app is closed
  }
}

export default new GoogleOAuthService();
