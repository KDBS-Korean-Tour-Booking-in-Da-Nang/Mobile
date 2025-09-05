import React, { createContext, useEffect, useContext, ReactNode, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

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
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error?: string | null;
};

type AuthAction =
  | { type: "INIT" }
  | { type: "SET_AUTH"; payload: { isAuthenticated: boolean; user: User | null } }
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
      return { ...state, isAuthenticated: true, user: action.payload.user, loading: false, error: null };
    case "LOGOUT":
      return { ...state, isAuthenticated: false, user: null, loading: false, error: null };
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthStatus = async () => {
    dispatch({ type: "INIT" });
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userDataRaw = await AsyncStorage.getItem("userData");
      const userData: User | null = userDataRaw ? JSON.parse(userDataRaw) : null;
      dispatch({ type: "SET_AUTH", payload: { isAuthenticated: !!token, user: userData } });
    } catch (error) {
      dispatch({ type: "SET_AUTH", payload: { isAuthenticated: false, user: null } });
    }
  };

  const login = async (email: string, password: string, role: string) => {
    dispatch({ type: "INIT" });
    try {
      const response = await api.post("/api/auth/login", { email, password, role });
      const { token, user } = response.data.result as { token: string; user: User };
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { token, user } });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Login failed";
      dispatch({ type: "ERROR", payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
    } finally {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      dispatch({ type: "LOGOUT" });
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
