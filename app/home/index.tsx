import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useTranslation } from "react-i18next";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

const { width } = Dimensions.get("window");

export default function Home() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();

  // Mock data cho tour du lịch Đà Nẵng
  const featuredTours = [
    {
      id: 1,
      title: "Khám phá Biển Mỹ Khê",
      price: "500,000",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop",
      location: "Biển Mỹ Khê, Đà Nẵng",
      duration: "1 ngày",
    },
    {
      id: 2,
      title: "Tour Bán đảo Sơn Trà",
      price: "800,000",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
      location: "Bán đảo Sơn Trà, Đà Nẵng",
      duration: "1 ngày",
    },
    {
      id: 3,
      title: "Khám phá Ngũ Hành Sơn",
      price: "600,000",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
      location: "Ngũ Hành Sơn, Đà Nẵng",
      duration: "1 ngày",
    },
  ];

  const newsItems = [
    {
      id: 1,
      title: "Khám phá vẻ đẹp mới của Đà Nẵng",
      summary: "Những điểm đến mới được khám phá và phát triển...",
      date: "2 giờ trước",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      title: "Văn hóa Hàn Quốc - Những điều thú vị",
      summary: "Tìm hiểu về văn hóa truyền thống và hiện đại của Hàn Quốc...",
      date: "5 giờ trước",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header với gradient và nút đăng nhập/đăng ký */}
      <LinearGradient
        colors={colors.gradient.primary as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>TK</Text>
            </View>
            <Text style={styles.appName}>{t("brand")}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.authButton}
              onPress={() => navigate("/loginSelection")}
            >
              <Ionicons name="log-in-outline" size={20} color="white" />
              <Text style={styles.authButtonText}>
                {t("home.hero.btnLogin")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButton, styles.registerButton]}
              onPress={() => navigate("/signUp")}
            >
              <Ionicons name="person-add-outline" size={20} color="white" />
              <Text style={styles.authButtonText}>
                {t("home.hero.btnRegister")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Hero Section với hình ảnh biển Đà Nẵng */}
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop",
          }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.heroOverlay}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t("home.hero.titleLead")}</Text>
            <Text style={styles.heroSubtitle}>{t("home.hero.titleEmph")}</Text>
            <Text style={styles.heroDescription}>{t("home.hero.desc")}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Featured Tours Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.dashboard.welcome")}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>
              {t("home.dashboard.viewProfile")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toursContainer}
        >
          {featuredTours.map((tour) => (
            <TouchableOpacity key={tour.id} style={styles.tourCard}>
              <Image source={{ uri: tour.image }} style={styles.tourImage} />
              <View style={styles.tourContent}>
                <Text style={styles.tourTitle}>{tour.title}</Text>
                <Text style={styles.tourLocation}>{tour.location}</Text>
                <View style={styles.tourMeta}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{tour.rating}</Text>
                  </View>
                  <Text style={styles.tourDuration}>{tour.duration}</Text>
                </View>
                <Text style={styles.tourPrice}>{tour.price} VNĐ</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t("home.dashboard.description")}
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>
              {t("home.dashboard.settings")}
            </Text>
          </TouchableOpacity>
        </View>

        {newsItems.map((news) => (
          <TouchableOpacity key={news.id} style={styles.newsCard}>
            <Image source={{ uri: news.image }} style={styles.newsImage} />
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>{news.title}</Text>
              <Text style={styles.newsSummary}>{news.summary}</Text>
              <Text style={styles.newsDate}>{news.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={colors.gradient.secondary as [string, string]}
          style={styles.ctaContainer}
        >
          <Text style={styles.ctaTitle}>{t("home.welcome.heading")}</Text>
          <Text style={styles.ctaSubtitle}>{t("home.welcome.subheading")}</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigate("/signUp")}
          >
            <Text style={styles.ctaButtonText}>
              {t("home.hero.btnRegister")}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  logoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  appName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  registerButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  authButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  heroSection: {
    position: "relative",
    height: 300,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  heroContent: {
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "white",
    marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 24,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: "600",
  },
  toursContainer: {
    marginBottom: spacing.lg,
  },
  tourCard: {
    width: width * 0.7,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tourImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  tourContent: {
    padding: spacing.md,
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tourLocation: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  tourMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  tourDuration: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  tourPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary.main,
  },
  newsCard: {
    flexDirection: "row",
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  newsSummary: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
    color: colors.text.disabled,
  },
  ctaSection: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  ctaContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "white",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary.main,
  },
});
