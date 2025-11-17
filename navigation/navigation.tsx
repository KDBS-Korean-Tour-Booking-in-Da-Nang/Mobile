import React, { createContext, useContext, ReactNode } from "react";
import { router } from "expo-router";

interface NavigationContextType {
  navigate: (route: string) => void;
  replace: (route: string) => void;
  goBack: () => void;
  goToHome: () => void;
  goToUserLogin: () => void;
  goToSignUp: () => void;
  goToForum: (postId?: number) => void;
  goToVerifyEmail: (params?: string) => void;
  goToResetPassword: (params?: string) => void;
  goToForgotPassword: () => void;
  goToSettings: () => void;
  replaceToHome: () => void;
  replaceToForum: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

interface NavigationProviderProps {
  children: ReactNode;
}

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
  const goToUserLogin = () => navigate("/auth/login/userLogin");
  const goToSignUp = () => navigate("/auth/signup");
  const goToForum = (postId?: number) =>
    navigate(`/forum${postId ? `?postId=${postId}` : ""}`);
  const goToVerifyEmail = (params?: string) =>
    navigate(`/auth/verify${params ? `?${params}` : ""}`);
  const goToResetPassword = (params?: string) =>
    navigate(`/auth/reset${params ? `?${params}` : ""}`);
  const goToForgotPassword = () => navigate("/auth/forgot");
  const goToSettings = () => navigate("/home/settings");
  const replaceToHome = () => replace("/home");
  const replaceToForum = () => replace("/forum");
  const replaceToLoginSelection = () => replace("/auth/login/userLogin");

  const value: NavigationContextType = {
    navigate,
    replace,
    goBack,
    goToHome,
    goToUserLogin,
    goToSignUp,
    goToForum,
    goToVerifyEmail,
    goToResetPassword,
    goToForgotPassword,
    goToSettings,
    replaceToHome,
    replaceToForum,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
