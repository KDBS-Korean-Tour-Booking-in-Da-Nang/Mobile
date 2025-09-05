import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "../../src/navigation";
import { useFocusEffect } from "expo-router";
import { useAuthContext } from "../../src/contexts/authContext";
import {
  getAllPosts,
  searchPosts,
  PostResponse,
} from "../../src/endpoints/forum";
import { getAllUsers, UserResponse } from "../../src/endpoints/users";
import PostCard from "../../src/components/PostCard";
import { colors, spacing, borderRadius } from "../../src/constants/theme";

// Component for displaying a single user suggestion
const SuggestionCard = ({ user }: { user: UserResponse }) => (
  <View style={styles.suggestionCard}>
    <View style={styles.suggestionAvatar} />
    <View style={styles.suggestionInfo}>
      <Text style={styles.suggestionUsername}>{user.username}</Text>
      <Text style={styles.suggestionRole}>{user.role}</Text>
    </View>
    <TouchableOpacity style={styles.followButton}>
      <Text style={styles.followButtonText}>Theo dõi</Text>
    </TouchableOpacity>
  </View>
);

export default function Forum() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();

  const { user, loading: authLoading } = useAuthContext(); // Use auth loading state
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [filteredHashtags, setFilteredHashtags] = useState<string[]>([]);

  const fetchData = async () => {
    // Ensure user context is available before fetching
    if (!user) return;

    if (!refreshing) {
      setDataLoading(true);
    }

    try {
      const [fetchedPosts, fetchedUsers] = await Promise.all([
        selectedHashtag
          ? searchPosts({ hashtags: [selectedHashtag] })
          : searchQuery.trim()
          ? searchPosts({ keyword: searchQuery.trim() })
          : getAllPosts(),
        getAllUsers(),
      ]);

      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
      const users = Array.isArray(fetchedUsers) ? fetchedUsers : [];

      setSuggestedUsers(
        users.filter((u) => u.email !== user.email).slice(0, 5)
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setPosts([]);
      setSuggestedUsers([]);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Fetch data when the screen is focused
      if (!authLoading && user) {
        fetchData();
      } else if (!authLoading && !user) {
        setDataLoading(false);
      }
    }, [authLoading, user]) // Dependencies for the effect
  );

  const handleSearch = () => {
    fetchData();
  };

  const handleHashtagSelect = (tag: string) => {
    setSelectedHashtag(tag);
    setHashtagQuery(tag);
    setFilteredHashtags([]);
    setSearchQuery("");
    fetchData();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [searchQuery, selectedHashtag, user]);

  const hashtagList = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      (p.hashtags || []).forEach((h) => {
        const key = h.trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const all = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { counts, all };
  }, [posts]);

  useEffect(() => {
    if (!hashtagQuery) {
      setFilteredHashtags([]);
      return;
    }
    const lower = hashtagQuery.toLowerCase();
    setFilteredHashtags(
      hashtagList.all.filter((h) => h.toLowerCase().includes(lower)).slice(0, 8)
    );
  }, [hashtagQuery, hashtagList.all]);

  if (authLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary.main}
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("forum.title")}</Text>
        <TouchableOpacity onPress={() => navigate("/userProfile")}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatar} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <>
            {/* Create Post Input */}
            <TouchableOpacity
              style={styles.createPostContainer}
              onPress={() => navigate("/createPost")}
            >
              <View style={styles.avatar} />
              <Text style={styles.createPostInput}>
                {t("forum.placeholderCreatePost")}
              </Text>
            </TouchableOpacity>

            {/* Search & Suggestions */}
            <View style={styles.sideBarContainer}>
              <View style={styles.searchContainer}>
                <TextInput
                  placeholder={t("forum.searchPlaceholder")}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch}>
                  <Ionicons
                    name="search"
                    size={24}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.trendingContainer}>
                <Text style={styles.sectionTitle}>{t("forum.trending")}</Text>
                <Text style={styles.comingSoonText}>
                  {t("forum.comingSoon")}
                </Text>
              </View>

              {/* Popular Hashtags */}
              <View style={styles.trendingContainer}>
                <Text style={styles.sectionTitle}>Hashtags</Text>
                <View style={styles.hashtagsWrap}>
                  {hashtagList.all.slice(0, 10).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => handleHashtagSelect(tag)}
                      style={styles.hashtagChip}
                    >
                      <Text style={styles.hashtagChipText}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Hashtag search */}
              <View style={{ marginBottom: spacing.lg }}>
                <View style={styles.searchContainer}>
                  <TextInput
                    placeholder="#hashtag..."
                    style={styles.searchInput}
                    value={hashtagQuery}
                    onChangeText={setHashtagQuery}
                    onSubmitEditing={() =>
                      hashtagQuery &&
                      handleHashtagSelect(hashtagQuery.replace(/^#/, ""))
                    }
                    returnKeyType="search"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      hashtagQuery &&
                      handleHashtagSelect(hashtagQuery.replace(/^#/, ""))
                    }
                  >
                    <Ionicons
                      name="pricetag"
                      size={22}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
                {filteredHashtags.length > 0 && (
                  <View style={styles.dropdown}>
                    {filteredHashtags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => handleHashtagSelect(tag)}
                        style={styles.dropdownItem}
                      >
                        <Text style={styles.dropdownText}>#{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.suggestionsContainer}>
                <Text style={styles.sectionTitle}>
                  {t("forum.friendSuggestions")}
                </Text>
                {suggestedUsers.map((u) => (
                  <SuggestionCard key={u.userId} user={u} />
                ))}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          dataLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary.main}
              style={{ marginTop: 50 }}
            />
          ) : (
            <Text style={styles.emptyText}>{t("forum.emptyList")}</Text>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.medium,
  },
  createPostContainer: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.medium,
    marginRight: spacing.md,
  },
  createPostInput: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  sideBarContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 8,
    borderBottomColor: colors.background.secondary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  trendingContainer: {
    marginBottom: spacing.lg,
  },
  suggestionsContainer: {},
  hashtagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm as any,
  },
  hashtagChip: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  hashtagChipText: {
    color: colors.primary.main,
    fontWeight: "600",
  },
  dropdown: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownText: {
    color: colors.text.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: colors.text.secondary,
  },
  comingSoonText: {
    color: colors.text.secondary,
    fontStyle: "italic",
  },
  // Suggestion Card Styles
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.medium,
    marginRight: spacing.md,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionUsername: {
    fontWeight: "bold",
  },
  suggestionRole: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  followButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  followButtonText: {
    color: colors.primary.contrast,
    fontWeight: "bold",
    fontSize: 12,
  },
});
