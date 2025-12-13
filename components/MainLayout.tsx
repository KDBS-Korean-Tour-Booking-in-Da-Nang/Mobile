import React from "react";
import { View, StyleSheet } from "react-native";
import { usePathname } from "expo-router";
import BottomNavigation from "./BottomNavigation";
import { useTranslation } from "react-i18next";
import { useRouteTracker } from "../hooks/useRouteTracker";

interface MainLayoutProps {
  children: React.ReactNode;
  isNavVisible?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isNavVisible = true,
}) => {
  useTranslation();
  const pathname = usePathname();

  useRouteTracker();

  const getCurrentRoute = () => {
    if (pathname === "/home" || pathname.startsWith("/home/")) return "home";
    if (pathname === "/forum" || pathname.startsWith("/forum/")) return "forum";
    if (
      pathname === "/tour" ||
      pathname === "/buyingTour" ||
      pathname.startsWith("/tour/")
    )
      return "tour";
    if (pathname === "/article" || pathname.startsWith("/article/"))
      return "article";
    if (pathname === "/chat" || pathname.startsWith("/chat/"))
      return "message";
    if (pathname === "/auth/profile" || pathname.startsWith("/auth/profile/"))
      return "user";
    return "home";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation
        currentRoute={getCurrentRoute()}
        isVisible={isNavVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
