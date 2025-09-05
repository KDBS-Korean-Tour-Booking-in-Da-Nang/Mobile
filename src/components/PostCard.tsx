import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { updatePost, deletePost, PostResponse } from "../endpoints/forum";
import { addReaction, clearReaction } from "../endpoints/reactions";
import { useAuthContext } from "../contexts/authContext";
import CommentSection from "./CommentSection";
import EditPostModal from "./EditPostModal";
import ReportModal from "./ReportModal";
import {
  checkIfPostIsSaved,
  savePost as savePostEndpoint,
  unsavePost as unsavePostEndpoint,
} from "../endpoints/savedPosts";
import { createReport } from "../endpoints/reports";
import { colors, spacing } from "../constants/theme";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "vừa xong";
};

type PostCardProps = {
  post: PostResponse;
  onUpdated?: (post: PostResponse) => void;
  onDeleted?: (postId: number) => void;
};

const PostCard = ({ post, onUpdated, onDeleted }: PostCardProps) => {
  const { user } = useAuthContext();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [pending, setPending] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [hashtags, setHashtags] = useState(post.hashtags);
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const toggleCommentSection = () => {
    setIsCommentSectionVisible(!isCommentSectionVisible);
  };

  const handleCommentAdded = () => {
    setCommentCount((c) => c + 1);
  };

  const handleDelete = () => {
    if (!user || user.email !== post.userEmail) return;
    Alert.alert("Xóa bài viết", "Bạn có chắc muốn xóa bài viết này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setPending(true);
          try {
            await deletePost(post.id, user.email);
            setDeleted(true);
            onDeleted?.(post.id);
          } catch (error) {
            console.error("Failed to delete post:", error);
            Alert.alert("Lỗi", "Không thể xóa bài viết. Vui lòng thử lại.");
          } finally {
            setPending(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (!user) return;
    const checkSaved = async () => {
      try {
        const saved = await checkIfPostIsSaved(post.id, user.email);
        setIsSaved(saved);
      } catch (err) {
        // Silently fail is fine, button will just show "Save"
        console.error("Failed to check saved status:", err);
      }
    };
    checkSaved();
  }, [user, post.id]);

  const handleToggleSave = async () => {
    if (!user || savePending) return;

    const wasSaved = isSaved;
    setIsSaved(!wasSaved); // Optimistic update
    setSavePending(true);

    try {
      if (wasSaved) {
        await unsavePostEndpoint(post.id, user.email);
      } else {
        await savePostEndpoint({ postId: post.id }, user.email);
      }
    } catch (error) {
      setIsSaved(wasSaved); // Revert on failure
      console.error("Failed to toggle save:", error);
      Alert.alert("Lỗi", "Không thể lưu bài viết. Vui lòng thử lại.");
    } finally {
      setSavePending(false);
    }
  };

  const handleReport = async (reasons: string[], description: string) => {
    if (!user) return;
    setReportLoading(true);
    try {
      await createReport(user.email, {
        targetId: post.id,
        targetType: "POST",
        reasons,
        description,
      });
      setIsReportVisible(false);
      Alert.alert("Thành công", "Báo cáo của bạn đã được gửi đi.");
    } catch (error) {
      console.error("Failed to submit report:", error);
      Alert.alert("Lỗi", "Không thể gửi báo cáo. Vui lòng thử lại.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleSaveEdit = async (data: {
    title: string;
    content: string;
    hashtags: string[];
  }) => {
    if (!user || user.email !== post.userEmail) return;
    setEditLoading(true);
    try {
      const updatedPost = await updatePost(post.id, {
        ...data,
        userEmail: user.email,
      });
      setTitle(updatedPost.title);
      setContent(updatedPost.content);
      setHashtags(updatedPost.hashtags);
      onUpdated?.(updatedPost);
      setIsEditVisible(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      Alert.alert("Lỗi", "Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setEditLoading(false);
    }
  };

  // In a real app, you'd fetch the user's current reaction state here
  // For simplicity, we'll just manage it locally for now

  const handleReaction = async (reactionType: "LIKE" | "DISLIKE") => {
    if (!user || pending) return;

    const prevReaction = userReaction;
    const prevLikeCount = likeCount;

    // Optimistic UI update
    if (prevReaction === reactionType) {
      // Undo same reaction
      setUserReaction(null);
      if (reactionType === "LIKE") setLikeCount((c) => Math.max(0, c - 1));
    } else {
      // Set new reaction
      setUserReaction(reactionType);
      if (reactionType === "LIKE") {
        // If switching from DISLIKE to LIKE, just add 1
        // If switching from no reaction to LIKE, add 1
        setLikeCount((c) => c + 1);
      } else {
        // switching to DISLIKE
        if (prevReaction === "LIKE") setLikeCount((c) => Math.max(0, c - 1));
      }
    }

    setPending(true);
    try {
      if (prevReaction === reactionType) {
        await clearReaction(user.email, "POST", post.id);
      } else {
        await addReaction(user.email, {
          targetId: post.id,
          targetType: "POST",
          reactionType,
        });
      }
    } catch (error) {
      // Revert on failure
      setUserReaction(prevReaction);
      setLikeCount(prevLikeCount);
      console.error("Failed to submit reaction:", error);
    } finally {
      setPending(false);
    }
  };

  // Defensive check for the entire post object
  if (!post) {
    return null; // Or a placeholder component
  }

  if (deleted) {
    return null; // Don't render if deleted
  }

  const isAuthor = user && user.email === post.userEmail;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.postAvatar} />
          <View style={styles.postHeaderText}>
            <Text style={styles.postUsername}>{post.username}</Text>
            <Text style={styles.postTime}>
              {post.createdAt
                ? formatTimeAgo(post.createdAt)
                : "Không rõ thời gian"}
            </Text>
          </View>
        </View>
        <View style={styles.authorActions}>
          {isAuthor ? (
            <>
              <TouchableOpacity
                onPress={() => setIsEditVisible(true)}
                disabled={pending}
              >
                <Text style={styles.actionText}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} disabled={pending}>
                <Text style={[styles.actionText, styles.deleteText]}>Xóa</Text>
              </TouchableOpacity>
            </>
          ) : (
            user && (
              <TouchableOpacity
                onPress={() => setIsReportVisible(true)}
                disabled={pending}
              >
                <Text style={[styles.actionText, styles.deleteText]}>
                  Báo cáo
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.postContent}>{content}</Text>
      {/* TODO: Render images */}
      <View style={styles.postHashtags}>
        {(hashtags || []).map((tag, index) => (
          <Text key={index} style={styles.hashtag}>
            #{tag}
          </Text>
        ))}
      </View>

      {/* Footer for actions */}
      <View style={styles.postFooter}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("LIKE")}
          >
            <Text
              style={[
                styles.actionText,
                userReaction === "LIKE" && styles.liked,
              ]}
            >
              Thích
            </Text>
          </TouchableOpacity>
          <Text style={styles.countText}>{likeCount}</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("DISLIKE")}
          >
            <Text
              style={[
                styles.actionText,
                userReaction === "DISLIKE" && styles.disliked,
              ]}
            >
              Không thích
            </Text>
          </TouchableOpacity>

          {!isAuthor && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleToggleSave}
              disabled={savePending}
            >
              <Text style={[styles.actionText, isSaved && styles.savedText]}>
                {isSaved ? "Đã lưu" : "Lưu"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.footerComment}
          onPress={toggleCommentSection}
        >
          <Text style={styles.actionText}>{commentCount} bình luận</Text>
        </TouchableOpacity>
      </View>

      {isCommentSectionVisible && (
        <CommentSection postId={post.id} onAdded={handleCommentAdded} />
      )}

      <EditPostModal
        visible={isEditVisible}
        initialTitle={title}
        initialContent={content}
        initialHashtags={hashtags}
        onSave={handleSaveEdit}
        onCancel={() => setIsEditVisible(false)}
        loading={editLoading}
      />

      <ReportModal
        visible={isReportVisible}
        onSubmit={handleReport}
        onCancel={() => setIsReportVisible(false)}
        loading={reportLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorActions: {
    flexDirection: "row",
    gap: spacing.md as any,
  },
  deleteText: {
    color: colors.error.main,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border.medium,
    marginRight: spacing.md,
  },
  postHeaderText: {},
  postUsername: {
    fontWeight: "bold",
    fontSize: 16,
  },
  postTime: {
    color: colors.text.secondary,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  postHashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  hashtag: {
    color: colors.primary.main,
    marginRight: spacing.md,
    fontWeight: "500",
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    color: colors.text.secondary,
    fontWeight: "600",
  },
  countText: {
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },
  footerComment: {},
  liked: {
    color: colors.primary.main,
    fontWeight: "bold",
  },
  disliked: {
    color: colors.error.main,
    fontWeight: "bold",
  },
  savedText: {
    color: colors.secondary.main, // Or another color you prefer for saved items
    fontWeight: "bold",
  },
});

export default PostCard;
