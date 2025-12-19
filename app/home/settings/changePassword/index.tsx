import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../../navigation/navigation";
import { useAuthContext } from "../../../../src/contexts/authContext";
import MainLayout from "../../../../components/MainLayout";
import { Input } from "../../../../components/Input";
import { authEndpoints } from "../../../../services/endpoints/auth";
import styles from "./styles";
import { useTranslation } from "react-i18next";

export default function ChangePassword() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = t("changePassword.errors.oldPasswordRequired");
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = t("changePassword.errors.newPasswordRequired");
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t("changePassword.errors.passwordTooShort");
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t("changePassword.errors.confirmPasswordRequired");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("changePassword.errors.passwordsDoNotMatch");
    }

    if (oldPassword === newPassword) {
      newErrors.newPassword = t("changePassword.errors.samePassword");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.email) {
      Alert.alert(
        t("changePassword.errors.title"),
        t("changePassword.errors.userNotFound")
      );
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authEndpoints.changePassword({
        email: user.email,
        oldPassword,
        newPassword,
      });

      Alert.alert(
        t("changePassword.success.title"),
        t("changePassword.success.message"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
              goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "";
      let message = errorMessage;

      // Check for OAuth-only user errors
      if (
        errorMessage.toLowerCase().includes("oauth") ||
        errorMessage.toLowerCase().includes("social") ||
        errorMessage.toLowerCase().includes("google") ||
        errorMessage.toLowerCase().includes("naver") ||
        errorMessage.toLowerCase().includes("không có mật khẩu") ||
        errorMessage.toLowerCase().includes("does not have a password") ||
        errorMessage.toLowerCase().includes("비밀번호가 없습니다") ||
        errorMessage.toLowerCase().includes("cannot change password") ||
        errorMessage.toLowerCase().includes("không thể đổi mật khẩu")
      ) {
        message = t("changePassword.errors.oauthOnly");
      } else if (!message) {
        message = t("changePassword.errors.generic");
      }

      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
            <Text style={styles.backText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.pageTitle}>{t("changePassword.title")}</Text>
          <Text style={styles.subtitle}>{t("changePassword.subtitle")}</Text>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF8A9B" />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <Input
              label={t("changePassword.oldPassword")}
              placeholder={t("changePassword.oldPasswordPlaceholder")}
              value={oldPassword}
              onChangeText={(text) => {
                setOldPassword(text);
                if (errors.oldPassword) {
                  setErrors({ ...errors, oldPassword: undefined });
                }
              }}
              secureTextEntry
              error={errors.oldPassword}
              style={styles.inputStyle}
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color="#B8B8B8" />
              }
            />

            <Input
              label={t("changePassword.newPassword")}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: undefined });
                }
              }}
              secureTextEntry
              error={errors.newPassword}
              style={styles.inputStyle}
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color="#B8B8B8" />
              }
            />

            <Input
              label={t("changePassword.confirmPassword")}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              secureTextEntry
              error={errors.confirmPassword}
              style={styles.inputStyle}
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color="#B8B8B8" />
              }
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {t("changePassword.submit")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </MainLayout>
  );
}

