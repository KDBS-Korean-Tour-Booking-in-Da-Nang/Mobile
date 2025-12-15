import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../navigation/navigation";
import { useTranslation } from "react-i18next";
import i18n from "../../localization/i18n";
import ScrollableLayout from "../../components/ScrollableLayout";
import {
  getApprovedArticles,
  Article,
} from "../../services/endpoints/articles";
import { articleCommentEndpoints } from "../../services/endpoints/articleComments";
import { ArticleCommentResponse } from "../../src/types/response/articleComment.response";
import styles from "./styles";

const getArticleFields = (article: Article, lang: string) => {
  const currentLang = lang as "vi" | "en" | "ko";

  if (currentLang === "en") {
    return {
      title: article.articleTitleEN || article.articleTitle,
      description: article.articleDescriptionEN || article.articleDescription,
      content: article.articleContentEN || article.articleContent,
    };
  } else if (currentLang === "ko") {
    return {
      title: article.articleTitleKR || article.articleTitle,
      description: article.articleDescriptionKR || article.articleDescription,
      content: article.articleContentKR || article.articleContent,
    };
  } else {

    return {
      title: article.articleTitle,
      description: article.articleDescription,
      content: article.articleContent,
    };
  }
};

export default function ArticleList() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [searchQuery, setSearchQuery] = useState("");
  const [articleComments, setArticleComments] = useState<
    Record<number, ArticleCommentResponse[]>
  >({});

  const loadCommentsForArticle = useCallback(async (articleId: number) => {
    try {
      const response = await articleCommentEndpoints.getCommentsByArticleId(
        articleId
      );

      const commentsOnly = (response.data || []).filter(
        (comment) => !comment.parentCommentId
      );
      setArticleComments((prev) => {

        if (prev[articleId]) {
          return prev;
        }
        return {
          ...prev,
          [articleId]: commentsOnly,
        };
      });
    } catch (error) {
      console.error(`Error loading comments for article ${articleId}:`, error);
      setArticleComments((prev) => {
        if (prev[articleId]) {
          return prev;
        }
        return {
          ...prev,
          [articleId]: [],
        };
      });
    }
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const articles = await getApprovedArticles();
      setArticles(articles || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles();
    setRefreshing(false);
  };

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (articles.length > 0) {
      articles.forEach((article) => {
        loadCommentsForArticle(article.articleId);
      });
    }

  }, [articles]);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const formatDate = (dateString: string) => {
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

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return articles;
    }

    const query = searchQuery.toLowerCase().trim();
    return articles.filter((article) => {
      const fields = getArticleFields(article, currentLang);
      const title = (fields.title || "").toLowerCase();
      const description = (fields.description || "").toLowerCase();

      return title.includes(query) || description.includes(query);
    });
  }, [articles, searchQuery, currentLang]);

  const formatCommentDate = (dateString: string) => {
    if (!dateString) {
      return t("article.comment.justNow") || "Vừa xong";
    }

    try {
      let date: Date;

      if (
        dateString.includes("T") &&
        !dateString.includes("Z") &&
        !dateString.includes("+") &&
        !dateString.match(/[+-]\d{2}:\d{2}$/)
      ) {
        const parts = dateString.split("T");
        if (parts.length === 2) {
          const [year, month, day] = parts[0].split("-").map(Number);
          const timePart = parts[1].split(".")[0];
          const [hour, minute, second] = timePart.split(":").map(Number);
          date = new Date(
            year,
            month - 1,
            day,
            hour || 0,
            minute || 0,
            second || 0
          );
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return t("article.comment.justNow") || "Vừa xong";
      }

      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInMinutes < 1) {
        return t("article.comment.justNow") || "Vừa xong";
      } else if (diffInHours < 1) {
        return `${diffInMinutes} phút trước`;
      } else if (diffInHours < 24) {
        return (
          t("article.comment.hoursAgo", { hours: diffInHours }) ||
          `${diffInHours} giờ trước`
        );
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return (
          t("article.comment.daysAgo", { days: diffInDays }) ||
          `${diffInDays} ngày trước`
        );
      }
    } catch {
      return t("article.comment.justNow") || "Vừa xong";
    }
  };

  if (loading) {
    return (
      <ScrollableLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("article.loading")}</Text>
        </View>
      </ScrollableLayout>
    );
  }

  return (
    <ScrollableLayout>
      <View
        style={[styles.container, Platform.OS === "ios" && styles.containerIos]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: Platform.OS === "android" ? 36 : 0,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#7A8A99"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  t("article.searchPlaceholder") || "Tìm kiếm bài viết..."
                }
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#7A8A99" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {articles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#C0C0C0" />
              <Text style={styles.emptyTitle}>{t("article.noArticles")}</Text>
              <Text style={styles.emptyDescription}>
                {t("article.noArticlesDescription")}
              </Text>
            </View>
          ) : filteredArticles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#C0C0C0" />
              <Text style={styles.emptyTitle}>
                {t("article.noSearchResults") || "Không tìm thấy kết quả"}
              </Text>
              <Text style={styles.emptyDescription}>
                {t("article.noSearchResultsDescription") ||
                  "Thử tìm kiếm với từ khóa khác"}
              </Text>
            </View>
          ) : (
            <View style={styles.articlesList}>
              {filteredArticles.map((article) => {
                const comments = articleComments[article.articleId] || [];
                const commentCount = comments.length;
                const topComments = comments.slice(0, 3);

                return (
                  <View
                    key={article.articleId}
                    style={styles.articleCardWrapper}
                  >
                    <TouchableOpacity
                      style={styles.articleCard}
                      onPress={() => {
                        navigate(
                          `/article/detailArticle?id=${article.articleId}`
                        );
                      }}
                    >
                      <View style={styles.articleImageContainer}>
                        <Image
                          source={{
                            uri:
                              extractFirstImageSrc(
                                getArticleFields(article, currentLang).content
                              ) || "",
                            cache: "force-cache",
                          }}
                          style={styles.articleImage}
                          resizeMode="cover"
                          fadeDuration={0}
                        />
                      </View>
                      <View style={styles.articleContent}>
                        <Text style={styles.articleTitle} numberOfLines={2}>
                          {getArticleFields(article, currentLang).title}
                        </Text>
                        <Text style={styles.articleSummary} numberOfLines={3}>
                          {getArticleFields(article, currentLang).description}
                        </Text>
                        <View style={styles.articleMeta}>
                          <Text style={styles.articleDate}>
                            {formatDate(article.articleCreatedDate)}
                          </Text>
                          {commentCount > 0 && (
                            <View style={styles.articleMetaRight}>
                              <Ionicons
                                name="chatbubble-outline"
                                size={14}
                                color="#666"
                              />
                              <Text style={styles.articleCommentCount}>
                                {commentCount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {}
                    {topComments.length > 0 && (
                      <View style={styles.articleCommentsPreview}>
                        {topComments.map((comment) => (
                          <View
                            key={comment.articleCommentId}
                            style={styles.commentPreviewItem}
                          >
                            <View style={styles.commentPreviewAvatar}>
                              {comment.userAvatar ? (
                                <Image
                                  source={{ uri: comment.userAvatar }}
                                  style={styles.commentPreviewAvatarImage}
                                />
                              ) : (
                                <Ionicons
                                  name="person"
                                  size={12}
                                  color="#666"
                                />
                              )}
                            </View>
                            <View style={styles.commentPreviewContent}>
                              <Text style={styles.commentPreviewUserName}>
                                {comment.username || "Người dùng"}
                              </Text>
                              <Text
                                style={styles.commentPreviewText}
                                numberOfLines={2}
                              >
                                {comment.content}
                              </Text>
                              <Text style={styles.commentPreviewDate}>
                                {formatCommentDate(comment.createdAt)}
                              </Text>
                            </View>
                          </View>
                        ))}
                        {commentCount > 3 && (
                          <TouchableOpacity
                            style={styles.viewAllCommentsButton}
                            onPress={() => {
                              navigate(
                                `/article/detailArticle?id=${article.articleId}`
                              );
                            }}
                          >
                            <Text style={styles.viewAllCommentsText}>
                              {t("article.comment.viewAll", {
                                count: commentCount,
                              }) || `Xem tất cả ${commentCount} bình luận`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </ScrollableLayout>
  );
}
