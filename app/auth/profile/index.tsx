import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../navigation/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import { colors } from "../../../constants/theme";
import MainLayout from "../../../components/MainLayout";
import { useTranslation } from "react-i18next";
import styles from "./styles";

export default function UserProfile() {
  const { goBack, navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();

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
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigate("/tour/historyBooking")}
            >
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

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigate("/tour/voucherList")}
            >
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

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigate("/chat/ai")}
            >
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
