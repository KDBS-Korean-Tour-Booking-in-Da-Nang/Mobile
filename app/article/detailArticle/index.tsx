import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "../../../navigation/navigation";
import { useTranslation } from "react-i18next";
import i18n from "../../../localization/i18n";
import ScrollableLayout from "../../../components/ScrollableLayout";
import { getArticleById, Article } from "../../../services/endpoints/articles";
import { articleCommentEndpoints } from "../../../services/endpoints/articleComments";
import { ArticleCommentResponse } from "../../../src/types/response/articleComment.response";
import { useAuthContext } from "../../../src/contexts/authContext";
import styles, { contentHtmlCss } from "./style";
import { WebView } from "react-native-webview";

// Helper function to get article fields based on current language
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
    // Vietnamese (default)
    return {
      title: article.articleTitle,
      description: article.articleDescription,
      content: article.articleContent,
    };
  }
};

export default function ArticleDetail() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [comments, setComments] = useState<ArticleCommentResponse[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuthContext();

  // Load comments from API (only comments, no replies)
  const loadComments = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      return;
    }

    setLoadingComments(true);
    try {
      const response = await articleCommentEndpoints.getCommentsByArticleId(
        Number(id)
      );
      // Filter to only show comments (no replies - parentCommentId is null)
      const commentsOnly = (response.data || []).filter(
        (comment) => !comment.parentCommentId
      );
      setComments(commentsOnly);
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    setArticle(null);
    setLoading(true);
  }, [id]);

  const buildHtmlContent = (html: string) => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1\" />
    <style>
      ${contentHtmlCss}
    </style>
  </head>
  <body>
    <div class=\"container\">${html}</div>
    <script>
      function postHeight() {
        var height = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(height));
      }
      setTimeout(postHeight, 0);
      window.addEventListener('load', postHeight);
      new ResizeObserver(postHeight).observe(document.body);
    </script>
  </body>
</html>`;
  };

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);

      if (!id || isNaN(Number(id))) {
        return;
      }

      const articleData = await getArticleById(Number(id));
      setArticle(articleData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadArticle();
      loadComments();
    }
  }, [id, loadArticle, loadComments]);

  // Track language changes
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
    // Map language to locale
    const localeMap: Record<string, string> = {
      vi: "vi-VN",
      en: "en-US",
      ko: "ko-KR",
    };
    const locale = localeMap[currentLang] || "vi-VN";

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCommentDate = (dateString: string) => {
    if (!dateString) {
      return t("article.comment.justNow") || "Vừa xong";
    }

    try {
      // Handle LocalDateTime format from backend (e.g., "2025-12-06T16:52:20")
      // If no timezone is specified, parse as local time
      let date: Date;
      if (dateString.includes("T") && !dateString.includes("Z") && !dateString.includes("+") && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
        // Parse LocalDateTime as local time
        const parts = dateString.split("T");
        if (parts.length === 2) {
          const [year, month, day] = parts[0].split("-").map(Number);
          const timePart = parts[1].split(".")[0]; // Remove milliseconds if present
          const [hour, minute, second] = timePart.split(":").map(Number);
          date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      // Check if date is valid
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
        return t("article.comment.hoursAgo", { hours: diffInHours }) || `${diffInHours} giờ trước`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return t("article.comment.daysAgo", { days: diffInDays }) || `${diffInDays} ngày trước`;
      }
    } catch (error) {
      console.error("Error formatting comment date:", error);
      return t("article.comment.justNow") || "Vừa xong";
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    if (!user?.email) {
      Alert.alert(
        t("common.error") || "Lỗi",
        "Vui lòng đăng nhập để bình luận"
      );
      return;
    }

    if (!article) {
      return;
    }

    setSubmittingComment(true);
    try {
      await articleCommentEndpoints.createComment({
        userEmail: user.email,
        articleId: article.articleId,
        content: commentText.trim(),
      });

      setCommentText("");
      // Reload comments after successful submit
      await loadComments();
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Lỗi",
        error?.response?.data?.message ||
          "Không thể gửi bình luận. Vui lòng thử lại."
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <ScrollableLayout key={`loading-${Array.isArray(id) ? id[0] : id}`}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("article.loading")}</Text>
        </View>
      </ScrollableLayout>
    );
  }

  if (!article) {
    return (
      <ScrollableLayout key={`error-${Array.isArray(id) ? id[0] : id}`}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>{t("article.notFound")}</Text>
          <Text style={styles.errorDescription}>
            {t("article.notFoundDescription")}
          </Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => navigate("/article")}
          >
            <Text style={styles.backToHomeButtonText}>
              {t("article.backToArticles")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollableLayout>
    );
  }

  return (
    <ScrollableLayout key={`${Array.isArray(id) ? id[0] : id}`}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.articleContainer}>
            <View style={styles.articleContent}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.overlayBackButton}
                  onPress={() => navigate("/article")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={22} color="#212529" />
                </TouchableOpacity>
                <Text
                  style={[styles.articleTitle, { flex: 1 }]}
                  numberOfLines={2}
                >
                  {getArticleFields(article, currentLang).title}
                </Text>
              </View>

              <View style={styles.articleMeta}>
                <Text style={styles.articleDate}>
                  {formatDate(article.articleCreatedDate)}
                </Text>
              </View>

              <View style={styles.articleBody}>
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: buildHtmlContent(
                      getArticleFields(article, currentLang).content
                    ),
                  }}
                  onMessage={(e) => {
                    const nextHeight = Number(e.nativeEvent.data) || 0;
                    if (!Number.isNaN(nextHeight)) {
                      setContentHeight(nextHeight);
                    }
                  }}
                  style={{
                    width: "100%",
                    height: Math.max(contentHeight, 100),
                    backgroundColor: "transparent",
                  }}
                  automaticallyAdjustContentInsets={false}
                  scrollEnabled={false}
                />
              </View>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  {t("article.comment.title") || "Bình luận"} ({comments.length})
                </Text>
              </View>

              {/* Comment Input */}
              <View style={styles.commentInputContainer}>
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={t("article.comment.placeholder") || "Viết bình luận..."}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    (!commentText.trim() || submittingComment) &&
                      styles.commentSubmitButtonDisabled,
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.commentSubmitButtonText,
                        !commentText.trim() &&
                          styles.commentSubmitButtonTextDisabled,
                      ]}
                    >
                      {t("article.comment.submit") || "Gửi"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              {loadingComments ? (
                <View style={styles.commentsLoadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.noCommentsContainer}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="#C0C0C0"
                  />
                  <Text style={styles.noCommentsText}>
                    {t("article.comment.noComments") ||
                      "Chưa có bình luận nào. Hãy là người đầu tiên bình luận!"}
                  </Text>
                </View>
              ) : (
                <View style={styles.commentsList}>
                  {comments.map((comment) => (
                    <View
                      key={comment.articleCommentId}
                      style={styles.commentItem}
                    >
                      <View style={styles.commentAvatarContainer}>
                        {comment.userAvatar ? (
                          <Image
                            source={{ uri: comment.userAvatar }}
                            style={styles.commentAvatar}
                          />
                        ) : (
                          <View style={styles.commentAvatarPlaceholder}>
                            <Ionicons
                              name="person"
                              size={20}
                              color="#666"
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUserName}>
                            {comment.username || "Người dùng"}
                          </Text>
                          <Text style={styles.commentDate}>
                            {formatCommentDate(comment.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </ScrollableLayout>
  );
}
