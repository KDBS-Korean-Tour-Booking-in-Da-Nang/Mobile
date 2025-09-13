import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../navigation";
import { useTranslation } from "react-i18next";

interface BottomNavigationProps {
  currentRoute?: string;
  isVisible?: boolean;
  position?: "bottom" | "top";
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute = "home",
  isVisible = true,
  position = "bottom",
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
      icon: "globe-outline",
      activeIcon: "globe",
      route: "/forum",
    },
    {
      key: "tour",
      label: t("nav.tour"),
      icon: "map-outline",
      activeIcon: "map",
      route: "/tour",
    },
    {
      key: "article",
      label: t("nav.article"),
      icon: "document-text-outline",
      activeIcon: "document-text",
      route: "/article",
    },
    {
      key: "user",
      label: t("nav.profile"),
      icon: "person-outline",
      activeIcon: "person",
      route: "/userProfile",
    },
  ];

  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (position === "top") {
      Animated.timing(translateY, {
        toValue: isVisible ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: isVisible ? 0 : 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, position, translateY]);

  const containerStyle = [
    styles.container,
    position === "top" ? styles.containerTop : styles.containerBottom,
    { transform: [{ translateY }] },
  ];

  return (
    <Animated.View style={containerStyle}>
      <SafeAreaView>
        <View style={styles.navigation}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  isActive ? styles.activeNavItemContainer : styles.navItem,
                ]}
                onPress={() => navigate(item.route)}
              >
                <View style={isActive ? styles.activeNavItem : {}}>
                  <Ionicons
                    name={isActive ? item.activeIcon : (item.icon as any)}
                    size={24}
                    color={isActive ? "#ffffff" : "#666"}
                    style={{ marginLeft: 5 }}
                  />
                  <Text
                    style={[styles.navLabel, isActive && styles.activeNavLabel]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E3F2FD",
    paddingTop: 14,
    paddingBottom: 8,
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  containerTop: {
    top: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  containerBottom: {
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 16,
    height: 40,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeNavItemContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeNavItem: {
    backgroundColor: "#1088AE",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginHorizontal: 3,
  },
  navLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    minWidth: 37,
  },
  activeNavLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default BottomNavigation;
