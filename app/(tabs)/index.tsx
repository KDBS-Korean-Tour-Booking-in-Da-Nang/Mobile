import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuthContext } from "../../src/contexts/authContext";
import { Button } from "../../src/components/Button";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
} from "../../src/constants/theme";

export default function HomeScreen() {
  const { user, logout, loading } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Tour du lịch</Text>
        <Text style={styles.subtitleText}>Đà Nẵng - Korea</Text>
        <Text style={styles.descriptionText}>
          Khám phá vẻ đẹp của Đà Nẵng và trải nghiệm văn hóa Hàn Quốc với những
          tour du lịch chất lượng cao.
        </Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{user?.username || "User"}</Text>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
          <Text style={styles.role}>Vai trò: {user?.role || "User"}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Tổng số tour</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Đang chờ</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Đã hoàn thành</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="Xem hồ sơ"
          onPress={() => {}}
          variant="outline"
          style={styles.actionButton}
        />

        <Button
          title="Cài đặt"
          onPress={() => {}}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      <Button
        title={loading ? "Đang đăng xuất..." : "Đăng xuất"}
        onPress={handleLogout}
        variant="secondary"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitleText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  userCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.medium,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: colors.primary.contrast,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  role: {
    fontSize: 12,
    color: colors.text.disabled,
    textTransform: "capitalize",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: "center",
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});
