import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../navigation";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");

interface BottomNavigationProps {
  currentRoute?: string;
  isVisible?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute = "home",
  isVisible = true,
}) => {
  const { navigate } = useNavigation();
  const { t } = useTranslation();

  // Responsive sizing based on screen width
  const isVerySmallScreen = screenWidth < 350; // Very small screens
  const isSmallScreen = screenWidth < 400; // iPhone 11 Pro, iPhone SE, small Android phones

  const iconSize = isVerySmallScreen ? 19 : isSmallScreen ? 19 : 23;
  const fontSize = isVerySmallScreen ? 9 : isSmallScreen ? 10 : 12;
  const navItemPadding = isVerySmallScreen ? 2 : isSmallScreen ? 2 : 4;

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
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : 100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, translateY]);

  const containerStyle = [
    styles.container,
    styles.containerBottom,
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
                <View
                  style={[
                    isActive ? styles.activeNavItem : {},
                    {
                      paddingVertical: navItemPadding,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Ionicons
                    name={isActive ? item.activeIcon : (item.icon as any)}
                    size={iconSize}
                    color={isActive ? "#ffffff" : "#666"}
                    style={{
                      marginBottom: isVerySmallScreen
                        ? 2
                        : isSmallScreen
                        ? 3
                        : 4,
                    }}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      isActive && styles.activeNavLabel,
                      { fontSize },
                    ]}
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
    paddingHorizontal: screenWidth < 350 ? 4 : screenWidth < 400 ? 6 : 16,
    height: screenWidth < 350 ? 30 : screenWidth < 400 ? 34 : 40,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: screenWidth < 350 ? 2 : screenWidth < 400 ? 3 : 8,
  },
  activeNavItemContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: screenWidth < 350 ? 2 : screenWidth < 400 ? 3 : 8,
  },
  activeNavItem: {
    backgroundColor: "#a1d3ff",
    borderRadius: 12,
    paddingVertical: screenWidth < 350 ? 11 : screenWidth < 400 ? 13 : 15,
    paddingHorizontal: screenWidth < 350 ? 7 : screenWidth < 400 ? 9 : 13,
    marginHorizontal: screenWidth < 350 ? 0.5 : screenWidth < 400 ? 0.5 : 3,
    minHeight: screenWidth < 350 ? 37 : screenWidth < 400 ? 43 : 49,
  },
  navLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    minWidth: screenWidth < 350 ? 22 : screenWidth < 400 ? 25 : 37,
  },
  activeNavLabel: {
    color: "#000000",
    fontWeight: "600",
  },
});

export default BottomNavigation;
