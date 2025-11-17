import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../navigation/navigation";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/theme";
import ScrollableLayout from "../../components/ScrollableLayout";
import {
  getApprovedArticles,
  Article,
} from "../../services/endpoints/articles";
import styles from "./styles";

export default function ArticleList() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderArticleCard = (article: Article) => (
    <TouchableOpacity
      key={article.articleId}
      style={styles.articleCard}
      onPress={() => {
        navigate(`/article/detailArticle?id=${article.articleId}`);
      }}
    >
      <View style={styles.articleImageContainer}>
        <Image
          source={{
            uri: extractFirstImageSrc(article.articleContent) || "",
            cache: "force-cache",
          }}
          style={styles.articleImage}
          resizeMode="cover"
          fadeDuration={0}
        />
      </View>
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {article.articleTitle}
        </Text>
        <Text style={styles.articleSummary} numberOfLines={3}>
          {article.articleDescription}
        </Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleDate}>
            {formatDate(article.articleCreatedDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate("/home")}
          >
            <Ionicons name="arrow-back" size={24} color="#212529" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("article.title")}</Text>
          <View style={styles.headerRight} />
        </View>

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
          {articles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#C0C0C0" />
              <Text style={styles.emptyTitle}>{t("article.noArticles")}</Text>
              <Text style={styles.emptyDescription}>
                {t("article.noArticlesDescription")}
              </Text>
            </View>
          ) : (
            <View style={styles.articlesList}>
              {articles.map(renderArticleCard)}
            </View>
          )}
        </ScrollView>
      </View>
    </ScrollableLayout>
  );
}
