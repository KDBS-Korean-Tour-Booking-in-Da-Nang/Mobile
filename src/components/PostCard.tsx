import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PostResponse,
  CommentResponse,
  addReaction,
  removeReaction,
  getReactionSummary,
  savePost,
  unsavePost,
  checkPostSaved,
  getCommentsByPost,
  createReport,
} from "../endpoints/forum";
import ReportModal from "./ReportModal";
import { useAuthContext } from "../contexts/authContext";
import CommentSection from "./CommentSection";
import { useTranslation } from "react-i18next";

interface PostCardProps {
  post: PostResponse;
  onPostUpdated?: (post: PostResponse) => void;
  onPostDeleted?: (postId: number) => void;
  onEdit?: (post: PostResponse) => void;
  onLoadFullDetails?: (postId: number) => void;
}

const { width } = Dimensions.get("window");

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onEdit,
  onLoadFullDetails,
}) => {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(post.userReaction === "LIKE");
  const [isDisliked, setIsDisliked] = useState(post.userReaction === "DISLIKE");
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [dislikeCount, setDislikeCount] = useState(post.dislikeCount);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hasReported, setHasReported] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Load full post details if missing images or hashtags (for saved posts)
  useEffect(() => {
    if (
      onLoadFullDetails &&
      post.imageUrls.length === 0 &&
      post.hashtags.length === 0
    ) {
      onLoadFullDetails(post.id);
    }
  }, [post.id, post.imageUrls.length, post.hashtags.length, onLoadFullDetails]);

  // Since we don't have userEmail from backend, we'll use username comparison
  // This is not perfect but works for now without changing backend
  const isOwner =
    (user?.username || "").trim().toLowerCase() ===
    (post.username || "").trim().toLowerCase();

  const checkIfSaved = useCallback(async () => {
    try {
      const saved = await checkPostSaved(post.id);
      setIsSaved(saved);
    } catch {}
  }, [post.id]);

  useEffect(() => {
    checkIfSaved();
    // Load fresh reaction summary from backend to persist across reloads
    (async () => {
      try {
        const summary = await getReactionSummary(post.id, "POST", user?.email);
        if (summary) {
          setLikeCount(summary.likeCount || 0);
          setDislikeCount(summary.dislikeCount || 0);
          setIsLiked(summary.userReaction === "LIKE");
          setIsDisliked(summary.userReaction === "DISLIKE");
        }
      } catch {}
    })();
    // Load reported status from local cache to prevent duplicate reports
    (async () => {
      try {
        if (user?.email) {
          const key = `reported:post:${post.id}:${user.email}`;
          const val = await AsyncStorage.getItem(key);
          setHasReported(val === "1");
        } else {
          setHasReported(false);
        }
      } catch {}
    })();
  }, [checkIfSaved, post.id, user?.email]);

  // Ensure comment count is populated after reload
  useEffect(() => {
    (async () => {
      try {
        const postComments = await getCommentsByPost(post.id);
        setCommentCount(postComments.length || 0);
      } catch {}
    })();
  }, [post.id]);

  const handleReaction = async (reactionType: "LIKE" | "DISLIKE") => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }

    setIsLoading(true);
    try {
      if (reactionType === "LIKE") {
        if (isLiked) {
          // Remove like
          await removeReaction(post.id, "POST");
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        } else {
          // Add like
          await addReaction({
            targetId: post.id,
            targetType: "POST",
            reactionType: "LIKE",
          });
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);
          try {
            const summary = await getReactionSummary(
              post.id,
              "POST",
              user?.email
            );
            if (summary) {
              setLikeCount(summary.likeCount || 0);
              setDislikeCount(summary.dislikeCount || 0);
            }
          } catch {}

          // If was disliked, remove dislike
          if (isDisliked) {
            setIsDisliked(false);
            setDislikeCount((prev) => Math.max(0, prev - 1));
          }
        }
      } else {
        if (isDisliked) {
          // Remove dislike
          await removeReaction(post.id, "POST");
          setIsDisliked(false);
          setDislikeCount((prev) => Math.max(0, prev - 1));
        } else {
          // Add dislike
          await addReaction({
            targetId: post.id,
            targetType: "POST",
            reactionType: "DISLIKE",
          });
          setIsDisliked(true);
          setDislikeCount((prev) => prev + 1);
          try {
            const summary = await getReactionSummary(
              post.id,
              "POST",
              user?.email
            );
            if (summary) {
              setLikeCount(summary.likeCount || 0);
              setDislikeCount(summary.dislikeCount || 0);
            }
          } catch {}

          // If was liked, remove like
          if (isLiked) {
            setIsLiked(false);
            setLikeCount((prev) => Math.max(0, prev - 1));
          }
        }
      }
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        await unsavePost(post.id);
        setIsSaved(false);
      } else {
        await savePost(post.id);
        setIsSaved(true);
      }
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
    } finally {
      setIsLoading(false);
    }
  };

  const [reportVisible, setReportVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const handleReport = () => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }
    if (hasReported) {
      Alert.alert(t("forum.notificationTitle"), t("forum.reportDuplicate"));
      return;
    }
    setReportVisible(true);
  };

  const submitReport = async (reasons: string[], description: string) => {
    try {
      setReportLoading(true);
      await createReport(
        {
          targetType: "POST",
          targetId: post.id,
          reasons,
          description: description || undefined,
        },
        user!.email
      );
      setReportVisible(false);
      // Mark as reported in local cache
      try {
        const key = `reported:post:${post.id}:${user!.email}`;
        await AsyncStorage.setItem(key, "1");
        setHasReported(true);
      } catch {}
      Alert.alert(t("forum.successTitle"), t("forum.reportSuccess"));
    } catch (error: any) {
      // If backend returns 400 for duplicate report, show friendly message
      const status = error?.response?.status;
      if (status === 400) {
        try {
          const key = `reported:post:${post.id}:${user!.email}`;
          await AsyncStorage.setItem(key, "1");
          setHasReported(true);
        } catch {}
        Alert.alert(t("forum.notificationTitle"), t("forum.reportDuplicate"));
      } else {
        console.error("Error reporting post:", error);
        Alert.alert(t("forum.errorTitle"), t("forum.cannotSendReport"));
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("forum.deletePostTitle"), t("forum.deletePostMessage"), [
      { text: t("forum.cancel"), style: "cancel" },
      {
        text: t("forum.delete"),
        style: "destructive",
        onPress: () => {
          onPostDeleted?.(post.id);
        },
      },
    ]);
  };

  const toggleComments = async () => {
    if (!showComments) {
      try {
        const postComments = await getCommentsByPost(post.id);
        setComments(postComments);
        setCommentCount(postComments.length);
      } catch {
        // Swallow fetch errors to avoid surfacing errors when just opening the comment box
      }
    }
    setShowComments(!showComments);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return t("forum.timeJustNow");
    } else if (diffInHours < 24) {
      return t("forum.timeHoursAgo", { count: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t("forum.timeDaysAgo", { count: diffInDays });
    }
  };

  const renderImages = (urls: string[]) => {
    const total = urls.length;
    // Card marginHorizontal:16 and padding:16 → available width = width - 32 (margins) - 32 (padding) = width - 64
    const containerWidth = width - 64;

    if (total === 1) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setPreviewIndex(0);
            setPreviewOpen(true);
          }}
        >
          <View
            style={{
              width: containerWidth,
              height: 260,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: urls[0] }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      );
    }

    if (total === 2) {
      return (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {urls.slice(0, 2).map((u, i) => (
            <TouchableOpacity
              key={`${post.id}-img-${i}`}
              activeOpacity={0.9}
              onPress={() => {
                setPreviewIndex(i);
                setPreviewOpen(true);
              }}
            >
              <View
                style={{
                  width: (containerWidth - 6) / 2,
                  height: 220,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: u }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // 3 or more: large row on top (2 images), grid of 3 below (show +N on last)
    const top = urls.slice(0, 2);
    const bottom = urls.slice(2, 5);
    const remaining = total - 5;

    return (
      <View>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
          {top.map((u, i) => (
            <TouchableOpacity
              key={`${post.id}-top-${i}`}
              activeOpacity={0.9}
              onPress={() => {
                setPreviewIndex(i);
                setPreviewOpen(true);
              }}
            >
              <View
                style={{
                  width: (containerWidth - 6) / 2,
                  height: 180,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: u }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {bottom.map((u, i) => (
            <TouchableOpacity
              key={`${post.id}-bot-${i}`}
              activeOpacity={0.9}
              onPress={() => {
                setPreviewIndex(2 + i);
                setPreviewOpen(true);
              }}
            >
              <View
                style={{
                  width: (containerWidth - 12) / 3,
                  height: 110,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: u }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {i === 2 && remaining > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.35)",
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}
                    >{`+${remaining}`}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Function to truncate content to 2 lines
  const getTruncatedContent = (content: string) => {
    const words = content.split(" ");
    const maxWords = 20; // Approximate 2 lines
    if (words.length <= maxWords) return content;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri:
                  post.userAvatar ||
                  "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2F300404237650498609%2F&psig=AOvVaw2FuMEvODdlA_lCA6G3gQp9&ust=1757299985491000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCIiX4t3SxY8DFQAAAAAdAAAAABAE ",
              }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.timestamp}>
                  • {formatDate(post.createdAt)}
                </Text>
              </View>
              <Text style={styles.title}>{post.title}</Text>
            </View>
          </View>

          {/* Menu Button */}
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.body}>
            {showFullContent ? post.content : getTruncatedContent(post.content)}
          </Text>
          {post.content.length > 100 && !showFullContent && (
            <TouchableOpacity onPress={() => setShowFullContent(true)}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          )}
          {showFullContent && post.content.length > 100 && (
            <TouchableOpacity onPress={() => setShowFullContent(false)}>
              <Text style={styles.seeMoreText}>See Less</Text>
            </TouchableOpacity>
          )}

          {/* Hashtags */}
          {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {post.hashtags.map((hashtag, index) => {
                // Convert hashtag to valid format (no spaces, no Vietnamese diacritics)
                const validHashtag = hashtag
                  .toLowerCase()
                  .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
                  .replace(/[èéẹẻẽêềếệểễ]/g, "e")
                  .replace(/[ìíịỉĩ]/g, "i")
                  .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
                  .replace(/[ùúụủũưừứựửữ]/g, "u")
                  .replace(/[ỳýỵỷỹ]/g, "y")
                  .replace(/[đ]/g, "d")
                  .replace(/[^a-z0-9]/g, "")
                  .replace(/\s+/g, "");

                return (
                  <Text
                    key={`${post.id}-hashtag-${index}-${hashtag}`}
                    style={styles.hashtag}
                  >
                    #{validHashtag}
                  </Text>
                );
              })}
            </View>
          )}

          {/* Images */}
          {Array.isArray(post.imageUrls) && post.imageUrls.length > 0 && (
            <View style={styles.imagesContainer}>
              {renderImages(post.imageUrls)}
            </View>
          )}
        </View>

        {/* Menu Dropdown */}
        {showMenu && (
          <View style={styles.menuDropdown}>
            {isOwner ? (
              // Owner menu options
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onEdit?.(post);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#666" />
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleSave();
                  }}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={isSaved ? "#007AFF" : "#666"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isSaved && styles.menuItemTextActive,
                    ]}
                  >
                    {isSaved ? "Unsave" : "Save"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  <Text style={styles.menuItemTextDanger}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Non-owner menu options
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleSave();
                  }}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={isSaved ? "#007AFF" : "#666"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isSaved && styles.menuItemTextActive,
                    ]}
                  >
                    {isSaved ? "Unsave" : "Save"}
                  </Text>
                </TouchableOpacity>
                {!isOwner && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemDanger]}
                    onPress={() => {
                      setShowMenu(false);
                      handleReport();
                    }}
                  >
                    <Ionicons name="flag-outline" size={18} color="#ff4444" />
                    <Text style={styles.menuItemTextDanger}>Report</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("LIKE")}
            disabled={isLoading}
          >
            <Ionicons
              name={isLiked ? "arrow-up" : "arrow-up-outline"}
              size={20}
              color={isLiked ? "#007AFF" : "#666"}
            />
            <Text style={[styles.actionText, isLiked && { color: "#007AFF" }]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("DISLIKE")}
            disabled={isLoading}
          >
            <Ionicons
              name={isDisliked ? "arrow-down" : "arrow-down-outline"}
              size={20}
              color={isDisliked ? "#ff4444" : "#666"}
            />
            <Text
              style={[styles.actionText, isDisliked && { color: "#ff4444" }]}
            >
              {dislikeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleComments}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={post.id}
            comments={comments}
            onCommentAdded={(comment) => {
              setComments((prev) => [...prev, comment]);
              setCommentCount((prev) => prev + 1);
            }}
            onCommentUpdated={(updatedComment) => {
              setComments((prev) =>
                prev.map((c) =>
                  c.forumCommentId === updatedComment.forumCommentId
                    ? updatedComment
                    : c
                )
              );
            }}
            onCommentDeleted={(commentId) => {
              setComments((prev) =>
                prev.filter((c) => c.forumCommentId !== commentId)
              );
              setCommentCount((prev) => Math.max(0, prev - 1));
            }}
          />
        )}

        {/* Report Modal */}
        <ReportModal
          visible={reportVisible}
          onSubmit={submitReport}
          onCancel={() => setReportVisible(false)}
          loading={reportLoading}
        />

        {previewOpen && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.95)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: width * previewIndex, y: 0 }}
              style={{ flexGrow: 0 }}
            >
              {post.imageUrls.map((img, idx) => (
                <View
                  key={`${post.id}-prev-${idx}`}
                  style={{
                    width,
                    height: Dimensions.get("window").height,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={{ uri: img }}
                    style={{ width, height: Dimensions.get("window").height }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPreviewOpen(false)}
              style={{ position: "absolute", top: 40, right: 20, padding: 8 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  menuDropdown: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  menuItemTextActive: {
    color: "#007AFF",
  },
  menuItemTextDanger: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ff4444",
    flex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  body: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  seeMoreText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginTop: 4,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  hashtag: {
    fontSize: 12,
    color: "#000000",
    backgroundColor: "#a1d3ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  imagesContainer: {
    marginTop: 8,
  },
  postImage: {
    width: width - 64,
    height: 220,
    borderRadius: 12,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

export default PostCard;
