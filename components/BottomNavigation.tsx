import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../navigation/navigation";
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

  const isVerySmallScreen = screenWidth < 350; // Very small screens
  const isSmallScreen = screenWidth < 400; // iPhone 11 Pro, iPhone SE, small Android phones

  const iconSize = isVerySmallScreen ? 19 : isSmallScreen ? 19 : 23;
  const fontSize = isVerySmallScreen ? 9 : isSmallScreen ? 10 : 12;
  const navBarHeight = isVerySmallScreen ? 33 : isSmallScreen ? 37 : 43;

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
      route: "/tour/list",
    },
    {
      key: "article",
      label: t("nav.article"),
      icon: "document-text-outline",
      activeIcon: "document-text",
      route: "/article",
    },
    {
      key: "message",
      label: t("nav.message"),
      icon: "mail-outline",
      activeIcon: "mail",
      route: "/chat",
    },
    {
      key: "user",
      label: t("nav.profile"),
      icon: "person-outline",
      activeIcon: "person",
      route: "/auth/profile",
    },
  ];

  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : Platform.OS === "android" ? 150 : 100,
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
    <>
      <Animated.View style={containerStyle}>
        <SafeAreaView>
          <View style={[styles.navigation, { height: navBarHeight }]}>
            {navItems.map((item) => {
              const isActive = currentRoute === item.key;
              const iconMarginBottom = isVerySmallScreen ? 2 : isSmallScreen ? 3 : 4;
              const activePadding = 6; // Same as styles.activeNavItem.paddingHorizontal
              
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.navItem}
                  onPress={() => navigate(item.route)}
                >
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 0,
                      paddingHorizontal: 0,
                      position: "relative",
                      minHeight: iconSize + iconMarginBottom + fontSize + 4,
                    }}
                  >
                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: -activePadding,
                          right: -activePadding,
                          bottom: 0,
                          backgroundColor: "#a1d3ff",
                          borderRadius: 12,
                          zIndex: 0,
                        }}
                      />
                    )}
                    <View 
                      style={{
                        height: iconSize,
                        width: iconSize,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: iconMarginBottom,
                        zIndex: 1,
                        position: "relative",
                      }}
                  >
                    <Ionicons
                      name={isActive ? item.activeIcon : (item.icon as any)}
                      size={iconSize}
                      color={isActive ? "#ffffff" : "#666"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.navLabel,
                        isActive && styles.activeNavLabel,
                        { fontSize },
                        { zIndex: 1, position: "relative" },
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
      {}
      {Platform.OS === "android" && <View style={styles.androidNavBar} />}
    </>
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
    zIndex: 9999,
    bottom: Platform.OS === "android" ? 60 : 0,
  },
  containerBottom: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: screenWidth < 350 ? 4 : screenWidth < 400 ? 6 : 16,
    minHeight: 40,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 0, // Remove padding from container
    paddingHorizontal: screenWidth < 350 ? 2 : screenWidth < 400 ? 3 : 8,
  },
  activeNavItemContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 0, // Remove padding from container - same as navItem
    paddingHorizontal: screenWidth < 350 ? 2 : screenWidth < 400 ? 3 : 8,
  },
  activeNavItem: {
    backgroundColor: "#a1d3ff",
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  navLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    minWidth: screenWidth < 350 ? 35 : screenWidth < 400 ? 50 : 55,
    flexShrink: 0,
  },
  activeNavLabel: {
    color: "#000000",
    fontWeight: "600",
    flexShrink: 0,
  },
  androidNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#000000",
    zIndex: 1,
  },
});

export default BottomNavigation;
