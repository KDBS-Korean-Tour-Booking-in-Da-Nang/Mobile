import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import forumEndpoints, {
  ForumCommentResponse,
} from "../services/endpoints/forum";
import api from "../services/api";
import { useAuthContext } from "../src/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import geminiEndpoints from "../services/endpoints/gemini";

interface CommentSectionProps {
  postId: number;
  comments: ForumCommentResponse[];
  onCommentAdded: (comment: ForumCommentResponse) => void;
  onCommentUpdated?: (comment: ForumCommentResponse) => void;
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
    Record<number, ForumCommentResponse[]>
  >({});
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [, setHasReportedComment] = useState<Record<number, boolean>>({});
  const [totalCommentCounts, setTotalCommentCounts] = useState<
    Record<number, number>
  >({});
  const [translatedComments, setTranslatedComments] = useState<
    Record<number, string>
  >({});
  const [isTranslatingComments, setIsTranslatingComments] = useState<
    Record<number, boolean>
  >({});
  const [isShowingTranslatedComments, setIsShowingTranslatedComments] =
    useState<Record<number, boolean>>({});

  const toAbsoluteUrl = (path: string): string => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    const base = (api.defaults.baseURL || "").replace(/\/$/, "");
    const origin = base.endsWith("/api") ? base.slice(0, -4) : base;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
  };

  useEffect(() => {
    const hydrateReactionsFromBackend = async () => {
      if (!user?.email || !Array.isArray(comments) || comments.length === 0)
        return;
      const nextMap: Record<number, boolean> = { ...likedMap };
      for (const c of comments) {
        try {
          const response = await forumEndpoints.getCommentReactionSummary(
            c.forumCommentId,
            user.email
          );
          const summary = response.data;
          if (summary) {
            nextMap[c.forumCommentId] = summary.userReaction === "LIKE";
          }
        } catch {}
      }
      setLikedMap(nextMap);
    };
    hydrateReactionsFromBackend();
  }, [comments, user?.email]);

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
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert(t("forum.authErrorTitle"), t("forum.sessionExpired"));
        setIsSubmitting(false);
        return;
      }

      let chosenEmail: string | undefined = user?.email;
      try {
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          if (parsed?.email) {
            chosenEmail = parsed.email;
          }
        }
      } catch {}

      if (!chosenEmail) {
        Alert.alert(t("forum.errorTitle"), t("forum.loginToComment"));
        setIsSubmitting(false);
        return;
      }

      const response = await forumEndpoints.createComment({
        forumPostId: Number(postId),
        content: newComment.trim(),
        userEmail: chosenEmail,
        imgPath: "NO_IMAGE", // Backend requires @NotBlank, use "NO_IMAGE" as placeholder if no image
      });

      onCommentAdded(response.data);
      setNewComment("");
    } catch {
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

  const handleEditComment = (comment: ForumCommentResponse) => {
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
      const response = await forumEndpoints.updateComment(commentId, {
        forumPostId: postId,
        content: editText.trim(),
        userEmail: user.email,
        imgPath: "NO_IMAGE", // Backend requires imgPath
      });

      if (response.data) {
        const updatedComment = response.data;
        // Update repliesMap if this comment is in replies
        setRepliesMap((prev) => {
          const newMap = { ...prev };
          Object.keys(newMap).forEach((parentId) => {
            newMap[Number(parentId)] = newMap[Number(parentId)].map((c) =>
              c.forumCommentId === commentId ? updatedComment : c
            );
          });
          return newMap;
        });
        onCommentUpdated?.(updatedComment);
        setEditingComment(null);
        setEditText("");
      } else {
        // If response.data is null, reload comments from server
        const commentsResponse = await forumEndpoints.getCommentsByPost(postId);
        const updatedComments = commentsResponse.data || [];
        // Find and update the comment in the list
        const updatedComment = updatedComments.find(
          (c: ForumCommentResponse) => c.forumCommentId === commentId
        );
        if (updatedComment) {
          // Update repliesMap
          setRepliesMap((prev) => {
            const newMap = { ...prev };
            Object.keys(newMap).forEach((parentId) => {
              newMap[Number(parentId)] = newMap[Number(parentId)].map((c) =>
                c.forumCommentId === commentId ? updatedComment : c
              );
            });
            return newMap;
          });
          onCommentUpdated?.(updatedComment);
        }
        setEditingComment(null);
        setEditText("");
      }
    } catch (error) {
      console.error("Update comment error:", error);
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
            await forumEndpoints.deleteComment(commentId, user.email);
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
            await forumEndpoints.createReport(
              {
                targetType: "COMMENT",
                targetId: commentId,
                reasons: ["INAPPROPRIATE"],
                description: "Báo cáo bình luận không phù hợp",
              },
              user.email
            );

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

  const isCommentOwner = (comment: ForumCommentResponse) => {
    return user?.username === comment.username;
  };

  const handleTranslateComment = async (comment: ForumCommentResponse) => {
    const commentId = comment.forumCommentId;

    // If already translated, just toggle visibility
    if (translatedComments[commentId]) {
      setIsShowingTranslatedComments((prev) => ({
        ...prev,
        [commentId]: !prev[commentId],
      }));
      return;
    }

    // Start translating
    setIsTranslatingComments((prev) => ({
      ...prev,
      [commentId]: true,
    }));

    try {
      const baseContent = comment.content || "";
      if (!baseContent.trim()) {
        return;
      }

      const response = await geminiEndpoints.translate({ text: baseContent });
      const translatedText =
        typeof response.data === "string" ? response.data.trim() : "";

      if (translatedText) {
        setTranslatedComments((prev) => ({
          ...prev,
          [commentId]: translatedText,
        }));
        setIsShowingTranslatedComments((prev) => ({
          ...prev,
          [commentId]: true,
        }));
      }
    } catch {
      Alert.alert(t("common.error"), t("forum.translateFailed"));
    } finally {
      setIsTranslatingComments((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    }
  };

  const calculateTotalCommentCount = (commentId: number): number => {
    const directReplies = repliesMap[commentId] || [];
    let totalCount = directReplies.length;

    directReplies.forEach((reply) => {
      totalCount += calculateTotalCommentCount(reply.forumCommentId);
    });

    return totalCount;
  };

  const getTotalCommentCount = (commentId: number): number => {
    return (
      totalCommentCounts[commentId] || calculateTotalCommentCount(commentId)
    );
  };

  const loadRepliesForComment = React.useCallback(
    async (commentId: number) => {
      if (!repliesMap[commentId]) {
        try {
          const response = await forumEndpoints.getRepliesByComment(commentId);
          const data = response.data.map((c: any) => ({
            ...c,
            imgPath: c?.imgPath ? toAbsoluteUrl(c.imgPath) : undefined,
          }));
          setRepliesMap((prev) => ({
            ...prev,
            [commentId]: data,
          }));
        } catch {
          // Silently fail for individual comments
        }
      }
    },
    [repliesMap]
  );

  React.useEffect(() => {
    const loadAllReplies = async () => {
      for (const comment of comments) {
        if (!comment.parentCommentId && !repliesMap[comment.forumCommentId]) {
          await loadRepliesForComment(comment.forumCommentId);
        }
      }
    };
    if (comments.length > 0) {
      loadAllReplies();
    }
  }, [comments, loadRepliesForComment, repliesMap]);

  React.useEffect(() => {
    const visited = new Set<number>();

    const preloadRecursively = async (commentId: number): Promise<void> => {
      if (visited.has(commentId)) return;
      visited.add(commentId);
      try {
        const response = await forumEndpoints.getRepliesByComment(commentId);
        const children = response.data.map((c: any) => ({
          ...c,
          imgPath: c?.imgPath ? toAbsoluteUrl(c.imgPath) : undefined,
        }));
        setRepliesMap((prev) => ({ ...prev, [commentId]: children }));
        for (const child of children) {
          await preloadRecursively(child.forumCommentId);
        }
      } catch {}
    };

    const start = async () => {
      const topLevel = comments.filter((c) => !c.parentCommentId);
      for (const c of topLevel) {
        await preloadRecursively(c.forumCommentId);
      }
    };

    if (comments.length > 0) {
      start();
    }
  }, [comments]);

  React.useEffect(() => {}, [comments]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t("forum.commentsTitle", {
          count: comments.filter((comment) => !comment.parentCommentId).length,
        })}
      </Text>

      <View style={styles.commentsList}>
        {comments
          .filter((comment) => !comment.parentCommentId)
          .map((comment) => (
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
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#666"
                        />
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
                      onPress={() =>
                        handleReportComment(comment.forumCommentId)
                      }
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
                <View>
                  <View style={styles.commentContentRow}>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    {comment.content && comment.content.trim().length > 0 && (
                      <TouchableOpacity
                        style={styles.translateChip}
                        onPress={() => handleTranslateComment(comment)}
                        disabled={isTranslatingComments[comment.forumCommentId]}
                      >
                        <Ionicons
                          name="language-outline"
                          size={12}
                          color="#007AFF"
                        />
                        <Text style={styles.translateChipText}>
                          {isTranslatingComments[comment.forumCommentId]
                            ? t("common.loading")
                            : isShowingTranslatedComments[
                                comment.forumCommentId
                              ]
                            ? t("forum.hideTranslation")
                            : t("forum.translate")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {isShowingTranslatedComments[comment.forumCommentId] &&
                    translatedComments[comment.forumCommentId] && (
                      <Text style={styles.translatedCommentContent}>
                        {translatedComments[comment.forumCommentId]}
                      </Text>
                    )}
                </View>
              )}
              {comment.imgPath && (
                <Image
                  source={{ uri: comment.imgPath }}
                  style={styles.commentImage}
                  contentFit="cover"
                />
              )}
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={async () => {
                    if (!user?.email) {
                      Alert.alert(
                        t("forum.errorTitle"),
                        t("forum.loginToLike")
                      );
                      return;
                    }
                    const isLiked = !!likedMap[comment.forumCommentId];
                    try {
                      if (isLiked) {
                        // Unlike: remove reaction
                        await forumEndpoints.removeCommentReaction(
                          comment.forumCommentId,
                          user.email
                        );
                        setLikedMap((prev) => ({
                          ...prev,
                          [comment.forumCommentId]: false,
                        }));
                        comment.react = Math.max(0, (comment.react || 0) - 1);
                      } else {
                        // Like: add reaction
                        await forumEndpoints.addCommentReaction(
                          comment.forumCommentId,
                          "LIKE",
                          user.email
                        );
                        setLikedMap((prev) => ({
                          ...prev,
                          [comment.forumCommentId]: true,
                        }));
                        comment.react = (comment.react || 0) + 1;
                      }
                      // Refresh summary to get accurate counts
                      const summaryResponse =
                        await forumEndpoints.getCommentReactionSummary(
                          comment.forumCommentId,
                          user.email
                        );
                      const summary = summaryResponse.data;
                      if (summary) {
                        setLikedMap((prev) => ({
                          ...prev,
                          [comment.forumCommentId]:
                            summary.userReaction === "LIKE",
                        }));
                        comment.react = summary.likeCount || 0;
                      }
                    } catch {
                      // Revert optimistic update on error
                      setLikedMap((prev) => ({
                        ...prev,
                        [comment.forumCommentId]: !isLiked,
                      }));
                      comment.react = isLiked
                        ? (comment.react || 0) + 1
                        : Math.max(0, (comment.react || 0) - 1);
                    }
                  }}
                >
                  <Ionicons
                    name={
                      likedMap[comment.forumCommentId]
                        ? "heart"
                        : "heart-outline"
                    }
                    size={16}
                    color={
                      likedMap[comment.forumCommentId] ? "#ff4444" : "#666"
                    }
                  />
                  <Text style={styles.commentActionText}>
                    {comment.react || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.commentAction}
                  onPress={async () => {
                    const isOpen = !!replyOpen[comment.forumCommentId];
                    if (!isOpen) {
                      await loadRepliesForComment(comment.forumCommentId);
                    }
                    setReplyOpen((prev) => ({
                      ...prev,
                      [comment.forumCommentId]: true,
                    }));
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.commentActionText}>
                    {getTotalCommentCount(comment.forumCommentId)}
                  </Text>
                </TouchableOpacity>
              </View>
              {replyOpen[comment.forumCommentId] && (
                <View style={styles.repliesContainer}>
                  {(repliesMap[comment.forumCommentId] || []).map((reply) => (
                    <View key={reply.forumCommentId} style={styles.replyItem}>
                      <View style={styles.commentHeader}>
                        <View style={styles.replyAuthorContainer}>
                          <Ionicons
                            name="chatbubble-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[styles.commentAuthor, { marginLeft: 4 }]}
                          >
                            {reply.username}
                          </Text>
                        </View>
                        <View style={styles.commentHeaderRight}>
                          <Text style={styles.commentTime}>
                            {formatDate(reply.createdAt)}
                          </Text>
                          {isCommentOwner(reply) && (
                            <View style={styles.ownerActions}>
                              <TouchableOpacity
                                onPress={() => handleEditComment(reply)}
                                style={styles.actionButton}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={16}
                                  color="#666"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  handleDeleteComment(reply.forumCommentId)
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
                          {!isCommentOwner(reply) && (
                            <TouchableOpacity
                              onPress={() =>
                                handleReportComment(reply.forumCommentId)
                              }
                              style={styles.actionButton}
                            >
                              <Ionicons
                                name="flag-outline"
                                size={16}
                                color="#666"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      {editingComment === reply.forumCommentId ? (
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
                              onPress={() =>
                                handleSaveEdit(reply.forumCommentId)
                              }
                              style={[styles.editButton, styles.saveButton]}
                            >
                              <Text
                                style={[
                                  styles.editButtonText,
                                  styles.saveButtonText,
                                ]}
                              >
                                {t("forum.save")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <View style={styles.commentContentRow}>
                            <Text style={styles.commentContent}>
                              {reply.content}
                            </Text>
                            {reply.content &&
                              reply.content.trim().length > 0 && (
                                <TouchableOpacity
                                  style={styles.translateChip}
                                  onPress={() => handleTranslateComment(reply)}
                                  disabled={
                                    isTranslatingComments[reply.forumCommentId]
                                  }
                                >
                                  <Ionicons
                                    name="language-outline"
                                    size={12}
                                    color="#007AFF"
                                  />
                                  <Text style={styles.translateChipText}>
                                    {isTranslatingComments[reply.forumCommentId]
                                      ? t("common.loading")
                                      : isShowingTranslatedComments[
                                          reply.forumCommentId
                                        ]
                                      ? t("forum.hideTranslation")
                                      : t("forum.translate")}
                                  </Text>
                                </TouchableOpacity>
                              )}
                          </View>
                          {isShowingTranslatedComments[reply.forumCommentId] &&
                            translatedComments[reply.forumCommentId] && (
                              <Text style={styles.translatedCommentContent}>
                                {translatedComments[reply.forumCommentId]}
                              </Text>
                            )}
                        </View>
                      )}
                      {reply.imgPath && (
                        <Image
                          source={{ uri: reply.imgPath }}
                          style={styles.commentImage}
                          contentFit="cover"
                        />
                      )}

                      <View style={styles.commentActions}>
                        <TouchableOpacity
                          style={styles.commentAction}
                          onPress={async () => {
                            if (!user?.email) {
                              Alert.alert(
                                t("forum.errorTitle"),
                                t("forum.loginToLike")
                              );
                              return;
                            }
                            const isLiked = !!likedMap[reply.forumCommentId];
                            try {
                              if (isLiked) {
                                // Unlike: remove reaction
                                await forumEndpoints.removeCommentReaction(
                                  reply.forumCommentId,
                                  user.email
                                );
                                setLikedMap((prev) => ({
                                  ...prev,
                                  [reply.forumCommentId]: false,
                                }));
                                reply.react = Math.max(
                                  0,
                                  (reply.react || 0) - 1
                                );
                              } else {
                                // Like: add reaction
                                await forumEndpoints.addCommentReaction(
                                  reply.forumCommentId,
                                  "LIKE",
                                  user.email
                                );
                                setLikedMap((prev) => ({
                                  ...prev,
                                  [reply.forumCommentId]: true,
                                }));
                                reply.react = (reply.react || 0) + 1;
                              }
                              // Refresh summary to get accurate counts
                              const summaryResponse =
                                await forumEndpoints.getCommentReactionSummary(
                                  reply.forumCommentId,
                                  user.email
                                );
                              const summary = summaryResponse.data;
                              if (summary) {
                                setLikedMap((prev) => ({
                                  ...prev,
                                  [reply.forumCommentId]:
                                    summary.userReaction === "LIKE",
                                }));
                                reply.react = summary.likeCount || 0;
                              }
                            } catch {
                              // Revert optimistic update on error
                              setLikedMap((prev) => ({
                                ...prev,
                                [reply.forumCommentId]: !isLiked,
                              }));
                              reply.react = isLiked
                                ? (reply.react || 0) + 1
                                : Math.max(0, (reply.react || 0) - 1);
                            }
                          }}
                        >
                          <Ionicons
                            name={
                              likedMap[reply.forumCommentId]
                                ? "heart"
                                : "heart-outline"
                            }
                            size={14}
                            color={
                              likedMap[reply.forumCommentId]
                                ? "#ff4444"
                                : "#666"
                            }
                          />
                          <Text
                            style={[styles.commentActionText, { fontSize: 12 }]}
                          >
                            {reply.react || 0}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.commentAction}
                          onPress={async () => {
                            const isOpen = !!replyOpen[reply.forumCommentId];
                            if (!isOpen) {
                              await loadRepliesForComment(reply.forumCommentId);
                            }
                            setReplyOpen((prev) => ({
                              ...prev,
                              [reply.forumCommentId]: true,
                            }));
                          }}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={14}
                            color="#666"
                          />
                          <Text
                            style={[styles.commentActionText, { fontSize: 12 }]}
                          >
                            {getTotalCommentCount(reply.forumCommentId)}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {replyOpen[reply.forumCommentId] && (
                        <View style={styles.nestedRepliesContainer}>
                          {(repliesMap[reply.forumCommentId] || []).map(
                            (nestedReply) => (
                              <View
                                key={nestedReply.forumCommentId}
                                style={styles.nestedReplyItem}
                              >
                                <View style={styles.commentHeader}>
                                  <View style={styles.replyAuthorContainer}>
                                    <Ionicons
                                      name="chatbubble-outline"
                                      size={12}
                                      color="#666"
                                    />
                                    <Text
                                      style={[
                                        styles.commentAuthor,
                                        { marginLeft: 4, fontSize: 13 },
                                      ]}
                                    >
                                      {nestedReply.username}
                                    </Text>
                                  </View>
                                  <View style={styles.commentHeaderRight}>
                                    <Text
                                      style={[
                                        styles.commentTime,
                                        { fontSize: 11 },
                                      ]}
                                    >
                                      {formatDate(nestedReply.createdAt)}
                                    </Text>
                                    {isCommentOwner(nestedReply) && (
                                      <View style={styles.ownerActions}>
                                        <TouchableOpacity
                                          onPress={() =>
                                            handleEditComment(nestedReply)
                                          }
                                          style={styles.actionButton}
                                        >
                                          <Ionicons
                                            name="create-outline"
                                            size={14}
                                            color="#666"
                                          />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          onPress={() =>
                                            handleDeleteComment(
                                              nestedReply.forumCommentId
                                            )
                                          }
                                          style={styles.actionButton}
                                        >
                                          <Ionicons
                                            name="trash-outline"
                                            size={14}
                                            color="#ff4444"
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                    {!isCommentOwner(nestedReply) && (
                                      <TouchableOpacity
                                        onPress={() =>
                                          handleReportComment(
                                            nestedReply.forumCommentId
                                          )
                                        }
                                        style={styles.actionButton}
                                      >
                                        <Ionicons
                                          name="flag-outline"
                                          size={14}
                                          color="#666"
                                        />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                </View>
                                {editingComment ===
                                nestedReply.forumCommentId ? (
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
                                        onPress={() =>
                                          handleSaveEdit(
                                            nestedReply.forumCommentId
                                          )
                                        }
                                        style={[
                                          styles.editButton,
                                          styles.saveButton,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.editButtonText,
                                            styles.saveButtonText,
                                          ]}
                                        >
                                          {t("forum.save")}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                ) : (
                                  <View>
                                    <View style={styles.commentContentRow}>
                                      <Text
                                        style={[
                                          styles.commentContent,
                                          { fontSize: 13 },
                                        ]}
                                      >
                                        {nestedReply.content}
                                      </Text>
                                      {nestedReply.content &&
                                        nestedReply.content.trim().length >
                                          0 && (
                                          <TouchableOpacity
                                            style={styles.translateChip}
                                            onPress={() =>
                                              handleTranslateComment(
                                                nestedReply
                                              )
                                            }
                                            disabled={
                                              isTranslatingComments[
                                                nestedReply.forumCommentId
                                              ]
                                            }
                                          >
                                            <Ionicons
                                              name="language-outline"
                                              size={11}
                                              color="#007AFF"
                                            />
                                            <Text
                                              style={[
                                                styles.translateChipText,
                                                { fontSize: 10 },
                                              ]}
                                            >
                                              {isTranslatingComments[
                                                nestedReply.forumCommentId
                                              ]
                                                ? t("common.loading")
                                                : isShowingTranslatedComments[
                                                    nestedReply.forumCommentId
                                                  ]
                                                ? t("forum.hideTranslation")
                                                : t("forum.translate")}
                                            </Text>
                                          </TouchableOpacity>
                                        )}
                                    </View>
                                    {isShowingTranslatedComments[
                                      nestedReply.forumCommentId
                                    ] &&
                                      translatedComments[
                                        nestedReply.forumCommentId
                                      ] && (
                                        <Text
                                          style={[
                                            styles.translatedCommentContent,
                                            { fontSize: 12 },
                                          ]}
                                        >
                                          {
                                            translatedComments[
                                              nestedReply.forumCommentId
                                            ]
                                          }
                                        </Text>
                                      )}
                                  </View>
                                )}
                                {nestedReply.imgPath && (
                                  <Image
                                    source={{ uri: nestedReply.imgPath }}
                                    style={[
                                      styles.commentImage,
                                      { width: 80, height: 80 },
                                    ]}
                                    contentFit="cover"
                                  />
                                )}
                                <View style={styles.commentActions}>
                                  <TouchableOpacity
                                    style={styles.commentAction}
                                    onPress={async () => {
                                      if (!user?.email) {
                                        Alert.alert(
                                          t("forum.errorTitle"),
                                          t("forum.loginToLike")
                                        );
                                        return;
                                      }
                                      const isLiked =
                                        !!likedMap[nestedReply.forumCommentId];
                                      try {
                                        if (isLiked) {
                                          // Unlike: remove reaction
                                          await forumEndpoints.removeCommentReaction(
                                            nestedReply.forumCommentId,
                                            user.email
                                          );
                                          setLikedMap((prev) => ({
                                            ...prev,
                                            [nestedReply.forumCommentId]: false,
                                          }));
                                          nestedReply.react = Math.max(
                                            0,
                                            (nestedReply.react || 0) - 1
                                          );
                                        } else {
                                          // Like: add reaction
                                          await forumEndpoints.addCommentReaction(
                                            nestedReply.forumCommentId,
                                            "LIKE",
                                            user.email
                                          );
                                          setLikedMap((prev) => ({
                                            ...prev,
                                            [nestedReply.forumCommentId]: true,
                                          }));
                                          nestedReply.react =
                                            (nestedReply.react || 0) + 1;
                                        }
                                        // Refresh summary to get accurate counts
                                        const summaryResponse =
                                          await forumEndpoints.getCommentReactionSummary(
                                            nestedReply.forumCommentId,
                                            user.email
                                          );
                                        const summary = summaryResponse.data;
                                        if (summary) {
                                          setLikedMap((prev) => ({
                                            ...prev,
                                            [nestedReply.forumCommentId]:
                                              summary.userReaction === "LIKE",
                                          }));
                                          nestedReply.react =
                                            summary.likeCount || 0;
                                        }
                                      } catch {
                                        // Revert optimistic update on error
                                        setLikedMap((prev) => ({
                                          ...prev,
                                          [nestedReply.forumCommentId]:
                                            !isLiked,
                                        }));
                                        nestedReply.react = isLiked
                                          ? (nestedReply.react || 0) + 1
                                          : Math.max(
                                              0,
                                              (nestedReply.react || 0) - 1
                                            );
                                      }
                                    }}
                                  >
                                    <Ionicons
                                      name={
                                        likedMap[nestedReply.forumCommentId]
                                          ? "heart"
                                          : "heart-outline"
                                      }
                                      size={14}
                                      color={
                                        likedMap[nestedReply.forumCommentId]
                                          ? "#ff4444"
                                          : "#666"
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.commentActionText,
                                        { fontSize: 11 },
                                      ]}
                                    >
                                      {nestedReply.react || 0}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.commentAction}
                                    onPress={async () => {
                                      if (!user?.email) {
                                        Alert.alert(
                                          t("forum.errorTitle"),
                                          t("forum.loginToReply")
                                        );
                                        return;
                                      }
                                      const isOpen =
                                        !!replyOpen[nestedReply.forumCommentId];
                                      setReplyOpen((prev) => ({
                                        ...prev,
                                        [nestedReply.forumCommentId]: !isOpen,
                                      }));
                                    }}
                                  >
                                    <Ionicons
                                      name="chatbubble-outline"
                                      size={14}
                                      color="#666"
                                    />
                                    <Text
                                      style={[
                                        styles.commentActionText,
                                        { fontSize: 11 },
                                      ]}
                                    >
                                      {getTotalCommentCount(
                                        nestedReply.forumCommentId
                                      )}
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                {replyOpen[nestedReply.forumCommentId] && (
                                  <View
                                    style={styles.deepNestedRepliesContainer}
                                  >
                                    {(
                                      repliesMap[nestedReply.forumCommentId] ||
                                      []
                                    ).map((deepNestedReply) => (
                                      <View
                                        key={deepNestedReply.forumCommentId}
                                        style={styles.deepNestedReplyItem}
                                      >
                                        <View style={styles.commentHeader}>
                                          <View
                                            style={styles.replyAuthorContainer}
                                          >
                                            <Ionicons
                                              name="chatbubble-outline"
                                              size={10}
                                              color="#666"
                                            />
                                            <Text
                                              style={[
                                                styles.commentAuthor,
                                                {
                                                  marginLeft: 4,
                                                  fontSize: 12,
                                                },
                                              ]}
                                            >
                                              {deepNestedReply.username}
                                            </Text>
                                          </View>
                                          <View
                                            style={styles.commentHeaderRight}
                                          >
                                            <Text
                                              style={[
                                                styles.commentTime,
                                                { fontSize: 10 },
                                              ]}
                                            >
                                              {formatDate(
                                                deepNestedReply.createdAt
                                              )}
                                            </Text>
                                            {isCommentOwner(
                                              deepNestedReply
                                            ) && (
                                              <View style={styles.ownerActions}>
                                                <TouchableOpacity
                                                  onPress={() =>
                                                    handleEditComment(
                                                      deepNestedReply
                                                    )
                                                  }
                                                  style={styles.actionButton}
                                                >
                                                  <Ionicons
                                                    name="create-outline"
                                                    size={12}
                                                    color="#666"
                                                  />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                  onPress={() =>
                                                    handleDeleteComment(
                                                      deepNestedReply.forumCommentId
                                                    )
                                                  }
                                                  style={styles.actionButton}
                                                >
                                                  <Ionicons
                                                    name="trash-outline"
                                                    size={12}
                                                    color="#ff4444"
                                                  />
                                                </TouchableOpacity>
                                              </View>
                                            )}
                                            {!isCommentOwner(
                                              deepNestedReply
                                            ) && (
                                              <TouchableOpacity
                                                onPress={() =>
                                                  handleReportComment(
                                                    deepNestedReply.forumCommentId
                                                  )
                                                }
                                                style={styles.actionButton}
                                              >
                                                <Ionicons
                                                  name="flag-outline"
                                                  size={12}
                                                  color="#666"
                                                />
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        </View>
                                        {editingComment ===
                                        deepNestedReply.forumCommentId ? (
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
                                                <Text
                                                  style={styles.editButtonText}
                                                >
                                                  {t("forum.cancel")}
                                                </Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                onPress={() =>
                                                  handleSaveEdit(
                                                    deepNestedReply.forumCommentId
                                                  )
                                                }
                                                style={[
                                                  styles.editButton,
                                                  styles.saveButton,
                                                ]}
                                              >
                                                <Text
                                                  style={[
                                                    styles.editButtonText,
                                                    styles.saveButtonText,
                                                  ]}
                                                >
                                                  {t("forum.save")}
                                                </Text>
                                              </TouchableOpacity>
                                            </View>
                                          </View>
                                        ) : (
                                          <View>
                                            <View
                                              style={styles.commentContentRow}
                                            >
                                              <Text
                                                style={[
                                                  styles.commentContent,
                                                  { fontSize: 12 },
                                                ]}
                                              >
                                                {deepNestedReply.content}
                                              </Text>
                                              {deepNestedReply.content &&
                                                deepNestedReply.content.trim()
                                                  .length > 0 && (
                                                  <TouchableOpacity
                                                    style={styles.translateChip}
                                                    onPress={() =>
                                                      handleTranslateComment(
                                                        deepNestedReply
                                                      )
                                                    }
                                                    disabled={
                                                      isTranslatingComments[
                                                        deepNestedReply
                                                          .forumCommentId
                                                      ]
                                                    }
                                                  >
                                                    <Ionicons
                                                      name="language-outline"
                                                      size={10}
                                                      color="#007AFF"
                                                    />
                                                    <Text
                                                      style={[
                                                        styles.translateChipText,
                                                        { fontSize: 9 },
                                                      ]}
                                                    >
                                                      {isTranslatingComments[
                                                        deepNestedReply
                                                          .forumCommentId
                                                      ]
                                                        ? t("common.loading")
                                                        : isShowingTranslatedComments[
                                                            deepNestedReply
                                                              .forumCommentId
                                                          ]
                                                        ? t(
                                                            "forum.hideTranslation"
                                                          )
                                                        : t("forum.translate")}
                                                    </Text>
                                                  </TouchableOpacity>
                                                )}
                                            </View>
                                            {isShowingTranslatedComments[
                                              deepNestedReply.forumCommentId
                                            ] &&
                                              translatedComments[
                                                deepNestedReply.forumCommentId
                                              ] && (
                                                <Text
                                                  style={[
                                                    styles.translatedCommentContent,
                                                    { fontSize: 11 },
                                                  ]}
                                                >
                                                  {
                                                    translatedComments[
                                                      deepNestedReply
                                                        .forumCommentId
                                                    ]
                                                  }
                                                </Text>
                                              )}
                                          </View>
                                        )}
                                        {deepNestedReply.imgPath && (
                                          <Image
                                            source={{
                                              uri: deepNestedReply.imgPath,
                                            }}
                                            style={[
                                              styles.commentImage,
                                              { width: 60, height: 60 },
                                            ]}
                                            contentFit="cover"
                                          />
                                        )}
                                        <View style={styles.commentActions}>
                                          <TouchableOpacity
                                            style={styles.commentAction}
                                            onPress={async () => {
                                              if (!user?.email) {
                                                Alert.alert(
                                                  t("forum.errorTitle"),
                                                  t("forum.loginToLike")
                                                );
                                                return;
                                              }
                                              const isLiked =
                                                !!likedMap[
                                                  deepNestedReply.forumCommentId
                                                ];
                                              try {
                                                if (isLiked) {
                                                  // Unlike: remove reaction
                                                  await forumEndpoints.removeCommentReaction(
                                                    deepNestedReply.forumCommentId,
                                                    user.email
                                                  );
                                                  setLikedMap((prev) => ({
                                                    ...prev,
                                                    [deepNestedReply.forumCommentId]:
                                                      false,
                                                  }));
                                                  deepNestedReply.react =
                                                    Math.max(
                                                      0,
                                                      (deepNestedReply.react ||
                                                        0) - 1
                                                    );
                                                } else {
                                                  // Like: add reaction
                                                  await forumEndpoints.addCommentReaction(
                                                    deepNestedReply.forumCommentId,
                                                    "LIKE",
                                                    user.email
                                                  );
                                                  setLikedMap((prev) => ({
                                                    ...prev,
                                                    [deepNestedReply.forumCommentId]:
                                                      true,
                                                  }));
                                                  deepNestedReply.react =
                                                    (deepNestedReply.react ||
                                                      0) + 1;
                                                }
                                                // Refresh summary to get accurate counts
                                                const summaryResponse =
                                                  await forumEndpoints.getCommentReactionSummary(
                                                    deepNestedReply.forumCommentId,
                                                    user.email
                                                  );
                                                const summary =
                                                  summaryResponse.data;
                                                if (summary) {
                                                  setLikedMap((prev) => ({
                                                    ...prev,
                                                    [deepNestedReply.forumCommentId]:
                                                      summary.userReaction ===
                                                      "LIKE",
                                                  }));
                                                  deepNestedReply.react =
                                                    summary.likeCount || 0;
                                                }
                                              } catch {
                                                // Revert optimistic update on error
                                                setLikedMap((prev) => ({
                                                  ...prev,
                                                  [deepNestedReply.forumCommentId]:
                                                    !isLiked,
                                                }));
                                                deepNestedReply.react = isLiked
                                                  ? (deepNestedReply.react ||
                                                      0) + 1
                                                  : Math.max(
                                                      0,
                                                      (deepNestedReply.react ||
                                                        0) - 1
                                                    );
                                              }
                                            }}
                                          >
                                            <Ionicons
                                              name={
                                                likedMap[
                                                  deepNestedReply.forumCommentId
                                                ]
                                                  ? "heart"
                                                  : "heart-outline"
                                              }
                                              size={12}
                                              color={
                                                likedMap[
                                                  deepNestedReply.forumCommentId
                                                ]
                                                  ? "#ff4444"
                                                  : "#666"
                                              }
                                            />
                                            <Text
                                              style={[
                                                styles.commentActionText,
                                                { fontSize: 10 },
                                              ]}
                                            >
                                              {deepNestedReply.react || 0}
                                            </Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={styles.commentAction}
                                            onPress={async () => {
                                              if (!user?.email) {
                                                Alert.alert(
                                                  t("forum.errorTitle"),
                                                  t("forum.loginToReply")
                                                );
                                                return;
                                              }
                                              const isOpen =
                                                !!replyOpen[
                                                  deepNestedReply.forumCommentId
                                                ];
                                              setReplyOpen((prev) => ({
                                                ...prev,
                                                [deepNestedReply.forumCommentId]:
                                                  !isOpen,
                                              }));
                                            }}
                                          >
                                            <Ionicons
                                              name="chatbubble-outline"
                                              size={12}
                                              color="#666"
                                            />
                                            <Text
                                              style={[
                                                styles.commentActionText,
                                                { fontSize: 10 },
                                              ]}
                                            >
                                              {getTotalCommentCount(
                                                deepNestedReply.forumCommentId
                                              )}
                                            </Text>
                                          </TouchableOpacity>
                                        </View>

                                        {replyOpen[
                                          deepNestedReply.forumCommentId
                                        ] && (
                                          <View
                                            style={
                                              styles.deepNestedReplyInputContainer
                                            }
                                          >
                                            <View
                                              style={
                                                styles.deepNestedReplyInputRow
                                              }
                                            >
                                              <TextInput
                                                style={
                                                  styles.deepNestedReplyInput
                                                }
                                                placeholder="Trả lời..."
                                                value={
                                                  replyDraft[
                                                    deepNestedReply
                                                      .forumCommentId
                                                  ] || ""
                                                }
                                                onChangeText={(t) =>
                                                  setReplyDraft((prev) => ({
                                                    ...prev,
                                                    [deepNestedReply.forumCommentId]:
                                                      t,
                                                  }))
                                                }
                                                multiline
                                              />
                                              <TouchableOpacity
                                                style={
                                                  styles.deepNestedReplySend
                                                }
                                                onPress={async () => {
                                                  const text = (
                                                    replyDraft[
                                                      deepNestedReply
                                                        .forumCommentId
                                                    ] || ""
                                                  ).trim();
                                                  if (!text) return;
                                                  if (!user?.email) {
                                                    Alert.alert(
                                                      t("forum.errorTitle"),
                                                      t("forum.loginToReply")
                                                    );
                                                    return;
                                                  }
                                                  try {
                                                    const response =
                                                      await forumEndpoints.replyToComment(
                                                        {
                                                          forumPostId:
                                                            Number(postId),
                                                          content: text,
                                                          userEmail:
                                                            user.email!,
                                                          parentCommentId:
                                                            deepNestedReply.forumCommentId,
                                                          imgPath: "NO_IMAGE",
                                                        }
                                                      );
                                                    const newDeepNestedReply =
                                                      response.data;

                                                    if (
                                                      newDeepNestedReply.parentCommentId ===
                                                      deepNestedReply.forumCommentId
                                                    ) {
                                                      setRepliesMap((prev) => ({
                                                        ...prev,
                                                        [deepNestedReply.forumCommentId]:
                                                          [
                                                            newDeepNestedReply,
                                                            ...(prev[
                                                              deepNestedReply
                                                                .forumCommentId
                                                            ] || []),
                                                          ],
                                                      }));
                                                      setReplyDraft((prev) => ({
                                                        ...prev,
                                                        [deepNestedReply.forumCommentId]:
                                                          "",
                                                      }));
                                                      setTotalCommentCounts(
                                                        (prev) => ({
                                                          ...prev,
                                                          [deepNestedReply.forumCommentId]:
                                                            (prev[
                                                              deepNestedReply
                                                                .forumCommentId
                                                            ] || 0) + 1,
                                                        })
                                                      );
                                                    } else {
                                                      if (
                                                        newDeepNestedReply.parentCommentId ===
                                                          null ||
                                                        newDeepNestedReply.parentCommentId ===
                                                          undefined
                                                      ) {
                                                        setRepliesMap(
                                                          (prev) => ({
                                                            ...prev,
                                                            [deepNestedReply.forumCommentId]:
                                                              [
                                                                newDeepNestedReply,
                                                                ...(prev[
                                                                  deepNestedReply
                                                                    .forumCommentId
                                                                ] || []),
                                                              ],
                                                          })
                                                        );
                                                        setReplyDraft(
                                                          (prev) => ({
                                                            ...prev,
                                                            [deepNestedReply.forumCommentId]:
                                                              "",
                                                          })
                                                        );
                                                        setTotalCommentCounts(
                                                          (prev) => ({
                                                            ...prev,
                                                            [deepNestedReply.forumCommentId]:
                                                              (prev[
                                                                deepNestedReply
                                                                  .forumCommentId
                                                              ] || 0) + 1,
                                                          })
                                                        );
                                                      } else {
                                                        Alert.alert(
                                                          "Lỗi",
                                                          "Deep nested reply được tạo với parent ID sai"
                                                        );
                                                      }
                                                    }
                                                  } catch {
                                                    Alert.alert(
                                                      "Lỗi",
                                                      "Không thể gửi trả lời"
                                                    );
                                                  }
                                                }}
                                              >
                                                <Ionicons
                                                  name="send"
                                                  size={14}
                                                  color="#fff"
                                                />
                                              </TouchableOpacity>
                                            </View>
                                          </View>
                                        )}
                                      </View>
                                    ))}

                                    {/* Deep nested reply input for nested reply */}
                                    <View
                                      style={
                                        styles.deepNestedReplyInputContainer
                                      }
                                    >
                                      <View
                                        style={styles.deepNestedReplyInputRow}
                                      >
                                        <TextInput
                                          style={styles.deepNestedReplyInput}
                                          placeholder="Trả lời..."
                                          value={
                                            replyDraft[
                                              nestedReply.forumCommentId
                                            ] || ""
                                          }
                                          onChangeText={(t) =>
                                            setReplyDraft((prev) => ({
                                              ...prev,
                                              [nestedReply.forumCommentId]: t,
                                            }))
                                          }
                                          multiline
                                        />
                                        <TouchableOpacity
                                          style={styles.deepNestedReplySend}
                                          onPress={async () => {
                                            const text = (
                                              replyDraft[
                                                nestedReply.forumCommentId
                                              ] || ""
                                            ).trim();
                                            if (!text) return;
                                            if (!user?.email) {
                                              Alert.alert(
                                                t("forum.errorTitle"),
                                                t("forum.loginToReply")
                                              );
                                              return;
                                            }
                                            try {
                                              const response =
                                                await forumEndpoints.replyToComment(
                                                  {
                                                    forumPostId: Number(postId),
                                                    content: text,
                                                    userEmail: user.email!,
                                                    parentCommentId:
                                                      nestedReply.forumCommentId,
                                                    imgPath: "NO_IMAGE",
                                                  }
                                                );
                                              const newDeepNestedReply =
                                                response.data;

                                              if (
                                                newDeepNestedReply.parentCommentId ===
                                                nestedReply.forumCommentId
                                              ) {
                                                setRepliesMap((prev) => ({
                                                  ...prev,
                                                  [nestedReply.forumCommentId]:
                                                    [
                                                      newDeepNestedReply,
                                                      ...(prev[
                                                        nestedReply
                                                          .forumCommentId
                                                      ] || []),
                                                    ],
                                                }));
                                                setReplyDraft((prev) => ({
                                                  ...prev,
                                                  [nestedReply.forumCommentId]:
                                                    "",
                                                }));
                                                // Update total comment count
                                                setTotalCommentCounts(
                                                  (prev) => ({
                                                    ...prev,
                                                    [nestedReply.forumCommentId]:
                                                      (prev[
                                                        nestedReply
                                                          .forumCommentId
                                                      ] || 0) + 1,
                                                  })
                                                );

                                                // IMPORTANT: Don't call onCommentAdded for nested replies!
                                              } else {
                                                // If backend returns nested reply as top-level comment, we need to handle it differently
                                                if (
                                                  newDeepNestedReply.parentCommentId ===
                                                    null ||
                                                  newDeepNestedReply.parentCommentId ===
                                                    undefined
                                                ) {
                                                  // Still add to repliesMap even if backend didn't set parentCommentId correctly
                                                  setRepliesMap((prev) => ({
                                                    ...prev,
                                                    [nestedReply.forumCommentId]:
                                                      [
                                                        newDeepNestedReply,
                                                        ...(prev[
                                                          nestedReply
                                                            .forumCommentId
                                                        ] || []),
                                                      ],
                                                  }));
                                                  setReplyDraft((prev) => ({
                                                    ...prev,
                                                    [nestedReply.forumCommentId]:
                                                      "",
                                                  }));
                                                  // Update total comment count
                                                  setTotalCommentCounts(
                                                    (prev) => ({
                                                      ...prev,
                                                      [nestedReply.forumCommentId]:
                                                        (prev[
                                                          nestedReply
                                                            .forumCommentId
                                                        ] || 0) + 1,
                                                    })
                                                  );
                                                } else {
                                                  Alert.alert(
                                                    "Lỗi",
                                                    "Nested reply được tạo với parent ID sai"
                                                  );
                                                }
                                              }
                                            } catch {
                                              Alert.alert(
                                                "Lỗi",
                                                "Không thể gửi trả lời"
                                              );
                                            }
                                          }}
                                        >
                                          <Ionicons
                                            name="send"
                                            size={14}
                                            color="#fff"
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                )}
                              </View>
                            )
                          )}

                          {/* Nested reply input */}
                          <View style={styles.nestedReplyInputContainer}>
                            <View style={styles.nestedReplyInputRow}>
                              <TextInput
                                style={styles.nestedReplyInput}
                                placeholder="Trả lời..."
                                value={replyDraft[reply.forumCommentId] || ""}
                                onChangeText={(t) =>
                                  setReplyDraft((prev) => ({
                                    ...prev,
                                    [reply.forumCommentId]: t,
                                  }))
                                }
                                multiline
                              />
                              <TouchableOpacity
                                style={styles.nestedReplySend}
                                onPress={async () => {
                                  const text = (
                                    replyDraft[reply.forumCommentId] || ""
                                  ).trim();
                                  if (!text) return;
                                  if (!user?.email) {
                                    Alert.alert(
                                      t("forum.errorTitle"),
                                      t("forum.loginToReply")
                                    );
                                    return;
                                  }
                                  try {
                                    const response =
                                      await forumEndpoints.replyToComment({
                                        forumPostId: Number(postId),
                                        content: text,
                                        userEmail: user.email!,
                                        parentCommentId: reply.forumCommentId,
                                        imgPath: "NO_IMAGE",
                                      });
                                    const newNestedReply = response.data;

                                    // Debug: Check if nested reply has correct parentCommentId

                                    // Only add to repliesMap if it's actually a reply
                                    if (
                                      newNestedReply.parentCommentId ===
                                      reply.forumCommentId
                                    ) {
                                      setRepliesMap((prev) => ({
                                        ...prev,
                                        [reply.forumCommentId]: [
                                          newNestedReply,
                                          ...(prev[reply.forumCommentId] || []),
                                        ],
                                      }));
                                      setReplyDraft((prev) => ({
                                        ...prev,
                                        [reply.forumCommentId]: "",
                                      }));

                                      // IMPORTANT: Don't call onCommentAdded for nested replies!
                                    } else {
                                      // If backend returns nested reply as top-level comment, we need to handle it differently
                                      if (
                                        newNestedReply.parentCommentId ===
                                          null ||
                                        newNestedReply.parentCommentId ===
                                          undefined
                                      ) {
                                        // Still add to repliesMap even if backend didn't set parentCommentId correctly
                                        setRepliesMap((prev) => ({
                                          ...prev,
                                          [reply.forumCommentId]: [
                                            newNestedReply,
                                            ...(prev[reply.forumCommentId] ||
                                              []),
                                          ],
                                        }));
                                        setReplyDraft((prev) => ({
                                          ...prev,
                                          [reply.forumCommentId]: "",
                                        }));
                                      } else {
                                        Alert.alert(
                                          "Lỗi",
                                          "Nested reply được tạo với parent ID sai"
                                        );
                                      }
                                    }
                                  } catch {
                                    Alert.alert("Lỗi", "Không thể gửi trả lời");
                                  }
                                }}
                              >
                                <Ionicons name="send" size={16} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                  <View style={styles.replyInputContainer}>
                    {isCommentOwner(comment)}
                    <View style={styles.replyInputRow}>
                      <TextInput
                        style={styles.replyInput}
                        placeholder={
                          isCommentOwner(comment)
                            ? t("forum.writeSelfReplyPlaceholder") ||
                              "Thêm bình luận cho bài viết của bạn..."
                            : t("forum.writeReplyPlaceholder")
                        }
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
                            Alert.alert(
                              t("forum.errorTitle"),
                              t("forum.loginToReply")
                            );
                            return;
                          }
                          try {
                            const response =
                              await forumEndpoints.replyToComment({
                                forumPostId: Number(postId),
                                content: text,
                                userEmail: user.email!,
                                parentCommentId: comment.forumCommentId,
                                imgPath: "NO_IMAGE",
                              });
                            const newReply = response.data;

                            if (
                              newReply.parentCommentId ===
                              comment.forumCommentId
                            ) {
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
                              // Update total comment count
                              setTotalCommentCounts((prev) => ({
                                ...prev,
                                [comment.forumCommentId]:
                                  (prev[comment.forumCommentId] || 0) + 1,
                              }));

                              // IMPORTANT: Don't call onCommentAdded for replies!
                              // This prevents the reply from being added to the main comments array

                              // Double check: Make sure onCommentAdded is NOT called
                            } else {
                              // If backend returns reply as top-level comment, we need to handle it differently
                              if (
                                newReply.parentCommentId === null ||
                                newReply.parentCommentId === undefined
                              ) {
                                // Still add to repliesMap even if backend didn't set parentCommentId correctly
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
                                // Update total comment count
                                setTotalCommentCounts((prev) => ({
                                  ...prev,
                                  [comment.forumCommentId]:
                                    (prev[comment.forumCommentId] || 0) + 1,
                                }));
                              } else {
                                Alert.alert(
                                  "Lỗi",
                                  "Reply được tạo với parent ID sai"
                                );
                              }
                            }
                          } catch {
                            Alert.alert("Lỗi", "Không thể gửi trả lời");
                          }
                        }}
                      >
                        <Ionicons name="send" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
      </View>

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
    // Remove maxHeight to allow full expansion
    flex: 1,
  },
  commentItem: {
    marginBottom: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  commentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 3,
  },
  ownerActions: {
    flexDirection: "row",
    marginLeft: 4,
    gap: 2,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    paddingLeft: 0,
  },
  commentTime: {
    fontSize: 11,
    color: "#999",
  },
  commentContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 0,
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 0,
    paddingLeft: 3,
    flex: 1,
  },
  translatedCommentContent: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: 3,
    fontStyle: "italic",
    paddingHorizontal: 8,
    paddingVertical: 0,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  translateChip: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  translateChipText: {
    marginLeft: 4,
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "500",
  },
  commentImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 0,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 0,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginRight: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 16,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
  },
  replyItem: {
    marginTop: 6,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  replyAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 3,
  },
  nestedRepliesContainer: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 2,
  },
  nestedReplyItem: {
    marginTop: 4,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    borderLeftWidth: 0,
    marginBottom: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 1,
  },
  nestedReplyInputContainer: {
    marginTop: 6,
  },
  nestedReplyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  nestedReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfe8ff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    marginRight: 4,
    backgroundColor: "#fff",
  },
  nestedReplySend: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  deepNestedRepliesContainer: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 6,
  },
  deepNestedReplyItem: {
    marginTop: 3,
    borderBottomWidth: 0,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 1,
  },
  deepNestedReplyInputContainer: {
    marginTop: 4,
  },
  deepNestedReplyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  deepNestedReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfe8ff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    marginRight: 3,
    backgroundColor: "#fff",
  },
  deepNestedReplySend: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
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
  replyInputContainer: {
    marginTop: 8,
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  selfReplyHint: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 4,
    fontStyle: "italic",
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfe8ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 6,
    backgroundColor: "#fff",
  },
  replySend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
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
