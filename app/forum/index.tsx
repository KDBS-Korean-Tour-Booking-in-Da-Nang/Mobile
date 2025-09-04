import React, { useState, useCallback, useEffect } from "react";
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
import { useNavigation } from "../../src/navigation";
import { useFocusEffect } from "expo-router";
import { useAuthContext } from "../../src/contexts/authContext";
import forumService, { PostResponse } from "../../src/services/forumService";
import userService, { UserResponse } from "../../src/services/userService";
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

  const { user, loading: authLoading } = useAuthContext(); // Use auth loading state
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    // Ensure user context is available before fetching
    if (!user) return;

    if (!refreshing) {
      setDataLoading(true);
    }

    try {
      const [fetchedPosts, fetchedUsers] = await Promise.all([
        searchQuery.trim()
          ? forumService.searchPosts({ keyword: searchQuery.trim() })
          : forumService.getAllPosts(),
        userService.getAllUsers(),
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [searchQuery, user]);

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
        <Text style={styles.headerTitle}>Diễn đàn</Text>
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
              <Text style={styles.createPostInput}>Bạn đang nghĩ gì?</Text>
            </TouchableOpacity>

            {/* Search & Suggestions */}
            <View style={styles.sideBarContainer}>
              <View style={styles.searchContainer}>
                <TextInput
                  placeholder="Tìm kiếm bài viết..."
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
                <Text style={styles.sectionTitle}>Xu hướng</Text>
                <Text style={styles.comingSoonText}>
                  Tính năng này sẽ sớm ra mắt.
                </Text>
              </View>

              <View style={styles.suggestionsContainer}>
                <Text style={styles.sectionTitle}>Gợi ý kết bạn</Text>
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
            <Text style={styles.emptyText}>Không tìm thấy bài viết nào.</Text>
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
