import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CommentResponse,
  createComment,
  addCommentReaction,
  replyToComment,
  getRepliesByComment,
  updateComment,
  deleteComment,
  createReport,
} from "../endpoints/forum";
import { useAuthContext } from "../contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

interface CommentSectionProps {
  postId: number;
  comments: CommentResponse[];
  onCommentAdded: (comment: CommentResponse) => void;
  onCommentUpdated?: (comment: CommentResponse) => void;
  onCommentDeleted?: (commentId: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}) => {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({});
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [repliesMap, setRepliesMap] = useState<
    Record<number, CommentResponse[]>
  >({});
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [, setHasReportedComment] = useState<Record<number, boolean>>({});

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert(t("forum.errorTitle"), t("forum.contentRequired"));
      return;
    }

    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure a valid token exists before submitting
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert(t("forum.authErrorTitle"), t("forum.sessionExpired"));
        setIsSubmitting(false);
        return;
      }

      // Determine email from persistent storage to match backend user records
      let chosenEmail: string | undefined = user?.email;
      try {
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          if (parsed?.email) {
            chosenEmail = parsed.email;
          }
        }
      } catch {
        // ignore storage errors, fallback to context email
      }

      if (!chosenEmail) {
        Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
        setIsSubmitting(false);
        return;
      }

      const comment = await createComment({
        forumPostId: Number(postId),
        content: newComment.trim(),
        userEmail: chosenEmail,
      });

      onCommentAdded(comment);
      setNewComment("");
    } catch (error: any) {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
    } finally {
      setIsSubmitting(false);
    }
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

  const handleEditComment = (comment: CommentResponse) => {
    setEditingComment(comment.forumCommentId);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editText.trim()) {
      Alert.alert(t("forum.errorTitle"), t("forum.contentRequired"));
      return;
    }

    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
      return;
    }

    try {
      const updatedComment = await updateComment(commentId, {
        forumPostId: postId,
        content: editText.trim(),
        userEmail: user.email,
      });

      onCommentUpdated?.(updatedComment);
      setEditingComment(null);
      setEditText("");
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert(t("forum.delete"), t("forum.deletePostMessage"), [
      { text: t("forum.cancel"), style: "cancel" },
      {
        text: t("forum.delete"),
        style: "destructive",
        onPress: async () => {
          if (!user?.email) {
            Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
            return;
          }
          try {
            await deleteComment(commentId, user.email);
            onCommentDeleted?.(commentId);
          } catch {
            Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
          }
        },
      },
    ]);
  };

  const handleReportComment = async (commentId: number) => {
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
      return;
    }

    // Check if already reported
    const key = `reported:comment:${commentId}:${user.email}`;
    try {
      const reported = await AsyncStorage.getItem(key);
      if (reported === "1") {
        Alert.alert("Thông báo", "Bạn đã báo cáo bình luận này trước đó.");
        return;
      }
    } catch {}

    Alert.alert(t("forum.notificationTitle"), t("forum.cannotSendReport"), [
      { text: t("forum.cancel"), style: "cancel" },
      {
        text: t("forum.submitPost"),
        style: "destructive",
        onPress: async () => {
          try {
            await createReport(
              {
                targetType: "COMMENT",
                targetId: commentId,
                reasons: ["INAPPROPRIATE"],
                description: "Báo cáo bình luận không phù hợp",
              },
              user.email
            );

            // Mark as reported
            try {
              await AsyncStorage.setItem(key, "1");
              setHasReportedComment((prev) => ({
                ...prev,
                [commentId]: true,
              }));
            } catch {}

            Alert.alert(t("forum.successTitle"), t("forum.reportSuccess"));
          } catch (error: any) {
            if (error?.response?.status === 400) {
              try {
                await AsyncStorage.setItem(key, "1");
                setHasReportedComment((prev) => ({
                  ...prev,
                  [commentId]: true,
                }));
              } catch {}
              Alert.alert(
                t("forum.notificationTitle"),
                t("forum.reportDuplicate")
              );
            } else {
              Alert.alert(t("forum.errorTitle"), t("forum.cannotSendReport"));
            }
          }
        },
      },
    ]);
  };

  const isCommentOwner = (comment: CommentResponse) => {
    return user?.username === comment.username;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t("forum.commentsTitle", { count: comments.length })}
      </Text>

      {/* Comments List */}
      <ScrollView
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
      >
        {comments.map((comment) => (
          <View key={comment.forumCommentId} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.username}</Text>
              <View style={styles.commentHeaderRight}>
                <Text style={styles.commentTime}>
                  {formatDate(comment.createdAt)}
                </Text>
                {isCommentOwner(comment) && (
                  <View style={styles.ownerActions}>
                    <TouchableOpacity
                      onPress={() => handleEditComment(comment)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={16} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteComment(comment.forumCommentId)
                      }
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#ff4444"
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {!isCommentOwner(comment) && (
                  <TouchableOpacity
                    onPress={() => handleReportComment(comment.forumCommentId)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="flag-outline" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {editingComment === comment.forumCommentId ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>
                      {t("forum.cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSaveEdit(comment.forumCommentId)}
                    style={[styles.editButton, styles.saveButton]}
                  >
                    <Text
                      style={[styles.editButtonText, styles.saveButtonText]}
                    >
                      {t("forum.save")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.commentContent}>{comment.content}</Text>
            )}
            {comment.imgPath && (
              <Image
                source={{ uri: comment.imgPath }}
                style={styles.commentImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={async () => {
                  if (!user?.email) {
                    Alert.alert(t("forum.errorTitle"), t("forum.loginToLike"));
                    return;
                  }
                  const isLiked = !!likedMap[comment.forumCommentId];
                  try {
                    if (!isLiked) {
                      await addCommentReaction(
                        comment.forumCommentId,
                        "LIKE",
                        user.email
                      );
                      comment.react = (comment.react || 0) + 1;
                      setLikedMap((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: true,
                      }));
                    } else {
                      // toggle off by calling same endpoint (backend toggles)
                      await addCommentReaction(
                        comment.forumCommentId,
                        "LIKE",
                        user.email
                      );
                      comment.react = Math.max(0, (comment.react || 0) - 1);
                      setLikedMap((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: false,
                      }));
                    }
                  } catch {}
                }}
              >
                <Ionicons
                  name={
                    likedMap[comment.forumCommentId] ? "heart" : "heart-outline"
                  }
                  size={16}
                  color={likedMap[comment.forumCommentId] ? "#ff4444" : "#666"}
                />
                <Text style={styles.commentActionText}>
                  {comment.react || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={async () => {
                  if (!user?.email) {
                    Alert.alert(t("forum.errorTitle"), t("forum.loginToReply"));
                    return;
                  }
                  // Cross-platform behavior: open inline reply box under comment
                  const isOpen = !!replyOpen[comment.forumCommentId];
                  setReplyOpen((prev) => ({
                    ...prev,
                    [comment.forumCommentId]: true,
                  }));
                  // Lazy load replies on first open
                  if (!isOpen && !repliesMap[comment.forumCommentId]) {
                    try {
                      const data = await getRepliesByComment(
                        comment.forumCommentId
                      );
                      setRepliesMap((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: data,
                      }));
                    } catch {}
                  }
                }}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentAction}
                onPress={async () => {
                  const isOpen = !!replyOpen[comment.forumCommentId];
                  setReplyOpen((prev) => ({
                    ...prev,
                    [comment.forumCommentId]: !isOpen,
                  }));
                  if (!isOpen && !repliesMap[comment.forumCommentId]) {
                    try {
                      const data = await getRepliesByComment(
                        comment.forumCommentId
                      );
                      setRepliesMap((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: data,
                      }));
                    } catch {}
                  }
                }}
              >
                <Ionicons
                  name={
                    replyOpen[comment.forumCommentId]
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={16}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {replyOpen[comment.forumCommentId] && (
              <View style={styles.repliesContainer}>
                {(repliesMap[comment.forumCommentId] || []).map((reply) => (
                  <View key={reply.forumCommentId} style={styles.replyItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{reply.username}</Text>
                      <Text style={styles.commentTime}>
                        {formatDate(reply.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{reply.content}</Text>
                  </View>
                ))}
                <View style={styles.replyInputRow}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder={t("forum.writeReplyPlaceholder")}
                    value={replyDraft[comment.forumCommentId] || ""}
                    onChangeText={(t) =>
                      setReplyDraft((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: t,
                      }))
                    }
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.replySend}
                    onPress={async () => {
                      const text = (
                        replyDraft[comment.forumCommentId] || ""
                      ).trim();
                      if (!text) return;
                      if (!user?.email) {
                        Alert.alert("Lỗi", "Vui lòng đăng nhập để trả lời");
                        return;
                      }
                      try {
                        const newReply = await replyToComment({
                          forumPostId: Number(postId),
                          content: text,
                          userEmail: user.email!,
                          parentCommentId: comment.forumCommentId,
                        });
                        setRepliesMap((prev) => ({
                          ...prev,
                          [comment.forumCommentId]: [
                            newReply,
                            ...(prev[comment.forumCommentId] || []),
                          ],
                        }));
                        setReplyDraft((prev) => ({
                          ...prev,
                          [comment.forumCommentId]: "",
                        }));
                      } catch {
                        Alert.alert("Lỗi", "Không thể gửi trả lời");
                      }
                    }}
                  >
                    <Ionicons name="send" size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Comment */}
      <View style={styles.addCommentContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder={t("forum.writeCommentPlaceholder")}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!newComment.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          <Ionicons
            name="send"
            size={20}
            color={!newComment.trim() || isSubmitting ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  commentsList: {
    maxHeight: 200,
  },
  commentItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerActions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
  },
  commentContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#f0f0f0",
  },
  replyItem: {
    marginTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fafafa",
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    marginRight: 6,
  },
  replySend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  editButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
  },
});

export default CommentSection;
