import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAuthContext } from "../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
import {
  searchPosts,
  PostResponse,
  deletePost,
  getMySavedPosts,
  SavedPostResponse,
  getPostById,
  getMyPosts,
} from "../../src/endpoints/forum";
import PostCard from "../../src/components/PostCard";
import CreatePostModal from "../../src/components/CreatePostModal";
import MainLayout from "../../src/components/MainLayout";

export default function Forum() {
  const { user, loading: authLoading } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const targetPostId = params.postId ? Number(params.postId) : null;
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPostResponse[]>([]);
  const [viewingSaved, setViewingSaved] = useState(false);
  const [viewingMyPosts, setViewingMyPosts] = useState(false);

  // Navigation scroll effects
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [navPosition, setNavPosition] = useState<"bottom" | "top">("bottom");
  const lastScrollY = useRef(0);
  const scrollDistance = useRef(0);
  const scrollThreshold = 50;
  const flatListRef = useRef<FlatList>(null);

  // Search dropdown
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const loadPosts = useCallback(
    async (page: number = 0, keyword: string = "") => {
      try {
        if (page === 0) {
          setDataLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await searchPosts({
          keyword: keyword || undefined,
          page,
          size: 10,
          sort: "createdAt,desc",
        });

        if (page === 0) {
          setPosts(response);
        } else {
          setPosts((prev) => {
            // Remove duplicates based on post ID
            const existingIds = new Set(prev.map((p) => p.id));
            const newPosts = response.filter((p) => !existingIds.has(p.id));
            const combined = [...prev, ...newPosts];
            return combined;
          });
        }

        setHasMorePosts(response.length === 10);
        setCurrentPage(page);
      } catch {
        Alert.alert(t("forum.errorTitle"), t("forum.cannotLoadPosts"));
      } finally {
        setDataLoading(false);
        setIsLoadingMore(false);
      }
    },
    [t]
  );

  useFocusEffect(
    useCallback(() => {
      // Fetch data when the screen is focused
      if (!authLoading && user) {
        loadPosts();
      } else if (!authLoading && !user) {
        setDataLoading(false);
      }
    }, [authLoading, user, loadPosts]) // Dependencies for the effect
  );

  // Function to scroll to specific post
  const scrollToPost = useCallback(
    (postId: number) => {
      if (flatListRef.current && posts.length > 0) {
        const postIndex = posts.findIndex((post) => post.id === postId);
        if (postIndex !== -1) {
          // Add a small delay to ensure the list is fully rendered
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: postIndex,
              animated: true,
              viewPosition: 0.5, // Center the post in the view
            });
          }, 500);
        }
      }
    },
    [posts]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Scroll to target post when posts are loaded and targetPostId is provided
  useEffect(() => {
    if (targetPostId && posts.length > 0 && !dataLoading) {
      scrollToPost(targetPostId);
    }
  }, [targetPostId, posts, dataLoading, scrollToPost]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(0);
    if (viewingSaved) {
      // Refresh saved posts
      const data = await getMySavedPosts();
      setSavedPosts(data);
      const mapped = (data || [])
        .map((s) => {
          if (!s) return null;
          return {
            id: Number(s.postId),
            title: s.postTitle,
            content: s.postContent,
            username: s.postAuthor,
            userAvatar: s.postAuthorAvatar || "",
            imageUrls: [],
            hashtags: [],
            createdAt: s.postCreatedAt,
            likeCount: 0,
            dislikeCount: 0,
            totalReactions: 0,
            userReaction: null,
            commentCount: 0,
          } as PostResponse;
        })
        .filter((p): p is PostResponse => !!p);
      setPosts(mapped);
    } else if (viewingMyPosts) {
      // Refresh my posts
      const data = await getMyPosts(0, 50);
      setPosts(data);
    } else {
      // Refresh normal feed
      await loadPosts(0, searchQuery);
    }
    setRefreshing(false);
  }, [loadPosts, searchQuery, viewingSaved, viewingMyPosts]);

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingMore && hasMorePosts && !viewingSaved && !viewingMyPosts) {
      await loadPosts(currentPage + 1, searchQuery);
    }
  }, [
    loadPosts,
    currentPage,
    searchQuery,
    isLoadingMore,
    hasMorePosts,
    viewingSaved,
    viewingMyPosts,
  ]);

  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchQuery(keyword);
      setCurrentPage(0);
      setPosts([]); // Clear existing posts before search
      loadPosts(0, keyword);
      setViewingSaved(false);
      setViewingMyPosts(false);
    },
    [loadPosts]
  );

  const handlePostCreated = useCallback((newPost: PostResponse) => {
    setPosts((prev) => {
      // Check if post already exists to avoid duplicates
      const exists = prev.some((p) => p.id === newPost.id);
      if (exists) return prev;
      return [newPost, ...prev];
    });
    setShowCreateModal(false);
    setEditingPost(null);
  }, []);

  const handlePostUpdated = useCallback((updatedPost: PostResponse) => {
    setPosts((prev) => {
      // Remove any existing posts with the same ID to avoid duplicates
      const filteredPosts = prev.filter((post) => post.id !== updatedPost.id);
      // Add the updated post at the beginning
      const newPosts = [updatedPost, ...filteredPosts];
      return newPosts;
    });
    setEditingPost(null);
    setShowCreateModal(false);
  }, []);

  const handlePostDeleted = useCallback(
    async (postId: number) => {
      if (!user?.email) {
        Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
        return;
      }

      // Check token before making request
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userData = await AsyncStorage.getItem("userData");

        if (!token) {
          Alert.alert(t("forum.authErrorTitle"), t("forum.sessionExpired"));
          return;
        }

        if (!userData) {
          Alert.alert(t("forum.errorTitle"), t("forum.userInfoMissing"));
          return;
        }

        // Parse user data to verify
        JSON.parse(userData);
      } catch {
        Alert.alert(t("forum.errorTitle"), t("forum.cannotCheckSession"));
        return;
      }

      try {
        await deletePost(postId, user.email);
        setPosts((prev) => {
          const filtered = prev.filter((post) => post.id !== postId);
          return filtered;
        });
        Alert.alert(t("forum.successTitle"), t("forum.postDeleted"));
      } catch {
        // Check if it's an authentication error
        if (false as any) {
          Alert.alert(t("forum.authErrorTitle"), t("forum.sessionExpired"), [
            {
              text: t("forum.relogin"),
              onPress: () => {
                // Clear stored data and redirect to login
                AsyncStorage.removeItem("authToken");
                AsyncStorage.removeItem("userData");
                // You might want to redirect to login screen here
              },
            },
            { text: t("forum.cancel"), style: "cancel" },
          ]);
        } else {
          Alert.alert(t("forum.errorTitle"), t("forum.cannotDeletePost"));
        }
      }
    },
    [user?.email, t]
  );

  const handleEditPost = useCallback((post: PostResponse) => {
    setEditingPost(post);
    setShowCreateModal(true);
  }, []);

  const openCreateModal = useCallback(() => {
    if (!user) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredCreate"));
      return;
    }
    setEditingPost(null);
    setShowCreateModal(true);
  }, [user, t]);

  const openSavedPosts = useCallback(async () => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }
    try {
      const data = savedPosts.length ? savedPosts : await getMySavedPosts();
      setSavedPosts(data);
      // Convert SavedPostResponse to PostResponse format
      const mapped = (data || [])
        .map((s) => {
          if (!s) return null;
          return {
            id: Number(s.postId),
            title: s.postTitle,
            content: s.postContent,
            username: s.postAuthor,
            userAvatar: s.postAuthorAvatar || "",
            imageUrls: [], // Backend doesn't include images in saved posts response
            hashtags: [], // Backend doesn't include hashtags in saved posts response
            createdAt: s.postCreatedAt,
            likeCount: 0, // Will be updated when post is loaded
            dislikeCount: 0,
            totalReactions: 0,
            userReaction: null,
            commentCount: 0,
          } as PostResponse;
        })
        .filter((p): p is PostResponse => !!p);
      setPosts(mapped);
      setViewingSaved(true);
      setViewingMyPosts(false);
      setHasMorePosts(false);
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotLoadSavedPosts"));
    }
  }, [savedPosts, user?.email, t]);

  const openMyPosts = useCallback(async () => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }
    try {
      const data = await getMyPosts(0, 50); // Load first 50 posts
      setPosts(data);
      setViewingMyPosts(true);
      setViewingSaved(false);
      setHasMorePosts(false);
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotLoadMyPosts"));
    }
  }, [user?.email, t]);

  const clearAllViews = useCallback(() => {
    setViewingMyPosts(false);
    setViewingSaved(false);
    setCurrentPage(0);
    loadPosts(0, searchQuery);
  }, [loadPosts, searchQuery]);

  // Generate search suggestions from posts
  const generateSearchSuggestions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchSuggestions([]);
        return;
      }

      const suggestions: string[] = [];
      const queryLower = query.toLowerCase();

      // Get hashtags from posts
      const hashtags = new Set<string>();
      posts.forEach((post) => {
        post.hashtags?.forEach((tag) => {
          if (tag.toLowerCase().includes(queryLower)) {
            hashtags.add(`#${tag}`);
          }
        });
      });

      // Get words from titles and content
      const words = new Set<string>();
      posts.forEach((post) => {
        const titleWords = post.title?.toLowerCase().split(/\s+/) || [];
        const contentWords = post.content?.toLowerCase().split(/\s+/) || [];

        [...titleWords, ...contentWords].forEach((word) => {
          if (word.length > 2 && word.includes(queryLower)) {
            words.add(word);
          }
        });
      });

      // Combine and limit suggestions
      suggestions.push(...Array.from(hashtags).slice(0, 3));
      suggestions.push(...Array.from(words).slice(0, 5));

      setSearchSuggestions(suggestions.slice(0, 8));
    },
    [posts]
  );

  // Handle scroll for navigation effects
  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      if (scrollDifference > scrollThreshold) {
        if (currentScrollY > lastScrollY.current) {
          // Scrolling down
          scrollDistance.current += scrollDifference;
          if (scrollDistance.current > 300 && navPosition === "bottom") {
            // Move nav to top after scrolling down 300px
            setNavPosition("top");
            setIsNavVisible(true);
          } else if (scrollDistance.current > 100) {
            // Hide nav when scrolling down
            setIsNavVisible(false);
          }
        } else {
          // Scrolling up
          scrollDistance.current = Math.max(
            0,
            scrollDistance.current - scrollDifference
          );
          if (scrollDistance.current < 200 && navPosition === "top") {
            // Move nav back to bottom when scrolling up
            setNavPosition("bottom");
          }
          // Show nav when scrolling up
          setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    },
    [navPosition]
  );

  // Function to load full post details when needed
  const loadFullPostDetails = useCallback(async (postId: number) => {
    try {
      const fullPost = await getPostById(postId);
      setPosts((prev) => {
        return prev.map((p) => (p.id === postId ? fullPost : p));
      });
    } catch (error) {
      console.log("Could not load full post details:", error);
    }
  }, []);

  const renderPost = ({ item }: { item: PostResponse }) => {
    return (
      <PostCard
        post={item}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        onEdit={handleEditPost}
        onLoadFullDetails={loadFullPostDetails}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>{t("forum.loadingMore")}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>{t("forum.emptyList")}</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? t("forum.emptyNoMatch")
            : t("forum.emptyPromptFirstShare")}
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.createFirstPostButton}
            onPress={openCreateModal}
          >
            <Text style={styles.createFirstPostText}>
              {t("forum.createFirstPost")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (authLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t("forum.loadingPosts")}</Text>
      </View>
    );
  }

  return (
    <MainLayout isNavVisible={isNavVisible} navPosition={navPosition}>
      <TouchableWithoutFeedback onPress={() => setShowSearchDropdown(false)}>
        <View style={styles.container}>
          {/* Header with Search Bar */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#6c757d" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for hashtags, keywords"
                  placeholderTextColor="#6c757d"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text.trim() === "") {
                      clearAllViews();
                      setShowSearchDropdown(false);
                    } else {
                      generateSearchSuggestions(text);
                      setShowSearchDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSearchDropdown(true);
                    }
                  }}
                  onSubmitEditing={() => {
                    handleSearch(searchQuery);
                    setShowSearchDropdown(false);
                  }}
                />
              </View>

              {/* Search Dropdown */}
              {showSearchDropdown && searchSuggestions.length > 0 && (
                <View style={styles.searchDropdown}>
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(suggestion.replace("#", ""));
                        handleSearch(suggestion.replace("#", ""));
                        setShowSearchDropdown(false);
                      }}
                    >
                      <Ionicons
                        name={
                          suggestion.startsWith("#") ? "pricetag" : "search"
                        }
                        size={16}
                        color="#6c757d"
                      />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtonsContainer}>
            {(viewingMyPosts || viewingSaved) && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={clearAllViews}
              >
                <Ionicons name="arrow-back" size={24} color="#1088AE" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.navButton,
                viewingMyPosts && styles.navButtonActive,
              ]}
              onPress={() => {
                if (viewingMyPosts) {
                  clearAllViews();
                } else {
                  openMyPosts();
                }
              }}
            >
              <Text
                style={[
                  styles.navButtonText,
                  viewingMyPosts && styles.navButtonTextActive,
                ]}
              >
                My Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, viewingSaved && styles.navButtonActive]}
              onPress={() => {
                if (viewingSaved) {
                  clearAllViews();
                } else {
                  openSavedPosts();
                }
              }}
            >
              <Text
                style={[
                  styles.navButtonText,
                  viewingSaved && styles.navButtonTextActive,
                ]}
              >
                Saved Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Posts Feed */}
          <FlatList
            ref={flatListRef}
            data={(posts || []).filter((p) => p && typeof p.id === "number")}
            renderItem={({ item }) => (item ? renderPost({ item }) : null)}
            keyExtractor={(item, index) => `${item?.id ?? "unknown"}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#007AFF"]}
                tintColor="#007AFF"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              // Handle scroll to index failure
              console.log("Scroll to index failed:", info);
            }}
          />

          {/* Create Post Button - Fixed at Bottom */}
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={openCreateModal}
          >
            <Text style={styles.createPostButtonText}>Create a post</Text>
          </TouchableOpacity>

          {/* Create Post Modal */}
          <CreatePostModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingPost(null);
            }}
            onPostCreated={handlePostCreated}
            editPost={editingPost}
          />
        </View>
      </TouchableWithoutFeedback>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#E3F2FD",
    paddingTop: 35,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchBox: {
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
  searchInput: {
    marginLeft: 12,
    color: "#212529",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  searchDropdown: {
    position: "absolute",
    top: 60,
    left: 0,
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
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#212529",
    flex: 1,
  },
  navButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  navButtonActive: {
    backgroundColor: "#1088AE",
    borderColor: "#1088AE",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  navButtonTextActive: {
    color: "#ffffff",
  },
  createPostButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#1088AE",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  feedContainer: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  createFirstPostButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstPostText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
});
