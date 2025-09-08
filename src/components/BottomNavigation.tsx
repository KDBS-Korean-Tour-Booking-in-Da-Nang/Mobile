import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../navigation";
import { useTranslation } from "react-i18next";

interface BottomNavigationProps {
  currentRoute?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute = "home",
}) => {
  const { navigate } = useNavigation();
  const { t } = useTranslation();

  const navItems = [
    {
      key: "home",
      label: t("nav.home"),
      icon: "home-outline",
      activeIcon: "home",
      route: "/home",
    },
    {
      key: "forum",
      label: t("nav.forum"),
      icon: "chatbubbles-outline",
      activeIcon: "chatbubbles",
      route: "/forum",
    },
    {
      key: "user",
      label: t("nav.profile"),
      icon: "person-outline",
      activeIcon: "person",
      route: "/userProfile",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigation}>
        {navItems.map((item) => {
          const isActive = currentRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => navigate(item.route)}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={24}
                color={isActive ? "#007AFF" : "#666"}
              />
              <Text
                style={[styles.navLabel, isActive && styles.activeNavLabel]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeNavItem: {
    // Add any active state styling if needed
  },
  navLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  activeNavLabel: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default BottomNavigation;
