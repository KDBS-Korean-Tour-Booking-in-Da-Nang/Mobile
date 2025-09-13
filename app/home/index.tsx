import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useTranslation } from "react-i18next";
import { colors, spacing, borderRadius } from "../../src/constants/theme";
import ScrollableLayout from "../../src/components/ScrollableLayout";
import { useAuthContext } from "../../src/contexts/authContext";
import {
  getAllPosts,
  PostResponse,
  getReactionSummary,
} from "../../src/endpoints/forum";

const { width } = Dimensions.get("window");

// Language dropdown component
const LanguageDropdown = ({
  currentLanguage,
  onLanguageSelect,
}: {
  currentLanguage: "en" | "ko" | "vi";
  onLanguageSelect: (lang: "en" | "ko" | "vi") => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    {
      code: "en" as const,
      name: "English",
      flag: require("../../assets/images/eng.png"),
    },
    {
      code: "ko" as const,
      name: "한국어",
      flag: require("../../assets/images/krn.webp"),
    },
    {
      code: "vi" as const,
      name: "Việt Nam",
      flag: require("../../assets/images/vn.jpeg"),
    },
  ];

  const currentLang =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  const getLanguageCode = (code: string) => {
    switch (code) {
      case "en":
        return "EN";
      case "ko":
        return "KO";
      case "vi":
        return "VN";
      default:
        return "EN";
    }
  };

  return (
    <View style={styles.languageContainer}>
      <TouchableOpacity
        style={styles.langBadge}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Image source={currentLang.flag} style={styles.flagImage} />
        <Text style={styles.langText}>{getLanguageCode(currentLanguage)}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={12}
          color="#212529"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.dropdownItem,
                lang.code === currentLanguage && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onLanguageSelect(lang.code);
                setIsOpen(false);
              }}
            >
              <Image source={lang.flag} style={styles.flagImage} />
              <Text
                style={[
                  styles.dropdownText,
                  lang.code === currentLanguage && styles.dropdownTextActive,
                ]}
              >
                {lang.name}
              </Text>
              <Text
                style={[
                  styles.dropdownCode,
                  lang.code === currentLanguage && styles.dropdownCodeActive,
                ]}
              >
                {getLanguageCode(lang.code)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function Home() {
  const { navigate } = useNavigation();
  const { t, i18n } = useTranslation();
  const { user } = useAuthContext();
  const [hotPosts, setHotPosts] = useState<PostResponse[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ko" | "vi">(
    i18n.language as "en" | "ko" | "vi"
  );

  // Function to handle language selection
  const handleLanguageSelect = (language: "en" | "ko" | "vi") => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
  };

  // Mock data cho tour du lịch Đà Nẵng
  const featuredTours = [
    {
      id: 1,
      title: "Khám phá Biển Mỹ Khê",
      price: "500,000",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop",
      location: "Đà Nẵng",
    },
    {
      id: 2,
      title: "Tour Bán đảo Sơn Trà",
      price: "800,000",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
      location: "Đà Nẵng",
    },
    {
      id: 3,
      title: "Khám phá Ngũ Hành Sơn",
      price: "600,000",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
      location: "Đà Nẵng",
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

  const removeDiacritics = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .replace(/đ/gi, "d");

  // Sync currentLanguage with i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as "en" | "ko" | "vi");
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    (async () => {
      try {
        const posts = await getAllPosts();
        // Lấy 5 bài viết mới nhất có hashtag
        const postsWithHashtags = posts
          .filter((p) => p.hashtags && p.hashtags.length > 0)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        // Lấy reaction summary cho mỗi bài viết
        const postsWithReactions = await Promise.all(
          postsWithHashtags.map(async (post) => {
            try {
              const reactionSummary = await getReactionSummary(post.id, "POST");
              return {
                ...post,
                totalReactions: reactionSummary?.totalReactions || 0,
                likeCount: reactionSummary?.likeCount || 0,
                dislikeCount: reactionSummary?.dislikeCount || 0,
              };
            } catch {
              // Nếu không lấy được reaction, giữ nguyên giá trị cũ
              return post;
            }
          })
        );

        setHotPosts(postsWithReactions);
      } catch {}
    })();
  }, []);

  return (
    <ScrollableLayout>
      <View style={styles.container}>
        {/* Header: Welcome + username (left), language + settings (right) */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.welcomeLabel}>{t("home.welcome.heading")}</Text>
            <Text style={styles.usernameText}>{user?.username || "Guest"}</Text>
          </View>
          <View style={styles.rightActions}>
            <LanguageDropdown
              currentLanguage={currentLanguage}
              onLanguageSelect={handleLanguageSelect}
            />
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => navigate("/userProfile")}
            >
              <Ionicons name="settings-outline" size={20} color="#212529" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6c757d" />
          <Text style={styles.searchPlaceholder}>
            {t("forum.searchPlaceholder")}
          </Text>
        </View>

        {/* Hero removed as requested */}

        {/* Popular Tour */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("home.dashboard.welcome")}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
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
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>3N2D</Text>
                </View>
                <View style={styles.tourContent}>
                  <Text style={styles.tourTitle}>{tour.title}</Text>
                  <View style={styles.tourRow}>
                    <View style={styles.locationContainer}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.tourLocation}>{tour.location}</Text>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{tour.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Hot Topic */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("common.hotTopic")}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {hotPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.newsCard}
              onPress={() => navigate(`/forum?postId=${post.id}`)}
            >
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color={colors.text.primary} />
              </View>
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{post.title}</Text>
                <View style={styles.hashtagsContainer}>
                  {post.hashtags.slice(0, 3).map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              </View>
              <Ionicons
                name="happy-outline"
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.newsDate}>{post.totalReactions}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Article */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("common.article")}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.articlesContainer}
          >
            {newsItems.map((news) => (
              <TouchableOpacity key={news.id} style={styles.articleCard}>
                <Image
                  source={{ uri: news.image }}
                  style={styles.articleImage}
                />
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle}>{news.title}</Text>
                  <Text style={styles.articleSummary}>{news.summary}</Text>
                  <Text style={styles.articleMeta}>{news.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollableLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  welcomeLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "400",
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    letterSpacing: -0.5,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageContainer: {
    position: "relative",
  },
  langBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  flagImage: {
    width: 20,
    height: 15,
    borderRadius: 3,
  },
  langText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212529",
  },
  dropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: "#f8f9fa",
  },
  dropdownText: {
    fontSize: 14,
    color: "#212529",
    flex: 1,
    fontWeight: "500",
  },
  dropdownTextActive: {
    fontWeight: "600",
  },
  dropdownCode: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "600",
  },
  dropdownCodeActive: {
    color: "#212529",
  },
  settingBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBox: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    marginLeft: 12,
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "400",
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
    marginBottom: -12,
  },
  tourCard: {
    width: width * 0.5,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  tourImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  durationBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: { fontSize: 10, fontWeight: "700", color: colors.text.primary },
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
    marginTop: 8,
  },
  tourMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  tourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    alignItems: "center",
    gap: spacing.md,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  newsContent: {
    flex: 1,
    marginRight: 8,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
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
  tag: {
    fontSize: 12,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  articlesContainer: {
    marginBottom: -12,
  },
  articleCard: {
    width: width * 0.5,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  articleContent: {
    padding: spacing.md,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  articleSummary: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  articleMeta: {
    fontSize: 12,
    color: colors.text.disabled,
  },
  ctaSection: {
    padding: spacing.lg,
    marginBottom: 100,
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
