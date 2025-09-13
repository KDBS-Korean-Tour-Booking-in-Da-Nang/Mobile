// navigation.tsx - Navigation Context and Hooks
import React, { createContext, useContext, ReactNode } from "react";
import { router } from "expo-router";

// Navigation context type
interface NavigationContextType {
  navigate: (route: string) => void;
  replace: (route: string) => void;
  goBack: () => void;
  goToHome: () => void;
  goToLoginSelection: () => void;
  goToUserLogin: () => void;
  goToAdminLogin: () => void;
  goToSignUp: () => void;
  goToForum: (postId?: number) => void;
  goToVerifyEmail: (params?: string) => void;
  goToResetPassword: (params?: string) => void;
  goToBusinessInfo: (params?: string) => void;
  goToForgotPassword: () => void;
  replaceToHome: () => void;
  replaceToForum: () => void;
  replaceToLoginSelection: () => void;
}

// Create navigation context
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

// Navigation provider props
interface NavigationProviderProps {
  children: ReactNode;
}

// Navigation provider component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const navigate = (route: string) => {
    router.push(route as any);
  };

  const replace = (route: string) => {
    router.replace(route as any);
  };

  const goBack = () => {
    router.back();
  };

  const goToHome = () => navigate("/home");
  const goToLoginSelection = () => navigate("/loginSelection");
  const goToUserLogin = () => navigate("/userLogin");
  const goToAdminLogin = () => navigate("/adminLogin");
  const goToSignUp = () => navigate("/signUp");
  const goToForum = (postId?: number) =>
    navigate(`/forum${postId ? `?postId=${postId}` : ""}`);
  const goToVerifyEmail = (params?: string) =>
    navigate(`/verifyEmail${params ? `?${params}` : ""}`);
  const goToResetPassword = (params?: string) =>
    navigate(`/resetPassword${params ? `?${params}` : ""}`);
  const goToBusinessInfo = (params?: string) =>
    navigate(`/businessInfo${params ? `?${params}` : ""}`);
  const goToForgotPassword = () => navigate("/forgot");
  const replaceToHome = () => replace("/home");
  const replaceToForum = () => replace("/forum");
  const replaceToLoginSelection = () => replace("/loginSelection");

  const value: NavigationContextType = {
    navigate,
    replace,
    goBack,
    goToHome,
    goToLoginSelection,
    goToUserLogin,
    goToAdminLogin,
    goToSignUp,
    goToForum,
    goToVerifyEmail,
    goToResetPassword,
    goToBusinessInfo,
    goToForgotPassword,
    replaceToHome,
    replaceToForum,
    replaceToLoginSelection,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use navigation
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

// Route access control
export const USER_ROUTES = {
  GUEST: [
    "/home",
    "/loginSelection",
    "/userLogin",
    "/adminLogin",
    "/signUp",
    "/verifyEmail",
    "/resetPassword",
    "/businessInfo",
    "/forgot",
  ],
  USER: [
    "/home",
    "/forum",
    "/userProfile",
    "/loginSelection",
    "/userLogin",
    "/adminLogin",
    "/signUp",
    "/verifyEmail",
    "/resetPassword",
    "/businessInfo",
    "/forgot",
  ],
  BUSINESS: [
    "/home",
    "/forum",
    "/userProfile",
    "/loginSelection",
    "/userLogin",
    "/adminLogin",
    "/signUp",
    "/verifyEmail",
    "/resetPassword",
    "/businessInfo",
    "/forgot",
  ],
  STAFF: [
    "/home",
    "/forum",
    "/userProfile",
    "/loginSelection",
    "/userLogin",
    "/adminLogin",
    "/signUp",
    "/verifyEmail",
    "/resetPassword",
    "/businessInfo",
    "/forgot",
  ],
  ADMIN: [
    "/home",
    "/forum",
    "/userProfile",
    "/loginSelection",
    "/userLogin",
    "/adminLogin",
    "/signUp",
    "/verifyEmail",
    "/resetPassword",
    "/businessInfo",
    "/forgot",
  ],
};

// Route guard functions
export const canAccessRoute = (userType: string, route: string): boolean => {
  const allowedRoutes =
    USER_ROUTES[userType as keyof typeof USER_ROUTES] || USER_ROUTES.GUEST;
  return allowedRoutes.includes(route);
};

export const getDefaultRoute = (userType: string): string => {
  if (userType === "GUEST") return "/home";
  return "/forum";
};

export const redirectToDefault = (userType: string) => {
  const defaultRoute = getDefaultRoute(userType);
  router.replace(defaultRoute as any);
};

// Current route hook
export const useCurrentRoute = () => {
  // This would need to be implemented with actual route tracking
  // For now, we'll return a placeholder
  return {
    currentRoute: "/home",
    canGoBack: () => router.canGoBack(),
  };
};

// Route access hook
export const useRouteAccess = (userType: string) => {
  return {
    canAccessRoute: (route: string) => canAccessRoute(userType, route),
    getDefaultRoute: () => getDefaultRoute(userType),
    redirectToDefault: () => redirectToDefault(userType),
  };
};

// Auth navigation hook
export const useAuthNavigation = () => {
  const { navigate, replace } = useNavigation();

  return {
    goToLogin: () => navigate("/loginSelection"),
    goToSignUp: () => navigate("/signUp"),
    goToForgotPassword: () => navigate("/forgot"),
    goToVerifyEmail: (params?: string) =>
      navigate(`/verifyEmail${params ? `?${params}` : ""}`),
    goToResetPassword: (params?: string) =>
      navigate(`/resetPassword${params ? `?${params}` : ""}`),
    goToBusinessInfo: (params?: string) =>
      navigate(`/businessInfo${params ? `?${params}` : ""}`),
    goToForum: (postId?: number) =>
      replace(`/forum${postId ? `?postId=${postId}` : ""}`),
    goToHome: () => replace("/home"),
  };
};
