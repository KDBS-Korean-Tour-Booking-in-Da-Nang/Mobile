import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "../../../../navigation/navigation";
import { useAuthContext } from "../../../../src/contexts/authContext";
import MainLayout from "../../../../components/MainLayout";
import styles from "./styles";
import { useTranslation } from "react-i18next";
import { usersEndpoints } from "../../../../services/endpoints/users";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

export default function EditProfile() {
  const { goBack } = useNavigation();
  const { user, checkAuthStatus } = useAuthContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const getUserInitialGender = React.useCallback(() => {
    const userGender = (user as any)?.gender || "";
    if (userGender === "M" || userGender === "MALE") return "male";
    if (userGender === "F" || userGender === "FEMALE") return "female";
    if (userGender === "O" || userGender === "OTHER") return "other";
    return null;
  }, [user]);

  const getUserDob = React.useCallback(() => {
    const dob = (user as any)?.dob || (user as any)?.birthDate || "";
    if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return dob;
    }
    return "";
  }, [user]);

  const [selectedGender, setSelectedGender] = useState<
    "male" | "female" | "other" | null
  >(getUserInitialGender());
  const [fullName, setFullName] = useState<string>(user?.username || "");
  const [phone, setPhone] = useState<string>((user as any)?.phone || "");
  const [birthDate, setBirthDate] = useState<string>(getUserDob());
  const [address, setAddress] = useState<string>((user as any)?.address || "");

  const initialValuesRef = useRef({
    fullName: user?.username || "",
    phone: (user as any)?.phone || "",
    birthDate: getUserDob(),
    gender: getUserInitialGender(),
    address: (user as any)?.address || "",
  });

  useEffect(() => {
    if (user) {
      const dob = getUserDob();
      const gender = getUserInitialGender();
      initialValuesRef.current = {
        fullName: user?.username || "",
        phone: (user as any)?.phone || "",
        birthDate: dob,
        gender: gender,
        address: (user as any)?.address || "",
      };
      setFullName(user?.username || "");
      setPhone((user as any)?.phone || "");
      setBirthDate(dob);
      setSelectedGender(gender);
      setAddress((user as any)?.address || "");
    }
  }, [user, getUserDob, getUserInitialGender]);

  const sanitizeName = React.useCallback((text: string) => {
    const s = (text || "").trim();
    if (!s) return "";
    return s
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (w) =>
          w.charAt(0).toLocaleUpperCase("vi") +
          w.slice(1).toLocaleLowerCase("vi")
      )
      .join(" ");
  }, []);

  const formatLiveName = React.useCallback((text: string) => {
    const hasTrailingSpace = /\s$/.test(text || "");
    let s = (text || "")
      .normalize("NFC")
      .replace(/[^\p{L} ]/gu, " ")
      .replace(/\s+/g, " ")
      .replace(/^\s+/, "");
    const trimmedEnd = s.replace(/\s+$/g, "");
    const base = trimmedEnd
      .split(" ")
      .filter(Boolean)
      .map(
        (w) =>
          w.charAt(0).toLocaleUpperCase("vi") +
          w.slice(1).toLocaleLowerCase("vi")
      )
      .join(" ");
    return hasTrailingSpace ? `${base} ` : base;
  }, []);

  const [saving, setSaving] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{
    uri: string;
    name?: string;
    type?: string;
    size?: number;
  } | null>(null);
  const [nameError, setNameError] = useState("");
  const [dobError, setDobError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const isNameValid = React.useCallback((name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed || trimmed.length === 0) return false;
    if (trimmed.length < 2) return false;
    if (trimmed.length > 30) return false;
    const usernameRegex = /^\p{L}[\p{L}\p{M}\p{N}\s]*$/u;
    return usernameRegex.test(trimmed);
  }, []);

  const sanitizePhone = React.useCallback((text: string) => {
    const digits = (text || "").replace(/\D+/g, "");
    return digits;
  }, []);

  const isPhoneValid = React.useCallback((text: string) => {
    if (!text || !text.trim()) return true; // Phone is optional
    const cleanPhone = (text || "").replace(/\s/g, "");
    if (cleanPhone.length === 0) return true; // Empty phone is allowed
    if (cleanPhone.length > 20) return false;

    const vietnameseRegex = /^(\+84|0)[0-9]{9,10}$/;
    const internationalRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
    if (
      vietnameseRegex.test(cleanPhone) ||
      internationalRegex.test(cleanPhone)
    ) {
      return true;
    }

    if (cleanPhone.length < 7 || !/^[\d+]+$/.test(cleanPhone)) {
      return false;
    }
    return true; // Allow it (might be valid format we didn't anticipate)
  }, []);

  const isBirthDateValid = React.useCallback((s: string) => {

    if (!s || !s.trim()) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() + 1 !== m ||
      dt.getUTCDate() !== d
    ) {
      return false;
    }

    const today = new Date();
    let age = today.getFullYear() - dt.getFullYear();
    const monthDiff = today.getMonth() - dt.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dt.getDate())) {
      age--;
    }

    if (dt.getTime() >= today.getTime()) return false;

    if (age < 13) return false;

    if (age > 150) return false;
    return true;
  }, []);

  const hasProfileChanges = React.useCallback(() => {
    const initial = initialValuesRef.current;
    const finalName = sanitizeName(fullName);

    if ((initial.fullName || "") !== (finalName || "")) return true;
    if ((initial.phone || "") !== (sanitizePhone(phone) || "")) return true;
    if ((initial.birthDate || "") !== (birthDate || "")) return true;
    if (initial.gender !== selectedGender) return true;
    if ((initial.address || "") !== (address || "")) return true;
    if (avatarFile) return true; // Any newly selected avatar file counts as a change
    return false;
  }, [
    fullName,
    phone,
    birthDate,
    selectedGender,
    address,
    avatarFile,
    sanitizeName,
    sanitizePhone,
  ]);

  const validateAvatarFile = async (file: {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
  }) => {
    setAvatarError("");
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (file.size !== undefined && file.size > maxSize) {
      setAvatarError(
        t("profile.errors.avatarSize") || "Image size must not exceed 5MB"
      );
      return false;
    }



    if (file.type && !allowedTypes.includes(file.type)) {
      setAvatarError(
        t("profile.errors.avatarFormat") || "Image format not supported"
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {

    setNameError("");
    setDobError("");
    setPhoneError("");
    setAvatarError("");

    const finalName = sanitizeName(fullName);

    if (!finalName.trim() || !isNameValid(finalName)) {
      const errorMsg =
        t("profile.errors.invalidName") || "Full name is invalid";
      setNameError(errorMsg);
      Alert.alert(t("common.error") || "Error", errorMsg);
      return;
    }

    if (phone && phone.trim() && !isPhoneValid(phone)) {
      const errorMsg =
        t("profile.errors.invalidPhone") || "Phone number is invalid";
      setPhoneError(errorMsg);
      Alert.alert(t("common.error") || "Error", errorMsg);
      return;
    }

    if (birthDate && birthDate.trim() && !isBirthDateValid(birthDate)) {
      let errorMsg =
        t("booking.errors.dobInvalidFormat") || "Birth date is invalid";
      if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        const [y, m, d] = birthDate.split("-").map((x) => Number(x));
        const dt = new Date(Date.UTC(y, m - 1, d));
        const today = new Date();
        let age = today.getFullYear() - dt.getFullYear();
        const monthDiff = today.getMonth() - dt.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dt.getDate())
        ) {
          age--;
        }
        if (age < 13) {
          errorMsg =
            t("profile.errors.mustBe13") || "You must be at least 13 years old";
        }
      }
      setDobError(errorMsg);
      Alert.alert(t("common.error") || "Error", errorMsg);
      return;
    }

    if (avatarFile && !(await validateAvatarFile(avatarFile))) {
      Alert.alert(
        t("common.error") || "Error",
        avatarError || "Avatar validation failed"
      );
      return;
    }

    try {
      setSaving(true);
      const email =
        (user as any)?.email || (user as any)?.userEmail || (user as any)?.mail;
      const username = finalName;

      await usersEndpoints.updateUser({
        email,
        username,
        phone: phone.trim() ? sanitizePhone(phone) : undefined,
        birthDate: birthDate.trim() || undefined,
        address: address.trim() || undefined,
        gender: selectedGender
          ? selectedGender === "male"
            ? "M"
            : selectedGender === "female"
            ? "F"
            : "O"
          : undefined,
        ...(avatarFile ? { avatarImg: avatarFile } : {}),
      } as any);

      try {
        await checkAuthStatus();
      } catch (refreshError) {
        console.error("Error refreshing user data:", refreshError);
      }

      Alert.alert(
        t("common.success") || "Success",
        t("profile.toast.updateSuccess") || "Profile updated successfully"
      );
      goBack();
    } catch (e: any) {
      console.error("[EditProfile] Update error:", {
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status,
        code: e?.code,
        stack: e?.stack,
      });

      let msg =
        t("profile.errors.updateFailed") ||
        "Failed to update profile. Please try again.";

      if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {

        if (
          e.message.includes("Network Error") ||
          e.message.includes("network")
        ) {
          msg =
            t("profile.errors.networkError") ||
            "Network error. Please check your connection and try again.";
        } else if (e.message.includes("timeout")) {
          msg =
            t("profile.errors.timeout") || "Request timeout. Please try again.";
        } else {
          msg = e.message;
        }
      } else if (e?.code === "ECONNABORTED") {
        msg =
          t("profile.errors.timeout") || "Request timeout. Please try again.";
      }

      Alert.alert(t("common.error") || "Error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
            <Text style={styles.backText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <Text style={styles.pageTitle}>{t("profileEdit.title")}</Text>

          <View style={styles.section}>
            <View style={styles.photoCard}>
              <View style={styles.photoContainer}>
                {avatarPreviewUri ? (
                  <Image
                    source={{ uri: avatarPreviewUri }}
                    style={styles.avatar}
                  />
                ) : user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color="#ccc" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={async () => {
                    try {
                      setAvatarError("");
                      const perm =
                        await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (perm.status !== "granted") {
                        Alert.alert(
                          t("common.error") || "Error",
                          t("profile.errors.permissionDenied") ||
                            "Permission denied"
                        );
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.9,
                        allowsMultipleSelection: false,
                        allowsEditing: true,
                        aspect: [1, 1],
                      });
                      if (result.canceled) return;
                      const asset = result.assets && result.assets[0];
                      if (!asset?.uri) return;
                      const uri = asset.uri;
                      const guessName = uri.split("/").pop() || "avatar.jpg";
                      const ext = (
                        guessName.split(".").pop() || "jpg"
                      ).toLowerCase();
                      const type =
                        ext === "png"
                          ? "image/png"
                          : ext === "jpg" || ext === "jpeg"
                          ? "image/jpeg"
                          : ext === "gif"
                          ? "image/gif"
                          : ext === "webp"
                          ? "image/webp"
                          : "image/jpeg";

                      const fileData = {
                        uri,
                        name: guessName,
                        type,
                        size: asset.fileSize,
                      };

                      const isValid = await validateAvatarFile(fileData);
                      if (!isValid) {
                        return; // Error already set by validateAvatarFile
                      }

                      setAvatarPreviewUri(uri);
                      setAvatarFile(fileData);
                    } catch (err: any) {
                      console.error("Error picking image:", err);
                      Alert.alert(
                        t("common.error") || "Error",
                        err?.message || "Failed to pick image"
                      );
                    }
                  }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>
                  {t("profileEdit.photo.title")}
                </Text>
                <Text style={styles.photoDescription}>
                  {t("profileEdit.photo.description")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.photoCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{t("profileEdit.info")}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profileEdit.fullName")}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      nameError
                        ? { borderColor: "#e11d48", borderWidth: 1 }
                        : {},
                    ]}
                    placeholder={t("profileEdit.fullNamePlaceholder")}
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(formatLiveName(text));
                      setNameError("");
                    }}
                    autoCapitalize="none"
                  />
                  {nameError ? (
                    <Text
                      style={{ color: "#e11d48", fontSize: 12, marginTop: 4 }}
                    >
                      {nameError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profileEdit.gender")}
                  </Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={styles.genderOption}
                      onPress={() => setSelectedGender("male")}
                    >
                      <View style={styles.radioButton}>
                        {selectedGender === "male" && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.genderText}>
                        {t("profileEdit.genderMale") || "Male"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.genderOption}
                      onPress={() => setSelectedGender("female")}
                    >
                      <View style={styles.radioButton}>
                        {selectedGender === "female" && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.genderText}>
                        {t("profileEdit.genderFemale") || "Female"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.genderOption}
                      onPress={() => setSelectedGender("other")}
                    >
                      <View style={styles.radioButton}>
                        {selectedGender === "other" && (
                          <View style={styles.radioSelected} />
                        )}
                      </View>
                      <Text style={styles.genderText}>
                        {t("profileEdit.genderOther") || "Other"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profileEdit.phone")}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      phoneError
                        ? { borderColor: "#e11d48", borderWidth: 1 }
                        : {},
                    ]}
                    placeholder={t("profileEdit.phonePlaceholder")}
                    placeholderTextColor="#999"
                    value={phone}
                    keyboardType="phone-pad"
                    onChangeText={(text) => {
                      setPhone(sanitizePhone(text));
                      setPhoneError("");
                    }}
                  />
                  {phoneError ? (
                    <Text
                      style={{ color: "#e11d48", fontSize: 12, marginTop: 4 }}
                    >
                      {phoneError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profileEdit.birthDate")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === "android") {
                        DateTimePickerAndroid.open({
                          value:
                            birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
                              ? new Date(birthDate)
                              : new Date(
                                  new Date().setFullYear(
                                    new Date().getFullYear() - 18
                                  )
                                ),
                          mode: "date",
                          maximumDate: new Date(), // Cannot select future date
                          minimumDate: new Date(1900, 0, 1), // Minimum date
                          onChange: (_e, d) => {
                            if (d) {
                              const y = d.getFullYear();
                              const m = `${d.getMonth() + 1}`.padStart(2, "0");
                              const da = `${d.getDate()}`.padStart(2, "0");
                              setBirthDate(`${y}-${m}-${da}`);
                              setDobError(""); // Clear error when date is selected
                            }
                          },
                        });
                      } else {
                        setShowDobPicker(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View pointerEvents="none">
                      <TextInput
                        style={styles.textInput}
                        placeholder={
                          t("profileEdit.birthDatePlaceholder") || "YYYY-MM-DD"
                        }
                        placeholderTextColor="#999"
                        value={birthDate}
                        editable={false}
                      />
                    </View>
                  </TouchableOpacity>
                  {Platform.OS === "ios" && (
                    <Modal
                      transparent
                      animationType="fade"
                      visible={showDobPicker}
                      onRequestClose={() => setShowDobPicker(false)}
                      presentationStyle="overFullScreen"
                    >
                      <Pressable
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: 20,
                        }}
                        onPress={() => setShowDobPicker(false)}
                      >
                        <Pressable
                          style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 28,
                            width: "100%",
                            maxWidth: 420,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 10,
                          }}
                          onPress={(e) => e.stopPropagation()}
                          onStartShouldSetResponder={() => true}
                        >
                          <Text
                            style={{
                              fontSize: 22,
                              fontWeight: "700",
                              color: "#212529",
                              marginBottom: 16,
                              textAlign: "center",
                              letterSpacing: 0.3,
                            }}
                          >
                            {t("profileEdit.birthDate") || "Date of Birth"}
                          </Text>
                          {birthDate && (
                            <Text
                              style={{
                                fontSize: 32,
                                fontWeight: "700",
                                color: "#007AFF",
                                marginBottom: 20,
                                textAlign: "center",
                              }}
                            >
                              {birthDate}
                            </Text>
                          )}
                          <View
                            style={{
                              width: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: 8,
                            }}
                          >
                            <DateTimePicker
                              value={
                                birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
                                  ? new Date(birthDate)
                                  : new Date(
                                      new Date().setFullYear(
                                        new Date().getFullYear() - 18
                                      )
                                    )
                              }
                              mode="date"
                              display="compact"
                              maximumDate={new Date()} // Cannot select future date
                              minimumDate={new Date(1900, 0, 1)} // Minimum date
                              onChange={(_e: any, d?: Date) => {
                                if (d) {
                                  const y = d.getFullYear();
                                  const m = `${d.getMonth() + 1}`.padStart(2, "0");
                                  const da = `${d.getDate()}`.padStart(2, "0");
                                  setBirthDate(`${y}-${m}-${da}`);
                                  setDobError(""); // Clear error when date is selected
                                  setTimeout(() => {
                                    setShowDobPicker(false);
                                  }, 300);
                                } else if (_e?.type === "dismissed") {
                                  setShowDobPicker(false);
                                }
                              }}
                              style={{
                                width: "100%",
                                alignSelf: "center",
                              }}
                            />
                          </View>
                        </Pressable>
                      </Pressable>
                    </Modal>
                  )}
                  {dobError ? (
                    <Text
                      style={{ color: "#e11d48", fontSize: 12, marginTop: 4 }}
                    >
                      {dobError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("profileEdit.address")}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { height: 80, paddingVertical: 12 },
                    ]}
                    placeholder={t("profileEdit.addressPlaceholder")}
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
              </View>
            </View>
          </View>

          {avatarError ? (
            <View
              style={{
                padding: 16,
                backgroundColor: "#fef2f2",
                margin: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#e11d48", fontSize: 14 }}>
                {avatarError}
              </Text>
            </View>
          ) : null}

          <View style={{ height: 180 }} />
        </ScrollView>

        <View
          style={[
            styles.saveButtonContainer,
            {
              position: "absolute",
              left: 20,
              right: 20,
              bottom: insets.bottom + (Platform.OS === "android" ? 140 : 60),
              paddingBottom: 0,
              backgroundColor: "transparent",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={
              saving ||
              !fullName.trim() ||
              !isNameValid(fullName) ||
              (phone.trim() && !isPhoneValid(phone)) ||
              (birthDate.trim() && !isBirthDateValid(birthDate)) ||
              !hasProfileChanges()
            }
          >
            <Text style={styles.saveButtonText}>
              {saving ? t("auth.common.sending") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </MainLayout>
  );
}
