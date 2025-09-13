import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "../../src/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import { colors, spacing } from "../../src/constants/theme";
import MainLayout from "../../src/components/MainLayout";
import {
  updateUserProfile,
  UserUpdateRequest,
} from "../../src/services/userService";

export default function UserProfile() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const { user, logout } = useAuthContext();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    // Format current value for display
    let displayValue = currentValue || "";
    if (field === "dob" && currentValue) {
      displayValue = new Date(currentValue).toISOString().split("T")[0]; // YYYY-MM-DD format
    }
    setEditValue(displayValue);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingField || !user?.email) return;

    setIsLoading(true);

    try {
      const updateData: UserUpdateRequest = {
        [editingField]: editValue,
      };

      const response = await updateUserProfile(user.email, updateData);

      if (response.success) {
        Alert.alert("Thành công", response.message);
        // TODO: Update user context with new data
        // This would typically update the user state in AuthContext
        setEditModalVisible(false);
        setEditingField(null);
        setEditValue("");
      } else {
        Alert.alert("Lỗi", response.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      username: "Tên người dùng",
      email: "Email",
      phone: "Số điện thoại",
      gender: "Giới tính",
      dob: "Ngày sinh",
      cccd: "CCCD",
    };
    return labels[field] || field;
  };

  const getFieldHint = (field: string) => {
    const hints: { [key: string]: string } = {
      username: "Tên người dùng phải có ít nhất 2 ký tự",
      phone: "Số điện thoại phải có 10-11 chữ số",
      gender: "Chọn: Nam, Nữ hoặc Khác",
      dob: "Định dạng: YYYY-MM-DD (ví dụ: 1990-01-01)",
      cccd: "CCCD phải có đúng 12 chữ số",
    };
    return hints[field] || "";
  };

  const formatValue = (field: string, value: any) => {
    if (!value) return "Chưa cập nhật";
    if (field === "dob" && value) {
      return new Date(value).toLocaleDateString("vi-VN");
    }
    if (field === "createdAt" && value) {
      return new Date(value).toLocaleDateString("vi-VN");
    }
    return value.toString();
  };

  return (
    <MainLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile.title")}</Text>
          <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
            <Ionicons
              name={isEditMode ? "checkmark" : "create-outline"}
              size={24}
              color={isEditMode ? "#1088AE" : colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={40}
                    color={colors.text.secondary}
                  />
                </View>
              )}
              {isEditMode && (
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.username}>
              {user?.username || t("profile.notUpdated")}
            </Text>
            {user?.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("profile.basicInfo")}</Text>

            <View style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() =>
                  isEditMode && handleEdit("username", user?.username || "")
                }
                disabled={!isEditMode}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="person-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>
                    {t("profile.labels.fullName")}
                  </Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {user?.username || t("profile.notUpdated")}
                  </Text>
                  {isEditMode && (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() =>
                  isEditMode && handleEdit("email", user?.email || "")
                }
                disabled={!isEditMode}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="mail-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>
                    {t("profile.labels.email")}
                  </Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {user?.email || "Chưa cập nhật"}
                  </Text>
                  {isEditMode && (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() =>
                  isEditMode && handleEdit("phone", user?.phone || "")
                }
                disabled={!isEditMode}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="call-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {user?.phone || "Chưa cập nhật"}
                  </Text>
                  {isEditMode && (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() =>
                  isEditMode && handleEdit("gender", user?.gender || "")
                }
                disabled={!isEditMode}
              >
                <View style={styles.infoLeft}>
                  <Ionicons
                    name="male-female-outline"
                    size={20}
                    color="#1088AE"
                  />
                  <Text style={styles.infoLabel}>Giới tính</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {user?.gender || "Chưa cập nhật"}
                  </Text>
                  {isEditMode && (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => isEditMode && handleEdit("dob", user?.dob || "")}
                disabled={!isEditMode}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="calendar-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>Ngày sinh</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {formatValue("dob", user?.dob)}
                  </Text>
                  {isEditMode && (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="card-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>CCCD</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {user?.cccd || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="wallet-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>Số dư</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.balanceValue}>
                    {user?.balance
                      ? `${user.balance.toLocaleString()} VNĐ`
                      : "0 VNĐ"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="time-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>Ngày tạo</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={styles.infoValue}>
                    {formatValue("createdAt", user?.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="shield-outline" size={20} color="#1088AE" />
                  <Text style={styles.infoLabel}>Vai trò</Text>
                </View>
                <View style={styles.infoRight}>
                  <Text style={[styles.infoValue, styles.roleText]}>
                    {user?.role || "USER"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings-outline" size={20} color="#1088AE" />
              <Text style={styles.actionButtonText}>Cài đặt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="help-circle-outline" size={20} color="#1088AE" />
              <Text style={styles.actionButtonText}>Trợ giúp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Chỉnh sửa {getFieldLabel(editingField || "")}
              </Text>
              {getFieldHint(editingField || "") && (
                <Text style={styles.modalHint}>
                  {getFieldHint(editingField || "")}
                </Text>
              )}
              <TextInput
                style={styles.modalInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={
                  editingField === "dob"
                    ? "YYYY-MM-DD"
                    : `Nhập ${getFieldLabel(editingField || "")}`
                }
                editable={!isLoading}
                keyboardType={
                  editingField === "phone" || editingField === "cccd"
                    ? "numeric"
                    : "default"
                }
                maxLength={
                  editingField === "phone"
                    ? 11
                    : editingField === "cccd"
                    ? 12
                    : undefined
                }
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.saveButtonText}>Đang lưu...</Text>
                  ) : (
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "#fff",
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1088AE",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginTop: spacing.xs,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8860B",
    marginLeft: 3,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "right",
    flex: 1,
  },
  balanceValue: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "600",
    textAlign: "right",
  },
  roleText: {
    color: "#1088AE",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: spacing.xs,
  },
  actionSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#1088AE",
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545",
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.xl,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  modalHint: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#1088AE",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
});
