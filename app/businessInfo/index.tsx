import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import authService from "../../src/services/authService";
import { useNavigation } from "../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function BusinessInfo() {
  const { navigate } = useNavigation();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [businessLicense, setBusinessLicense] = useState<any>(null);
  const [idCardFront, setIdCardFront] = useState<any>(null);
  const [idCardBack, setIdCardBack] = useState<any>(null);

  const email = params.email as string;
  const fullName = params.fullName as string;

  const pickDocument = async (type: "license" | "idFront" | "idBack") => {
    try {
      if (type === "license") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
          const file = result.assets[0];
          if (file.size && file.size > 25 * 1024 * 1024) {
            Alert.alert("Lỗi", "File không được vượt quá 25MB");
            return;
          }
          setBusinessLicense(file);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const file = result.assets[0];
          if (file.fileSize && file.fileSize > 25 * 1024 * 1024) {
            Alert.alert("Lỗi", "File không được vượt quá 25MB");
            return;
          }

          if (type === "idFront") {
            setIdCardFront(file);
          } else {
            setIdCardBack(file);
          }
        }
      }
    } catch (error) {
      console.error("Pick file error:", error);
      Alert.alert("Lỗi", "Không thể chọn file. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async () => {
    if (!businessLicense || !idCardFront || !idCardBack) {
      Alert.alert("Lỗi", "Vui lòng upload đầy đủ các tài liệu bắt buộc");
      return;
    }

    setLoading(true);
    try {
      await authService.uploadBusinessDocuments({
        email,
        fullName,
        businessLicense,
        idCardFront,
        idCardBack,
      });

      Alert.alert(
        "Thành công",
        "Tài liệu đã được gửi thành công! Tài khoản của bạn sẽ được duyệt trong 1-3 ngày làm việc.",
        [
          {
            text: "OK",
            onPress: () => navigate("/loginSelection"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Lỗi", error.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

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
            onPress={() => navigate("/verifyEmail")}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin doanh nghiệp</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            Vui lòng upload các tài liệu cần thiết để admin có thể duyệt tài
            khoản doanh nghiệp của bạn.
          </Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Tài liệu bắt buộc</Text>

          {/* Business License */}
          <View style={styles.uploadItem}>
            <View style={styles.uploadHeader}>
              <Ionicons
                name="document-text"
                size={24}
                color={colors.primary.main}
              />
              <View style={styles.uploadInfo}>
                <Text style={styles.uploadTitle}>
                  Giấy phép kinh doanh (PDF) *
                </Text>
                <Text style={styles.uploadDesc}>
                  Upload file PDF giấy phép kinh doanh
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("license")}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Chọn File</Text>
            </TouchableOpacity>
            {businessLicense && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.fileName}>{businessLicense.name}</Text>
              </View>
            )}
          </View>

          {/* ID Card Front */}
          <View style={styles.uploadItem}>
            <View style={styles.uploadHeader}>
              <Ionicons name="card" size={24} color={colors.primary.main} />
              <View style={styles.uploadInfo}>
                <Text style={styles.uploadTitle}>
                  Mặt trước CCCD (JPG/PNG) *
                </Text>
                <Text style={styles.uploadDesc}>Chụp ảnh mặt trước CCCD</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("idFront")}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Chọn Ảnh</Text>
            </TouchableOpacity>
            {idCardFront && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.fileName}>Ảnh CCCD mặt trước</Text>
              </View>
            )}
          </View>

          {/* ID Card Back */}
          <View style={styles.uploadItem}>
            <View style={styles.uploadHeader}>
              <Ionicons name="card" size={24} color={colors.primary.main} />
              <View style={styles.uploadInfo}>
                <Text style={styles.uploadTitle}>Mặt sau CCCD (JPG/PNG) *</Text>
                <Text style={styles.uploadDesc}>Chụp ảnh mặt sau CCCD</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("idBack")}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Chọn Ảnh</Text>
            </TouchableOpacity>
            {idCardBack && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.fileName}>Ảnh CCCD mặt sau</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Lưu ý quan trọng:</Text>
          <View style={styles.notesList}>
            <Text style={styles.noteItem}>
              • Giấy phép kinh doanh phải là file PDF
            </Text>
            <Text style={styles.noteItem}>
              • CCCD phải rõ ràng, không bị mờ hoặc che khuất
            </Text>
            <Text style={styles.noteItem}>
              • CCCD phải là ảnh thật, không phải ảnh màn hình hoặc scan
            </Text>
            <Text style={styles.noteItem}>
              • Đảm bảo ánh sáng tốt khi chụp CCCD
            </Text>
            <Text style={styles.noteItem}>
              • Mỗi file không được vượt quá 25MB
            </Text>
            <Text style={styles.noteItem}>
              • Thời gian duyệt thường mất từ 1-3 ngày làm việc
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigate("/loginSelection")}
          >
            <Text style={styles.cancelButtonText}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons
                  name="reload"
                  size={20}
                  color="white"
                  style={styles.spinning}
                />
                <Text style={styles.submitButtonText}>Đang gửi...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Xác nhận và gửi</Text>
            )}
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
    padding: spacing.lg,
  },
  infoContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: "center",
  },
  uploadSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  uploadItem: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  uploadInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  uploadDesc: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  uploadButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.sm,
  },
  fileName: {
    fontSize: 14,
    color: colors.success.dark,
    marginLeft: spacing.sm,
  },
  notesContainer: {
    backgroundColor: colors.info.light,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.info.dark,
    marginBottom: spacing.md,
  },
  notesList: {
    gap: spacing.sm,
  },
  noteItem: {
    fontSize: 14,
    color: colors.info.dark,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
