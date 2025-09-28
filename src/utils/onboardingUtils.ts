import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Check if user has seen onboarding
 */
export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
    return hasSeen === "true";
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const markOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    
  } catch (error) {
    console.error("Error marking onboarding as completed:", error);
    throw error;
  }
};

/**
 * Reset onboarding status (useful for testing)
 */
export const resetOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("hasSeenOnboarding");
    
  } catch (error) {
    console.error("Error resetting onboarding status:", error);
    throw error;
  }
};

/**
 * Clear all app data (useful for testing or complete reset)
 */
export const clearAllAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      "hasSeenOnboarding",
      "authToken",
      "userData",
      "userPreferences",
      "lastLoginTime",
    ]);
    
  } catch (error) {
    console.error("Error clearing app data:", error);
    throw error;
  }
};
