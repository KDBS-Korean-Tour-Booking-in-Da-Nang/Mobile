import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import MainLayout from "../../src/components/MainLayout";

export default function Settings() {
  const { goBack, navigate } = useNavigation();
  const { logout } = useAuthContext();

  const handleSignOut = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất? Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng ứng dụng.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Navigate to login screen after logout
              navigate("/userLogin");
            } catch (error) {
              console.error("Logout error:", error);
              // Still navigate to login even if logout fails
              navigate("/userLogin");
            }
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      id: "language",
      title: "Language",
      icon: "globe-outline",
      onPress: () => {
        // TODO: Navigate to language settings
        console.log("Language settings");
      },
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: "notifications-outline",
      onPress: () => {
        // TODO: Navigate to notification settings
        console.log("Notification settings");
      },
    },
    {
      id: "transactions",
      title: "Transactions",
      icon: "card-outline",
      onPress: () => {
        // TODO: Navigate to transaction history
        console.log("Transaction history");
      },
    },
  ];

  return (
    <MainLayout>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Settings Title */}
          <Text style={styles.pageTitle}>Settings</Text>

          {/* Settings Options */}
          <View style={styles.optionsContainer}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color="#000"
                    />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Extra spacing at bottom */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <View style={styles.signOutLeft}>
              <View style={styles.signOutIconContainer}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#E3F2FD",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 30,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  bottomSpacing: {
    height: 100,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 20,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  signOutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
