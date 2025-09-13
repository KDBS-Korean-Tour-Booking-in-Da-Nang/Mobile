import React, { useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { usePathname } from "expo-router";
import BottomNavigation from "./BottomNavigation";
import { useTranslation } from "react-i18next";

interface MainLayoutProps {
  children: React.ReactNode;
  isNavVisible?: boolean;
  navPosition?: "bottom" | "top";
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isNavVisible = true,
  navPosition = "bottom",
}) => {
  useTranslation();
  const pathname = usePathname();

  // Determine current route for bottom navigation
  const getCurrentRoute = () => {
    if (pathname === "/home") return "home";
    if (pathname === "/forum") return "forum";
    if (pathname === "/tour") return "tour";
    if (pathname === "/article") return "article";
    if (pathname === "/userProfile") return "user";
    return "home";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation
        currentRoute={getCurrentRoute()}
        isVisible={isNavVisible}
        position={navPosition}
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
