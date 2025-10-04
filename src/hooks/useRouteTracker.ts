import { useEffect } from "react";
import { usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useRouteTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    const saveCurrentRoute = async () => {
      try {
        if (
          pathname &&
          !pathname.includes("/onboarding") &&
          !pathname.includes("/auth")
        ) {
          await AsyncStorage.setItem("lastRoute", pathname);
        }
      } catch (error) {
      }
    };

    saveCurrentRoute();
  }, [pathname]);
};
