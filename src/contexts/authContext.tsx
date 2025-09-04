import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import authService from "../services/authService";
import { useNavigation } from "../navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const authenticated = await authService.isAuthenticated();
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
      }
  
      setIsAuthenticated(authenticated);
      setUser(userData);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, checkAuthStatus, logout }}
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
