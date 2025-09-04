import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function LoginSelection() {
  const { navigate } = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={colors.gradient.primary as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate("/home")}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn loại đăng nhập</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Vui lòng chọn loại tài khoản để đăng nhập
        </Text>

        <View style={styles.optionsContainer}>
          {/* User/Business Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigate("/userLogin")}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="people" size={32} color={colors.primary.main} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>User / Business</Text>
              <Text style={styles.optionDescription}>
                Đăng nhập cho người dùng cá nhân và doanh nghiệp
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {/* Staff/Admin Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigate("/adminLogin")}
          >
            <View style={[styles.optionIcon, styles.adminIcon]}>
              <Ionicons name="shield" size={32} color={colors.secondary.main} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Staff / Admin</Text>
              <Text style={styles.optionDescription}>
                Đăng nhập cho nhân viên và quản trị viên hệ thống
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigate("/signUp")}>
            <Text style={styles.footerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  optionCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  adminIcon: {
    backgroundColor: colors.secondary.light,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footerLink: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: "600",
  },
});
