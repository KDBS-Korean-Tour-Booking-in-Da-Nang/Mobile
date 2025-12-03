import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "../../../navigation/navigation";
import { useTranslation } from "react-i18next";
import i18n from "../../../localization/i18n";
import ScrollableLayout from "../../../components/ScrollableLayout";
import { getArticleById, Article } from "../../../services/endpoints/articles";
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
    }
  }, [id, loadArticle]);

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
          </View>
        </ScrollView>
      </View>
    </ScrollableLayout>
  );
}
