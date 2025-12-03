import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
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
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const buttonOffset = Math.max(56, insets.bottom + 60);
  const [selectedGender, setSelectedGender] = useState<
    "male" | "female" | "other" | null
  >(null);
  const [fullName, setFullName] = useState<string>(user?.username || "");
  const [phone, setPhone] = useState<string>((user as any)?.phone || "");
  const [birthDate, setBirthDate] = useState<string>(
    ((user as any)?.birthDate as string) || ""
  );
  const [address, setAddress] = useState<string>((user as any)?.address || "");

  // Final sanitizer used before save (not used in onChange anymore)
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
  } | null>(null);

  const isNameValid = React.useCallback((name: string) => {
    const nameRegex = new RegExp(
      /^(?:[\p{Lu}][\p{L}]*)(?: [\p{Lu}][\p{L}]*)*$/u
    );
    return nameRegex.test(name.trim());
  }, []);

  const sanitizePhone = React.useCallback((text: string) => {
    const digits = (text || "").replace(/\D+/g, "");
    return digits;
  }, []);

  const isPhoneValid = React.useCallback((text: string) => {
    const digits = (text || "").replace(/\D+/g, "");
    return /^\d{10}$/.test(digits);
  }, []);

  const isBirthDateValid = React.useCallback((s: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() + 1 === m &&
      dt.getUTCDate() === d
    );
  }, []);

  const handleSave = async () => {
    const finalName = sanitizeName(fullName);

    if (!finalName.trim() || !isNameValid(finalName)) {
      Alert.alert("Error", "Full name is invalid");
      return;
    }
    if (!isPhoneValid(phone)) {
      Alert.alert("Error", "Phone number is invalid");
      return;
    }
    if (!birthDate || !isBirthDateValid(birthDate)) {
      Alert.alert("Error", "Birth date is invalid");
      return;
    }
    if (!selectedGender) {
      Alert.alert("Error", "Gender is required");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Address is required");
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
        phone: sanitizePhone(phone),
        birthDate,
        address: address.trim(),
        gender:
          selectedGender === "male"
            ? "M"
            : selectedGender === "female"
            ? "F"
            : "O",
        ...(avatarFile ? { avatarImg: avatarFile } : {}),
      } as any);
      Alert.alert("Success", "Profile updated successfully");
      goBack();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update profile. Please try again.";
      Alert.alert("Error", String(msg));
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                      const perm =
                        await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (perm.status !== "granted") {
                        Alert.alert("Error", "Permission denied");
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.9,
                        allowsMultipleSelection: false,
                      });
                      if (result.canceled) return;
                      const asset = result.assets && result.assets[0];
                      if (!asset?.uri) return;
                      const uri = asset.uri;
                      setAvatarPreviewUri(uri);
                      const guessName = uri.split("/").pop() || "avatar.jpg";
                      const ext = (
                        guessName.split(".").pop() || "jpg"
                      ).toLowerCase();
                      const type =
                        ext === "png"
                          ? "image/png"
                          : ext === "jpg" || ext === "jpeg"
                          ? "image/jpeg"
                          : "application/octet-stream";
                      setAvatarFile({ uri, name: guessName, type });
                    } catch {}
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
                    style={styles.textInput}
                    placeholder={t("profileEdit.fullNamePlaceholder")}
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={(text) => setFullName(formatLiveName(text))}
                    autoCapitalize="none"
                  />
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
                    style={styles.textInput}
                    placeholder={t("profileEdit.phonePlaceholder")}
                    placeholderTextColor="#999"
                    value={phone}
                    keyboardType="phone-pad"
                    onChangeText={(text) => setPhone(sanitizePhone(text))}
                  />
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
                              : new Date(),
                          mode: "date",
                          onChange: (_e, d) => {
                            if (d) {
                              const y = d.getFullYear();
                              const m = `${d.getMonth() + 1}`.padStart(2, "0");
                              const da = `${d.getDate()}`.padStart(2, "0");
                              setBirthDate(`${y}-${m}-${da}`);
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
                  {Platform.OS === "ios" && showDobPicker && (
                    <DateTimePicker
                      value={
                        birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
                          ? new Date(birthDate)
                          : new Date()
                      }
                      mode="date"
                      display="spinner"
                      onChange={(_e: any, d?: Date) => {
                        if (d) {
                          const y = d.getFullYear();
                          const m = `${d.getMonth() + 1}`.padStart(2, "0");
                          const da = `${d.getDate()}`.padStart(2, "0");
                          setBirthDate(`${y}-${m}-${da}`);
                        }
                        setShowDobPicker(false);
                      }}
                    />
                  )}
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

          <View style={{ height: Math.max(160, insets.bottom + 120) }} />
        </ScrollView>

        <View
          style={[
            styles.saveButtonContainer,
            {
              position: "absolute",
              left: 20,
              right: 20,
              bottom: buttonOffset,
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
              !isPhoneValid(phone) ||
              !birthDate ||
              !isBirthDateValid(birthDate) ||
              !address.trim() ||
              !selectedGender
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
