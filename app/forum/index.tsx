import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Platform,
  Animated,
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
import styles from "./styles";
import MainLayout from "../../src/components/MainLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Forum() {
  const insets = useSafeAreaInsets();
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

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;
  const flatListRef = useRef<FlatList>(null);
  const buttonAnimation = useRef(new Animated.Value(1)).current;

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
    }, [authLoading, user, loadPosts])
  );

  const scrollToPost = useCallback(
    (postId: number) => {
      if (flatListRef.current && posts.length > 0) {
        const postIndex = posts.findIndex((post) => post.id === postId);
        if (postIndex !== -1) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: postIndex,
              animated: true,
              viewPosition: 0.5,
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

  useEffect(() => {
    if (targetPostId && posts.length > 0 && !dataLoading) {
      scrollToPost(targetPostId);
    }
  }, [targetPostId, posts, dataLoading, scrollToPost]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(0);
    if (viewingSaved) {
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
      const data = await getMyPosts(0, 50);
      setPosts(data);
    } else {
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
      const exists = prev.some((p) => p.id === newPost.id);
      if (exists) return prev;
      return [newPost, ...prev];
    });
    setShowCreateModal(false);
    setEditingPost(null);
  }, []);

  const handlePostUpdated = useCallback((updatedPost: PostResponse) => {
    setPosts((prev) => {
      const filteredPosts = prev.filter((post) => post.id !== updatedPost.id);
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
        if (false as any) {
          Alert.alert(t("forum.authErrorTitle"), t("forum.sessionExpired"), [
            {
              text: t("forum.relogin"),
              onPress: () => {
                AsyncStorage.removeItem("authToken");
                AsyncStorage.removeItem("userData");
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
      const data = await getMyPosts(0, 50);
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

  const generateSearchSuggestions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchSuggestions([]);
        return;
      }

      const suggestions: string[] = [];
      const queryLower = query.toLowerCase();

      const hashtags = new Set<string>();
      posts.forEach((post) => {
        post.hashtags?.forEach((tag) => {
          if (tag.toLowerCase().includes(queryLower)) {
            hashtags.add(`#${tag}`);
          }
        });
      });

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

      suggestions.push(...Array.from(hashtags).slice(0, 3));
      suggestions.push(...Array.from(words).slice(0, 5));

      setSearchSuggestions(suggestions.slice(0, 8));
    },
    [posts]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      if (scrollDifference > scrollThreshold) {
        if (currentScrollY > lastScrollY.current) {
          setIsNavVisible(false);
          Animated.timing(buttonAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          setIsNavVisible(true);
          Animated.timing(buttonAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
        lastScrollY.current = currentScrollY;
      }
    },
    [buttonAnimation]
  );

  const loadFullPostDetails = useCallback(async (postId: number) => {
    try {
      const fullPost = await getPostById(postId);
      setPosts((prev) => {
        return prev.map((p) => (p.id === postId ? fullPost : p));
      });
    } catch (error) {
      
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
    <MainLayout isNavVisible={isNavVisible}>
      <TouchableWithoutFeedback onPress={() => setShowSearchDropdown(false)}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#6c757d" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("forum.searchPlaceholder")}
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
                {t("forum.myPosts")}
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
                {t("forum.savedPosts")}
              </Text>
            </TouchableOpacity>
          </View>

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
              
            }}
          />

          <Animated.View
            style={[
              styles.createPostButton,
              {
                bottom: insets.bottom + (Platform.OS === "android" ? 140 : 60),
                opacity: buttonAnimation,
                transform: [
                  {
                    translateY: buttonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={openCreateModal}
            >
              <Text style={styles.createPostButtonText}>
                {t("forum.createPost")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

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
