import { router } from "expo-router";

// Route constants
export const ROUTES = {
  HOME: "/home",
  LOGIN_SELECTION: "/loginSelection",
  USER_LOGIN: "/userLogin",
  ADMIN_LOGIN: "/adminLogin",
  SIGN_UP: "/signUp",
  FORUM: "/forum",
  VERIFY_EMAIL: "/verifyEmail",
  RESET_PASSWORD: "/resetPassword",
  BUSINESS_INFO: "/businessInfo",
  FORGOT_PASSWORD: "/forgot",
} as const;

// Navigation functions
export const goToHome = () => router.push(ROUTES.HOME as any);
export const goToLoginSelection = () =>
  router.push(ROUTES.LOGIN_SELECTION as any);
export const goToUserLogin = () => router.push(ROUTES.USER_LOGIN as any);
export const goToAdminLogin = () => router.push(ROUTES.ADMIN_LOGIN as any);
export const goToSignUp = () => router.push(ROUTES.SIGN_UP as any);
export const goToForum = () => router.push(ROUTES.FORUM as any);
export const goToVerifyEmail = (params?: string) =>
  router.push(`${ROUTES.VERIFY_EMAIL}?${params}` as any);
export const goToResetPassword = (params?: string) =>
  router.push(`${ROUTES.RESET_PASSWORD}?${params}` as any);
export const goToBusinessInfo = (params?: string) =>
  router.push(`${ROUTES.BUSINESS_INFO}?${params}` as any);
export const goToForgotPassword = () =>
  router.push(ROUTES.FORGOT_PASSWORD as any);

// Replace navigation functions
export const replaceToHome = () => router.replace(ROUTES.HOME as any);
export const replaceToForum = () => router.replace(ROUTES.FORUM as any);
export const replaceToLoginSelection = () =>
  router.replace(ROUTES.LOGIN_SELECTION as any);

// Back navigation
export const goBack = () => router.back();

// Deep linking configuration
export const LINKING = {
  prefixes: ["exp://localhost:8081", "mobilefe://"],
  config: {
    screens: {
      home: "home",
      loginSelection: "loginSelection",
      userLogin: "userLogin",
      adminLogin: "adminLogin",
      signUp: "signUp",
      forum: "forum",
      verifyEmail: "verifyEmail",
      resetPassword: "resetPassword",
      businessInfo: "businessInfo",
      forgot: "forgot",
      payment: "payment",
      transactionResult: "transactionResult",
    },
  },
};

// Route access control
export const USER_ROUTES = {
  GUEST: [
    ROUTES.HOME,
    ROUTES.LOGIN_SELECTION,
    ROUTES.USER_LOGIN,
    ROUTES.ADMIN_LOGIN,
    ROUTES.SIGN_UP,
    ROUTES.VERIFY_EMAIL,
    ROUTES.RESET_PASSWORD,
    ROUTES.BUSINESS_INFO,
    ROUTES.FORGOT_PASSWORD,
  ],
  USER: [
    ROUTES.HOME,
    ROUTES.FORUM,
    ROUTES.LOGIN_SELECTION,
    ROUTES.USER_LOGIN,
    ROUTES.ADMIN_LOGIN,
    ROUTES.SIGN_UP,
    ROUTES.VERIFY_EMAIL,
    ROUTES.RESET_PASSWORD,
    ROUTES.BUSINESS_INFO,
    ROUTES.FORGOT_PASSWORD,
  ],
  BUSINESS: [
    ROUTES.HOME,
    ROUTES.FORUM,
    ROUTES.LOGIN_SELECTION,
    ROUTES.USER_LOGIN,
    ROUTES.ADMIN_LOGIN,
    ROUTES.SIGN_UP,
    ROUTES.VERIFY_EMAIL,
    ROUTES.RESET_PASSWORD,
    ROUTES.BUSINESS_INFO,
    ROUTES.FORGOT_PASSWORD,
  ],
  STAFF: [
    ROUTES.HOME,
    ROUTES.FORUM,
    ROUTES.LOGIN_SELECTION,
    ROUTES.USER_LOGIN,
    ROUTES.ADMIN_LOGIN,
    ROUTES.SIGN_UP,
    ROUTES.VERIFY_EMAIL,
    ROUTES.RESET_PASSWORD,
    ROUTES.BUSINESS_INFO,
    ROUTES.FORGOT_PASSWORD,
  ],
  ADMIN: [
    ROUTES.HOME,
    ROUTES.FORUM,
    ROUTES.LOGIN_SELECTION,
    ROUTES.USER_LOGIN,
    ROUTES.ADMIN_LOGIN,
    ROUTES.SIGN_UP,
    ROUTES.VERIFY_EMAIL,
    ROUTES.RESET_PASSWORD,
    ROUTES.BUSINESS_INFO,
    ROUTES.FORGOT_PASSWORD,
  ],
};

// Route guard functions
export const canAccessRoute = (userType: string, route: string): boolean => {
  const allowedRoutes =
    USER_ROUTES[userType as keyof typeof USER_ROUTES] || USER_ROUTES.GUEST;
  return allowedRoutes.includes(route as any);
};

export const getDefaultRoute = (userType: string): string => {
  if (userType === "GUEST") return ROUTES.HOME;
  return ROUTES.FORUM;
};

export const redirectToDefault = (userType: string) => {
  const defaultRoute = getDefaultRoute(userType);
  router.replace(defaultRoute as any);
};

// Export types
export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
export type UserType = keyof typeof USER_ROUTES;
