import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../src/navigation";
import { useTranslation } from "react-i18next";
import { colors } from "../../src/constants/theme";
import ScrollableLayout from "../../src/components/ScrollableLayout";
import { useAuthContext } from "../../src/contexts/authContext";
import {
  getAllPosts,
  PostResponse,
  getReactionSummary,
} from "../../src/endpoints/forum";
import { tourService } from "../../src/services/tourService";
import { TourResponse } from "../../src/types/tour";
import PremiumModal from "../../src/components/PremiumModal";
import { premiumService } from "../../src/services/premiumService";
import { useFocusEffect } from "@react-navigation/native";
import styles from "./styles";

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
  const [featuredTours, setFeaturedTours] = useState<TourResponse[]>([]);
  const [toursLoading, setToursLoading] = useState(true);

  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ko" | "vi">(
    i18n.language as "en" | "ko" | "vi"
  );
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumType, setPremiumType] = useState<string | undefined>(undefined);
  const [premiumExpiry, setPremiumExpiry] = useState<string | undefined>(
    undefined
  );
  const isPremium = premiumType === "PREMIUM";
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const status = await premiumService.refreshPremiumStatus();
          if (isActive) {
            setPremiumType(status.premiumType);
            setPremiumExpiry(status.expiryDate);
          }
        } catch {}
      })();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleLanguageSelect = (language: "en" | "ko" | "vi") => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    const loadTours = async () => {
      try {
        setToursLoading(true);
        const tours = await tourService.getAllTours();

        if (
          typeof tours === "string" &&
          (tours as string).includes("<!DOCTYPE html>")
        ) {
          setFeaturedTours([]);
          return;
        }

        const validTours = Array.isArray(tours) ? tours : [];
        setFeaturedTours(validTours);
      } catch (error) {
        console.error("Error loading tours:", error);
        setFeaturedTours([]);
      } finally {
        setToursLoading(false);
      }
    };

    loadTours();
  }, []);

  const tourImageUrls = useMemo(() => {
    if (!featuredTours || featuredTours.length === 0) return {};

    const urls: Record<number, string> = {};

    featuredTours.forEach((tour) => {
      const isHttp = (u?: string) =>
        !!u && /^https?:\/\//i.test((u || "").trim());

      if (isHttp(tour?.tourImgPath)) {
        urls[tour.id] = (tour.tourImgPath as string).trim();
        return;
      }

      const firstContent = tour?.contents?.[0];
      if (
        firstContent?.images &&
        Array.isArray(firstContent.images) &&
        firstContent.images.length > 0
      ) {
        const firstImage = firstContent.images[0];
        if (typeof firstImage === "string" && isHttp(firstImage)) {
          urls[tour.id] = firstImage.trim();
          return;
        }
      }
      urls[tour.id] = "";
    });

    return urls;
  }, [featuredTours]);

  const resolveTourCardImage = (t: any): string => {
    return tourImageUrls[t.id];
  };

  const renderTourCards = () => {
    if (!featuredTours || featuredTours.length === 0) return null;

    return featuredTours.map((tour) => (
      <TouchableOpacity
        key={tour.id}
        style={styles.tourCard}
        onPress={() => navigate(`/tour?id=${tour.id}`)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: resolveTourCardImage(tour),
            }}
            style={styles.tourImage}
            contentFit="cover"
            transition={0}
            cachePolicy="disk"
          />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{tour.tourDuration || "3N2D"}</Text>
        </View>
        <View style={styles.tourContent}>
          <Text style={[styles.tourTitle]}>{tour.tourName}</Text>
          <View style={styles.tourRow}>
            <View style={styles.locationContainer}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.tourLocation}>
                {tour.tourDeparturePoint || "Đà Nẵng"}
              </Text>
            </View>
            <Text style={styles.tourPrice}>
              {tour.adultPrice
                ? `${tour.adultPrice.toLocaleString()} VND`
                : "Liên hệ"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

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
        const postsWithHashtags = posts
          .filter((p) => p.hashtags && p.hashtags.length > 0)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        const postsWithReactions = await Promise.all(
          postsWithHashtags.map(async (post) => {
            try {
              const reactionSummary = await getReactionSummary(
                post.id,
                "POST",
                user?.email
              );
              const like = reactionSummary?.likeCount || 0;
              const dislike = reactionSummary?.dislikeCount || 0;
              const total =
                reactionSummary?.totalReactions !== undefined
                  ? reactionSummary.totalReactions
                  : like + dislike;
              return {
                ...post,
                totalReactions: total,
                likeCount: like,
                dislikeCount: dislike,
              };
            } catch {
              return {
                ...post,
                totalReactions:
                  typeof post.totalReactions === "number"
                    ? post.totalReactions
                    : (post.likeCount || 0) + (post.dislikeCount || 0),
              } as PostResponse;
            }
          })
        );

        setHotPosts(postsWithReactions);
      } catch {}
    })();
  }, []);

  const isSmall =
    Dimensions.get("window").width <= 360 ||
    Dimensions.get("window").height <= 700;
  const lang = i18n.language as "en" | "vi" | "ko";
  const langAdjust =
    lang === "ko"
      ? styles.langKoAdjust
      : lang === "vi"
      ? styles.langViAdjust
      : null;

  return (
    <ScrollableLayout>
      <View style={[styles.container, isSmall && styles.containerSm]}>
        <View style={[styles.topHeader, isSmall && styles.topHeaderSm]}>
          <View>
            <Text style={styles.welcomeLabel}>{t("home.welcome.heading")}</Text>
            <View style={styles.usernameContainer}>
              <Text style={[styles.usernameText, langAdjust]}>
                {user?.username || "Guest"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPremiumModal(true)}
                style={styles.premiumIconContainer}
              >
                <Ionicons
                  name="diamond"
                  size={20}
                  color={isPremium ? "#FFD700" : "#C0C0C0"}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rightActions}>
            <LanguageDropdown
              currentLanguage={currentLanguage}
              onLanguageSelect={handleLanguageSelect}
            />
            <TouchableOpacity
              style={styles.settingBtn}
              onPress={() => navigate("/home/settings")}
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
            <Text
              style={[styles.sectionTitle, isSmall && styles.sectionTitleSm]}
            >
              {t("home.dashboard.welcome")}
            </Text>
            <TouchableOpacity onPress={() => navigate("/tour/list")}>
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.toursContainer}
            removeClippedSubviews={false}
            decelerationRate="fast"
            snapToInterval={Dimensions.get("window").width * 0.5 + 16}
            snapToAlignment="start"
            pagingEnabled={false}
            bounces={false}
            scrollEventThrottle={16}
          >
            {toursLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>{t("tour.loading")}</Text>
              </View>
            ) : featuredTours && featuredTours.length > 0 ? (
              renderTourCards()
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t("tour.errors.notFound")}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Hot Topic */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("common.hotTopic")}</Text>
            <TouchableOpacity onPress={() => navigate("/forum")}>
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
        {Platform.OS === "android" && <View style={styles.bottomSpacing} />}
      </View>

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        isPremium={isPremium}
        premiumExpiry={premiumExpiry}
      />
    </ScrollableLayout>
  );
}
