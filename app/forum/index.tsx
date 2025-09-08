import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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
import SearchBar from "../../src/components/SearchBar";
import MainLayout from "../../src/components/MainLayout";

export default function Forum() {
  const { user, loading: authLoading } = useAuthContext();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPostResponse[]>([]);
  const [viewingSaved, setViewingSaved] = useState(false);
  const [viewingMyPosts, setViewingMyPosts] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState("");

  // Derive popular hashtags from current feed (top 10) and counts
  const hashtagCountEntries = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (!p) return;
      (p.hashtags || []).forEach((h) => {
        const key = (h || "").trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [posts]);

  const popularHashtags = useMemo(
    () => hashtagCountEntries.map(([h]) => h),
    [hashtagCountEntries]
  );
  const popularHashtagCounts = useMemo(
    () => Object.fromEntries(hashtagCountEntries) as Record<string, number>,
    [hashtagCountEntries]
  );

  // User-used hashtags (from posts authored by current user in the feed)
  const myHashtags = useMemo(() => {
    if (!user?.username) return [] as string[];
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p && p.username === user.username) {
        (p.hashtags || []).forEach((h) => {
          if (h && h.trim()) set.add(h);
        });
      }
    });
    return Array.from(set).slice(0, 20);
  }, [posts, user?.username]);

  const unifiedHashtags = useMemo(() => {
    const set = new Set<string>();
    popularHashtags.forEach((h) => set.add(h));
    myHashtags.forEach((h) => set.add(h));
    return Array.from(set);
  }, [popularHashtags, myHashtags]);

  const filteredHashtags = useMemo(() => {
    const base = popularHashtags;
    if (!hashtagQuery.trim()) return base;
    const q = hashtagQuery.trim().toLowerCase();
    return base.filter((h) => h.toLowerCase().includes(q));
  }, [popularHashtags, hashtagQuery]);

  const loadPosts = useCallback(
    async (page: number = 0, keyword: string = "", hashtags: string[] = []) => {
      try {
        if (page === 0) {
          setDataLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await searchPosts({
          keyword: keyword || undefined,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
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

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load saved posts when opening sidebar (lazy)
  useEffect(() => {
    (async () => {
      if (!isSidebarOpen) return;
      if (!user?.email) return;
      try {
        const data = await getMySavedPosts();
        setSavedPosts(data);
      } catch {}
    })();
  }, [isSidebarOpen, user?.email]);

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
      await loadPosts(0, searchQuery, selectedHashtags);
    }
    setRefreshing(false);
  }, [loadPosts, searchQuery, selectedHashtags, viewingSaved, viewingMyPosts]);

  const handleLoadMore = useCallback(async () => {
    if (!isLoadingMore && hasMorePosts && !viewingSaved && !viewingMyPosts) {
      await loadPosts(currentPage + 1, searchQuery, selectedHashtags);
    }
  }, [
    loadPosts,
    currentPage,
    searchQuery,
    selectedHashtags,
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
      loadPosts(0, keyword, selectedHashtags);
      setViewingSaved(false);
      setViewingMyPosts(false);
    },
    [loadPosts, selectedHashtags]
  );

  const handleHashtagFilter = useCallback(
    (hashtags: string[]) => {
      setSelectedHashtags(hashtags);
      setCurrentPage(0);
      setPosts([]); // Clear existing posts before filter
      loadPosts(0, searchQuery, hashtags);
      setViewingSaved(false);
      setViewingMyPosts(false);
      setIsSidebarOpen(false);
    },
    [loadPosts, searchQuery]
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
      setHasMorePosts(false);
      setIsSidebarOpen(false);
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotLoadSavedPosts"));
    }
  }, [savedPosts, user?.email, t]);

  const clearSavedView = useCallback(() => {
    if (viewingSaved) {
      setViewingSaved(false);
      setCurrentPage(0);
      loadPosts(0, searchQuery, selectedHashtags);
    }
  }, [viewingSaved, loadPosts, searchQuery, selectedHashtags]);

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
      setIsSidebarOpen(false);
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotLoadMyPosts"));
    }
  }, [user?.email, t]);

  const clearMyPostsView = useCallback(() => {
    if (viewingMyPosts) {
      setViewingMyPosts(false);
      setCurrentPage(0);
      loadPosts(0, searchQuery, selectedHashtags);
    }
  }, [viewingMyPosts, loadPosts, searchQuery, selectedHashtags]);

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
          {searchQuery || selectedHashtags.length > 0
            ? t("forum.emptyNoMatch")
            : t("forum.emptyPromptFirstShare")}
        </Text>
        {!searchQuery && selectedHashtags.length === 0 && (
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
    <MainLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsSidebarOpen(true)}
          >
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {searchQuery && searchQuery.trim()
              ? t("forum.searchResultsFor", { keyword: searchQuery.trim() })
              : viewingSaved
              ? t("forum.viewingSavedBanner")
              : viewingMyPosts
              ? t("forum.viewingMyPostsBanner")
              : selectedHashtags.length > 0
              ? t("forum.filterHashtagBanner", { hashtag: selectedHashtags[0] })
              : t("forum.title")}
          </Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Search Bar removed (search exists in sidebar) */}

        {/* Create Post Button moved into FlatList header to scroll away */}

        {/* Posts Feed */}
        <FlatList
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={openCreateModal}
            >
              <View style={styles.createPostContent}>
                <Image
                  source={{
                    uri:
                      user?.avatar ||
                      "https://i.pinimg.com/736x/61/62/2e/61622ec8899cffaa687a8342a84ea525.jpg",
                  }}
                  style={styles.userAvatar}
                />
                <Text style={styles.createPostText}>
                  {t("forum.placeholderCreatePost")}
                </Text>
              </View>
              <Ionicons name="camera" size={24} color="#666" />
            </TouchableOpacity>
          }
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
        />

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

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <View style={styles.sidebarOverlay}>
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>{t("forum.explore")}</Text>
                <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Quick search */}
              <View style={{ marginBottom: 12 }}>
                <SearchBar
                  onSearch={(kw) => {
                    setSearchQuery(kw);
                    handleSearch(kw);
                    setViewingSaved(false);
                    setViewingMyPosts(false);
                    setIsSidebarOpen(false);
                  }}
                  onHashtagFilter={() => {}}
                />
              </View>

              {/* Hashtag explorer */}
              <Text style={styles.sidebarSection}>
                {t("forum.featuredHashtags")}
              </Text>
              <View style={{ marginBottom: 8 }}>
                <View style={styles.hashtagSearchBox}>
                  <Ionicons name="search" color="#666" size={16} />
                  <Text style={{ width: 6 }} />
                  <TextInput
                    placeholder={t("forum.searchHashtagPlaceholder")}
                    value={hashtagQuery}
                    onChangeText={setHashtagQuery}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
              <View style={styles.hashtagList}>
                {filteredHashtags.length === 0 && (
                  <Text style={styles.emptySmall}>{t("forum.noHashtag")}</Text>
                )}
                {filteredHashtags.map((h) => (
                  <TouchableOpacity
                    key={`hash-${h}`}
                    style={styles.hashtagPill}
                    onPress={() => {
                      handleHashtagFilter([h]);
                      setViewingSaved(false);
                      setViewingMyPosts(false);
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.hashtagText}>#{h}</Text>
                      <View style={styles.hashtagCountBadge}>
                        <Text style={styles.hashtagCountText}>
                          {popularHashtagCounts[h] ?? 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* My posts */}
              {user && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sidebarSection}>
                    {t("forum.myPosts")}
                  </Text>
                  <TouchableOpacity
                    style={styles.savedBtn}
                    onPress={() => {
                      openMyPosts();
                      setViewingSaved(false);
                    }}
                  >
                    <Ionicons name="person" size={18} color="#007AFF" />
                    <Text style={styles.savedBtnText}>
                      {t("forum.viewMyPosts")}
                    </Text>
                  </TouchableOpacity>
                  {viewingMyPosts && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        clearMyPostsView();
                        setViewingSaved(false);
                      }}
                    >
                      <Text style={styles.clearBtnText}>
                        {t("forum.backToFeed")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Saved posts */}
              {user && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sidebarSection}>
                    {t("forum.savedPosts")}
                  </Text>
                  <TouchableOpacity
                    style={styles.savedBtn}
                    onPress={() => {
                      openSavedPosts();
                      setViewingMyPosts(false);
                    }}
                  >
                    <Ionicons name="bookmark" size={18} color="#007AFF" />
                    <Text style={styles.savedBtnText}>
                      {t("forum.viewSaved")}
                    </Text>
                  </TouchableOpacity>
                  {viewingSaved && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        clearSavedView();
                        setViewingMyPosts(false);
                      }}
                    >
                      <Text style={styles.clearBtnText}>
                        {t("forum.backToFeed")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.overlayBackdrop}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
          </View>
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  contextBanner: {
    backgroundColor: "#eef6ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0ecff",
  },
  contextBannerText: {
    color: "#0366d6",
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  createPostButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createPostContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  createPostText: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  feedContainer: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 999,
    elevation: 999,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sidebar: {
    width: 300,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: "#eee",
    zIndex: 1000,
    elevation: 1000,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  sidebarSection: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 6,
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  hashtagPill: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
  },
  hashtagText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  hashtagCountBadge: {
    marginLeft: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  hashtagCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  hashtagSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptySmall: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  savedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  savedBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  clearBtn: {
    marginTop: 8,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: "#666",
    textDecorationLine: "underline",
  },
});
