import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import ChatBubble from "../../components/ChatBubble";
import GeminiChatBubble from "../../components/GeminiChatBubble";
import ScrollableLayout from "../../components/ScrollableLayout";
import { colors } from "../../constants/theme";
import { useNavigation } from "../../navigation/navigation";
import api from "../../services/api";
import {
    Article,
    getApprovedArticles,
} from "../../services/endpoints/articles";
import forumEndpoints, { PostResponse } from "../../services/endpoints/forum";
import tourEndpoints from "../../services/endpoints/tour";
import { useAuthContext } from "../../src/contexts/authContext";
import { PostRawResponse } from "../../src/types/response/forum.response";
import { TourResponse } from "../../src/types/response/tour.response";
import { formatPriceKRW } from "../../src/utils/currency";
import { getTourThumbnailUrl } from "../../src/utils/media";
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [suggestToursViaBehavior, setSuggestToursViaBehavior] = useState<TourResponse[]>([]);
  const [loadingSuggestTours, setLoadingSuggestTours] = useState(false);

  // Search UI state (similar to forum)
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ko" | "vi">(
    i18n.language as "en" | "ko" | "vi"
  );
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleLanguageSelect = (language: "en" | "ko" | "vi") => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
  };

  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const isValidToken = (s: string) => {
      if (!s) return false;
      const trimmed = s.trim();
      if (trimmed.length > 40) return false;
      if (/[\{\}\[\]"']|:\s?/.test(trimmed)) return false;
      if (/^\[\[meta/i.test(trimmed)) return false;
      if (/https?:\/\//i.test(trimmed)) return false;
      return true;
    };
    const q = query.toLowerCase();
    const words = new Set<string>();
    const tags = new Set<string>();
    (hotPosts || []).forEach((p) => {
      p?.hashtags?.forEach((t) => {
        if (typeof t === "string" && t.toLowerCase().includes(q)) {
          tags.add(`#${t}`);
        }
      });
      const titleWords = p?.title?.toLowerCase().split(/\s+/) || [];
      const contentWords = p?.content?.toLowerCase().split(/\s+/) || [];
      [...titleWords, ...contentWords].forEach((w) => {
        if (w && w.length > 2 && w.includes(q) && isValidToken(w)) words.add(w);
      });
    });
    const list = [
      ...Array.from(tags).slice(0, 3),
      ...Array.from(words).slice(0, 5),
    ]
      .filter(isValidToken)
      .slice(0, 8);
    setSearchSuggestions(list);
  };

  useEffect(() => {
    const loadTours = async () => {
      try {
        setToursLoading(true);
        const toursRes = await tourEndpoints.getAllPublic();
        const tours = toursRes.data;

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
        setFeaturedTours([]);
      } finally {
        setToursLoading(false);
      }
    };

    const loadArticles = async () => {
      try {
        setArticlesLoading(true);
        const articlesData = await getApprovedArticles();
        setArticles(articlesData);
      } catch (error) {
        setArticles([]);
      } finally {
        setArticlesLoading(false);
      }
    };

    const loadSuggestTours = async () => {
      try {
        setLoadingSuggestTours(true);
        const userId = (user as any)?.userId || (user as any)?.id || 0;
        // Backend expects int userId (required = false means default 0)
        const response = await tourEndpoints.suggestViaBehavior(userId);
        const tours = Array.isArray(response.data) ? response.data : [];
        // Map tourId to id since backend returns Tour entity (with tourId) instead of TourResponse (with id)
        const mappedTours = tours.map((tour: any) => ({
          ...tour,
          id: tour.id || tour.tourId, // Use tourId if id is not present
        }));
        setSuggestToursViaBehavior(mappedTours);
      } catch (error: any) {
        // Silently handle errors - don't show error to user
        // Timeout, network errors, or empty results are expected
        const isTimeout = error?.code === "ECONNABORTED" || error?.message?.includes("timeout");
        const isNetworkError = error?.code === "ERR_NETWORK" || !error?.response;
        const isServerError = error?.response?.status >= 500;
        
        // Only log unexpected errors (not timeout, network, or server errors)
        if (!isTimeout && !isNetworkError && !isServerError && error?.response?.status !== 404) {
          console.error("Error loading suggest tours via behavior:", error);
        }
        setSuggestToursViaBehavior([]);
      } finally {
        setLoadingSuggestTours(false);
      }
    };

    loadTours();
    loadArticles();
    loadSuggestTours();
  }, [user]);

  const tourImageUrls = useMemo(() => {
    if (!featuredTours || featuredTours.length === 0) return {};

    const urls: Record<number, string> = {};

    featuredTours.forEach((tour) => {
      // Card cover: chỉ dùng ảnh bìa (thumbnails)
      const cover = getTourThumbnailUrl(tour?.tourImgPath);
      urls[tour.id] = cover || "";
    });

    return urls;
  }, [featuredTours]);

  const resolveTourCardImage = (t: any): string => {
    return (
      tourImageUrls[t.id] ||
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop"
    );
  };

  const renderTourCards = () => {
    if (!featuredTours || featuredTours.length === 0) return null;

    return featuredTours.map((tour) => (
      <TouchableOpacity
        key={tour.id}
        style={styles.tourCard}
        onPress={() => navigate(`/tour/tourDetail?id=${tour.id}`)}
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
              {tour.adultPrice ? formatPriceKRW(tour.adultPrice) : "N/A"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  const formatArticleDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return t("article.justNow");
    } else if (diffInHours < 24) {
      return t("article.hoursAgo", { hours: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t("article.daysAgo", { days: diffInDays });
    }
  };

  const extractFirstImageSrc = (html: string): string | null => {
    if (!html) return null;
    const match = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    return match && match[1] ? match[1] : null;
  };

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as "en" | "ko" | "vi");
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const transformApiPost = (apiPost: PostRawResponse): PostResponse => {
    const toAbsoluteUrl = (path: string): string => {
      if (!path) return path;
      if (/^https?:\/\//i.test(path)) return path;
      const base = (api.defaults.baseURL || "").replace(/\/$/, "");
      const origin = base.endsWith("/api") ? base.slice(0, -4) : base;
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${origin}${normalizedPath}`;
    };

    let hashtags: string[] = [];
    if (apiPost.hashtags) {
      if (Array.isArray(apiPost.hashtags)) {
        hashtags = apiPost.hashtags.map((h) => {
          if (typeof h === "string") return h;
          if (typeof h === "object" && h.content) return h.content;
          return String(h);
        });
      }
    }

    return {
      id: apiPost.forumPostId,
      title: apiPost.title,
      content: apiPost.content,
      username: apiPost.username || "Unknown User",
      userAvatar: apiPost.userAvatar || "",
      imageUrls: apiPost.images
        ? apiPost.images.map((i) => toAbsoluteUrl(i.imgPath))
        : [],
      hashtags,
      createdAt: apiPost.createdAt,
      likeCount: apiPost.reactions?.likeCount || 0,
      dislikeCount: apiPost.reactions?.dislikeCount || 0,
      totalReactions: apiPost.reactions?.totalReactions || 0,
      userReaction: apiPost.reactions?.userReaction || null,
      commentCount: 0,
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await forumEndpoints.getAllPosts();
        const apiPosts = Array.isArray(response.data) ? response.data : [];
        const posts = apiPosts.map(transformApiPost);
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
              const reactionResponse = await forumEndpoints.getReactionSummary(
                post.id,
                "POST",
                user?.email
              );
              const reactionSummary = reactionResponse.data;
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
    <View style={{ flex: 1 }}>
      <ScrollableLayout>
        <View
          style={[
            styles.container,
            Platform.OS === "ios" && styles.containerIos,
            isSmall && styles.containerSm,
          ]}
        >
          <View style={[styles.topHeader, isSmall && styles.topHeaderSm]}>
            <View>
              <Text style={styles.welcomeLabel}>
                {t("home.welcome.heading")}
              </Text>
              <View style={styles.usernameContainer}>
                <Text style={[styles.usernameText, langAdjust]}>
                  {user?.username || "Guest"}
                </Text>
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

          <View style={{ position: "relative" }}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#6c757d" />
              <TextInput
                style={{ marginLeft: 8, flex: 1, color: "#212529" }}
                placeholder={t("forum.searchPlaceholder")}
                placeholderTextColor="#6c757d"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim()) {
                    generateSearchSuggestions(text);
                    setShowSearchDropdown(true);
                  } else {
                    setShowSearchDropdown(false);
                    setSearchSuggestions([]);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true);
                }}
                onSubmitEditing={() => {
                  setShowSearchDropdown(false);
                  navigate("/forum");
                }}
              />
            </View>
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <View style={styles.searchDropdown}>
                {searchSuggestions.map((sug, idx) => (
                  <TouchableOpacity
                    key={`${sug}-${idx}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery(sug.replace("#", ""));
                      navigate("/forum");
                    }}
                  >
                    <Ionicons
                      name={sug.startsWith("#") ? "pricetag" : "search"}
                      size={16}
                      color="#6c757d"
                    />
                    <Text style={styles.suggestionText}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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
                  <Ionicons
                    name="person"
                    size={20}
                    color={colors.text.primary}
                  />
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("common.article")}</Text>
              <TouchableOpacity onPress={() => navigate("/article")}>
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {articlesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>{t("article.loading")}</Text>
              </View>
            ) : articles.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.articlesContainer}
              >
                {articles.map((article) => (
                  <TouchableOpacity
                    key={article.articleId}
                    style={styles.articleCard}
                    onPress={() => {
                      navigate(
                        `/article/detailArticle?id=${article.articleId}`
                      );
                    }}
                  >
                    <Image
                      source={{
                        uri: extractFirstImageSrc(article.articleContent) || "",
                      }}
                      style={styles.articleImage}
                      contentFit="cover"
                      transition={0}
                      cachePolicy="disk"
                    />
                    <View style={styles.articleContent}>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {article.articleTitle}
                      </Text>
                      <Text style={styles.articleSummary} numberOfLines={2}>
                        {article.articleDescription}
                      </Text>
                      <Text style={styles.articleMeta}>
                        {formatArticleDate(article.articleCreatedDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("article.noArticles")}</Text>
              </View>
            )}
          </View>

          {/* Suggest Tours Via Behavior Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t("home.suggestTours.title")}
                </Text>
              <TouchableOpacity onPress={() => navigate("/tour/list")}>
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {loadingSuggestTours ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>{t("tour.loading")}</Text>
              </View>
            ) : suggestToursViaBehavior.length > 0 ? (
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
                {suggestToursViaBehavior.map((tour, index) => (
                  <TouchableOpacity
                    key={tour?.id || `suggest-tour-${index}`}
                    style={styles.tourCard}
                    onPress={() => navigate(`/tour/tourDetail?id=${tour.id}`)}
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
                      <Text style={styles.durationText}>
                        {tour.tourDuration || "3N2D"}
                      </Text>
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
                            ? formatPriceKRW(tour.adultPrice)
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t("home.suggestTours.noTours")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollableLayout>
      <ChatBubble onOpenAIChat={() => setAiChatOpen(true)} />
      <GeminiChatBubble isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </View>
  );
}
