import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
// TODO: implement business upload endpoint; removed old service import
import { useNavigation } from "../../../src/navigation";
// import { useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../src/constants/theme";
import styles from "./styles";

export default function BusinessInfo() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  // const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [businessLicense, setBusinessLicense] = useState<any>(null);
  const [idCardFront, setIdCardFront] = useState<any>(null);
  const [idCardBack, setIdCardBack] = useState<any>(null);

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

  const getFileSize = (asset: any) => {
    // Different pickers provide size via different keys
    return (
      asset?.size ||
      asset?.fileSize ||
      asset?.file?.size ||
      asset?.file?.fileSize ||
      0
    );
  };

  const isImageType = (asset: any) => {
    const mime = asset?.mimeType || asset?.type || "";
    const uri: string = asset?.uri || "";
    return (
      mime.toString().startsWith("image/") ||
      uri.toLowerCase().match(/\.(png|jpe?g|webp|heic|heif)$/)
    );
  };

  const isPdfType = (asset: any) => {
    const mime = asset?.mimeType || asset?.type || "";
    const uri: string = asset?.uri || "";
    return mime === "application/pdf" || uri.toLowerCase().endsWith(".pdf");
  };

  // const email = params.email as string;
  // const fullName = params.fullName as string;

  const pickDocument = async (type: "license" | "idFront" | "idBack") => {
    try {
      if (type === "license") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const file = result.assets[0];
          if (!isPdfType(file)) {
            Alert.alert(t("business.error"), t("business.fileTypePdfOnly"));
            return;
          }
          if (getFileSize(file) > MAX_FILE_SIZE_BYTES) {
            Alert.alert(t("business.error"), t("business.fileSizeError"));
            return;
          }
          setBusinessLicense({
            uri: file.uri,
            name: file.name || "license.pdf",
            mimeType: "application/pdf",
            size: getFileSize(file),
          });
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const file = result.assets[0];
          if (!isImageType(file)) {
            Alert.alert(t("business.error"), t("business.fileTypeImageOnly"));
            return;
          }
          if (getFileSize(file) > MAX_FILE_SIZE_BYTES) {
            Alert.alert(t("business.error"), t("business.fileSizeError"));
            return;
          }

          const normalized = {
            uri: file.uri,
            name:
              (file as any).fileName ||
              (file as any).name ||
              (type === "idFront" ? "id-front.jpg" : "id-back.jpg"),
            mimeType: file.mimeType || "image/jpeg",
            size: getFileSize(file),
          };

          if (type === "idFront") setIdCardFront(normalized);
          else setIdCardBack(normalized);
        }
      }
    } catch (error) {
      console.error("Pick file error:", error);
      Alert.alert(t("business.error"), t("business.uploadError"));
    }
  };

  const isReadyToSubmit = !!(businessLicense && idCardFront && idCardBack);

  const handleSubmit = async () => {
    if (!isReadyToSubmit) {
      Alert.alert(t("business.error"), t("business.missingRequiredDocs"));
      return;
    }

    setLoading(true);
    try {
      // TODO: implement upload endpoint similarly to other endpoints

      Alert.alert(t("common.success"), t("business.submitSuccess"), [
        {
          text: "OK",
          onPress: () => navigate("/auth/login/userLogin"),
        },
      ]);
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert(
        t("auth.login.error"),
        error.message || t("common.networkError")
      );
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
            onPress={() => navigate("/auth/verify")}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("business.title")}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{t("business.subtitle")}</Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>{t("business.requiredDocs")}</Text>

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
                  {t("business.form.businessLicense")}
                </Text>
                <Text style={styles.uploadDesc}>
                  {t("business.form.businessLicenseHint")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("license")}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>
                {t("common.chooseFile")}
              </Text>
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
                  {t("business.form.idFront")}
                </Text>
                <Text style={styles.uploadDesc}>
                  {t("business.form.idFrontHint")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("idFront")}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.uploadButtonText}>
                {t("common.chooseImage")}
              </Text>
            </TouchableOpacity>
            {idCardFront && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.fileName}>
                  {t("business.form.idFrontPicked")}
                </Text>
              </View>
            )}
          </View>

          {/* ID Card Back */}
          <View style={styles.uploadItem}>
            <View style={styles.uploadHeader}>
              <Ionicons name="card" size={24} color={colors.primary.main} />
              <View style={styles.uploadInfo}>
                <Text style={styles.uploadTitle}>
                  {t("business.form.idBack")}
                </Text>
                <Text style={styles.uploadDesc}>
                  {t("business.form.idBackHint")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickDocument("idBack")}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.uploadButtonText}>
                {t("common.chooseImage")}
              </Text>
            </TouchableOpacity>
            {idCardBack && (
              <View style={styles.fileInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.main}
                />
                <Text style={styles.fileName}>
                  {t("business.form.idBackPicked")}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>{t("business.important.title")}</Text>
          <View style={styles.notesList}>
            <Text style={styles.noteItem}>{t("business.important.i1")}</Text>
            <Text style={styles.noteItem}>{t("business.important.i2")}</Text>
            <Text style={styles.noteItem}>{t("business.important.i3")}</Text>
            <Text style={styles.noteItem}>{t("business.important.i4")}</Text>
            <Text style={styles.noteItem}>{t("business.important.i5")}</Text>
            <Text style={styles.noteItem}>{t("business.important.i6")}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigate("/auth/login/userLogin")}
          >
            <Text style={styles.cancelButtonText}>{t("common.back")}</Text>
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
                <Text style={styles.submitButtonText}>
                  {t("common.submitting")}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                {t("common.confirmAndSubmit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
