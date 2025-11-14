import React, {
  createContext,
  useEffect,
  useContext,
  ReactNode,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

type User = {
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt?: string;
  birthdate?: string;
  gender?: string;
  phone?: string;
  dob?: string;
  cccd?: string;
  balance?: number;
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error?: string | null;
};

type AuthAction =
  | { type: "INIT" }
  | {
      type: "SET_AUTH";
      payload: { isAuthenticated: boolean; user: User | null };
    }
  | { type: "LOGIN_SUCCESS"; payload: { token: string; user: User } }
  | { type: "LOGOUT" }
  | { type: "ERROR"; payload: string | null };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT":
      return { ...state, loading: true, error: null };
    case "SET_AUTH":
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        loading: false,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case "ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null | undefined;
  checkAuthStatus: () => Promise<void>;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  getAllUsers: () => Promise<
    { id: number; username: string; email?: string }[]
  >;
  getUserLiteById: (
    userId: number
  ) => Promise<{ id: number; username: string; email?: string } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthStatus = async () => {
    dispatch({ type: "INIT" });
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userDataRaw = await AsyncStorage.getItem("userData");
      const userData: User | null = userDataRaw
        ? JSON.parse(userDataRaw)
        : null;
      dispatch({
        type: "SET_AUTH",
        payload: { isAuthenticated: !!token, user: userData },
      });
    } catch (error) {
      dispatch({
        type: "SET_AUTH",
        payload: { isAuthenticated: false, user: null },
      });
    }
  };

  const login = async (email: string, password: string, role: string) => {
    dispatch({ type: "INIT" });
    try {
      const response = await api.post("/api/auth/login", { email, password });

      const payload = (response?.data?.result ?? response?.data) as {
        token?: string;
        authenticated?: boolean;
        user?: User;
      };
      const token = payload?.token as string;
      const user = payload?.user as any;
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { token, user } });
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      const message = backendMessage || err?.message || "Login failed";
      dispatch({ type: "ERROR", payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        await api.post("/api/auth/logout", { token });
      }
    } catch (e) {
    } finally {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("hasSeenOnboarding");
      await AsyncStorage.removeItem("lastRoute");

      try {
        await AsyncStorage.multiRemove([
          "authToken",
          "userData",
          "hasSeenOnboarding",
          "lastRoute",
          "userPreferences",
          "lastLoginTime",
        ]);
      } catch (error) {}

      dispatch({ type: "LOGOUT" });
    }
  };

  const getAllUsers = async (): Promise<
    { id: number; username: string; email?: string }[]
  > => {
    const res = await api.get("/api/users");
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
          } as { id: number; username: string; email?: string };
        })
        .filter((u: any) => u?.id != null && u?.username);
    }
    return [];
  };

  const getUserLiteById = async (
    userId: number
  ): Promise<{ id: number; username: string; email?: string } | null> => {
    try {
      const res = await api.get("/api/users");
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loading: state.loading,
        error: state.error,
        checkAuthStatus,
        login,
        logout,
        getAllUsers,
        getUserLiteById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
