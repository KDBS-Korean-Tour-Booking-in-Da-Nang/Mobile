import { useEffect } from "react";
import { usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useRouteTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    const saveCurrentRoute = async () => {
      try {
        // Only save routes that are not onboarding or auth pages
        if (
          pathname &&
          !pathname.includes("/onboarding") &&
          !pathname.includes("/auth")
        ) {
          await AsyncStorage.setItem("lastRoute", pathname);
        }
      } catch (error) {
        console.log("Error saving route:", error);
      }
    };

    saveCurrentRoute();
  }, [pathname]);
};
