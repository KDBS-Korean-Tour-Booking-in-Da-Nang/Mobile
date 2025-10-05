import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../src/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import { colors } from "../../../src/constants/theme";
import MainLayout from "../../../src/components/MainLayout";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { usePremium } from "../../../src/contexts/premiumContext";

export default function UserProfile() {
  const { refreshStatus, premiumType: contextPremiumType } = usePremium();
  const { goBack, navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [premiumType, setPremiumType] = useState<string | undefined>(undefined);
  const isPremium = premiumType === "PREMIUM";

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          await refreshStatus();
          if (active) setPremiumType(contextPremiumType);
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#6c757d" />
            <Text style={styles.backText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={40}
                      color={colors.text.secondary}
                    />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.profileInfo}
                onPress={() => navigate("/auth/profile/edit")}
              >
                <Text style={styles.username}>{user?.username}</Text>
                <Text style={styles.editProfileText}>
                  {t("profile.editProfile")}
                </Text>
              </TouchableOpacity>
              {isPremium ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={16} color="#FFD700" />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>
                    {t("profile.upgradePremium")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("profile.order.title")}
                </Text>
                <Text style={styles.optionDescription}>
                  {t("profile.order.subtitle")}
                </Text>
              </View>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("profile.payment.title")}
                </Text>
                <Text style={styles.optionDescription}>
                  {t("profile.payment.subtitle")}
                </Text>
              </View>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("profile.coupon.title")}
                </Text>
                <Text style={styles.optionDescription}>
                  {t("profile.coupon.subtitle")}
                </Text>
              </View>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("profile.supportCenter.title")}
                </Text>
                <Text style={styles.optionDescription}>
                  {t("profile.supportCenter.subtitle")}
                </Text>
              </View>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigate("/home/settings")}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{t("settings.title")}</Text>
                <Text style={styles.optionDescription}>
                  {t("settings.subtitle")}
                </Text>
              </View>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
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
    color: "#6c757d",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingBottom: Platform.select({ ios: 200, android: 220 }) as number,
  },
  profileHeader: {
    backgroundColor: "#E3F2FD",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  editProfileText: {
    fontSize: 14,
    color: "#6c757d",
  },
  upgradeButton: {
    backgroundColor: "#1a8eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFE082",
    gap: 6,
  },
  premiumBadgeText: {
    color: "#FF8F00",
    fontSize: 12,
    fontWeight: "700",
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  bottomSpacing: {
    height: Platform.select({ ios: 100, android: 120 }) as number,
  },
});
