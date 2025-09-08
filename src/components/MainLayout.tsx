import React from "react";
import { View, StyleSheet } from "react-native";
import { usePathname } from "expo-router";
import BottomNavigation from "./BottomNavigation";
import { useTranslation } from "react-i18next";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  useTranslation();
  const pathname = usePathname();

  // Determine current route for bottom navigation
  const getCurrentRoute = () => {
    if (pathname === "/home") return "home";
    if (pathname === "/forum") return "forum";
    if (pathname === "/userProfile") return "user";
    return "home";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation currentRoute={getCurrentRoute()} />
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
