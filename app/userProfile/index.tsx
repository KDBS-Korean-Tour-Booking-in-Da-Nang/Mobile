import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import { colors, spacing, borderRadius } from "../../src/constants/theme";

export default function UserProfile() {
  const { goBack } = useNavigation();
  const { user, logout } = useAuthContext();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          {user?.createdAt ? (
            <View style={styles.row}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.rowText}>
                Tạo ngày: {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
          {user?.birthdate ? (
            <View style={styles.row}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.rowText}>
                Ngày sinh: {new Date(user.birthdate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
          {user?.gender ? (
            <View style={styles.row}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.rowText}>Giới tính: {user.gender}</Text>
            </View>
          ) : null}
          {user?.phone ? (
            <View style={styles.row}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.rowText}>Số điện thoại: {user.phone}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border.medium,
    marginBottom: spacing.lg,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  logoutButton: {
    margin: spacing.lg,
    backgroundColor: colors.error.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  logoutButtonText: {
    color: colors.primary.contrast,
    fontWeight: "bold",
    fontSize: 16,
  },
});
