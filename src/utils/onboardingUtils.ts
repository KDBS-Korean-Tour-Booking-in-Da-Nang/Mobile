import AsyncStorage from "@react-native-async-storage/async-storage";


export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
    return hasSeen === "true";
  } catch (error) {
    return false;
  }
};


export const markOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    
  } catch (error) {
    throw error;
  }
};


export const resetOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("hasSeenOnboarding");
    
  } catch (error) {
    throw error;
  }
};


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
    throw error;
  }
};
