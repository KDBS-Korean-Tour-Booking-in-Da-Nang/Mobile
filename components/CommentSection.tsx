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
        imgPath: "NO_IMAGE", 
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
        const commentsResponse = await forumEndpoints.getCommentsByPost(postId);
        const updatedComments = commentsResponse.data || [];
        const updatedComment = updatedComments.find(
          (c: ForumCommentResponse) => c.forumCommentId === commentId
        );
        if (updatedComment) {
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

    const key = `reported:comment:${commentId}:${user.email}`;
    try {
      const reported = await AsyncStorage.getItem(key);
      if (reported === "1") {
        Alert.alert(
          t("forum.notificationTitle"),
          t("forum.reportDuplicateComment") ||
            t("forum.reportDuplicate") ||
            "You have already reported this comment."
        );
        return;
      }
    } catch {}

    Alert.alert(
      t("forum.notificationTitle"),
      t("forum.confirmReportComment") ||
        t("forum.cannotSendReport") ||
        "Do you want to report this comment?",
      [
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

    if (translatedComments[commentId]) {
      setIsShowingTranslatedComments((prev) => ({
        ...prev,
        [commentId]: !prev[commentId],
      }));
      return;
    }

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
                          color="#7A8A99"
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
                          color="#F5B8C4"
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
                      <Ionicons name="flag-outline" size={16} color="#7A8A99" />
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
                      likedMap[comment.forumCommentId] ? "#FF8A9B" : "#7A8A99"
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
                  <Ionicons name="chatbubble-outline" size={16} color="#7A8A99" />
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
                            color="#7A8A99"
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
                                    color="#B8D4E3"
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
                                ? "#FF8A9B"
                                : "#7A8A99"
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
                            color="#7A8A99"
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
                                              color="#B8D4E3"
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
                                          ? "#FF8A9B"
                                          : "#7A8A99"
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
                                                      color="#B8D4E3"
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
                                              { width: 60, height: 0 },
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
                                                  ? "#FF8A9B"
                                                  : "#7A8A99"
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
                                              color="#7A8A99"
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

                                                if (
                                                  newDeepNestedReply.parentCommentId ===
                                                    null ||
                                                  newDeepNestedReply.parentCommentId ===
                                                    undefined
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

                                    } else {
                                      if (
                                        newNestedReply.parentCommentId ===
                                          null ||
                                        newNestedReply.parentCommentId ===
                                          undefined
                                      ) {
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
                                <Ionicons name="send-outline" size={16} color="#2C3E50" />
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
                              setTotalCommentCounts((prev) => ({
                                ...prev,
                                [comment.forumCommentId]:
                                  (prev[comment.forumCommentId] || 0) + 1,
                              }));


                            } else {
                              if (
                                newReply.parentCommentId === null ||
                                newReply.parentCommentId === undefined
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
                        <Ionicons name="send-outline" size={18} color="#2C3E50" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
      </View>

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
            name="send-outline"
            size={20}
            color={!newComment.trim() || isSubmitting ? "#D5E3ED" : "#2C3E50"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ownerActions: {
    flexDirection: "row",
    marginLeft: 4,
    gap: 4,
  },
  actionButton: {
    padding: 6,
    borderRadius: 20,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C3E50",
    letterSpacing: 0.2,
  },
  commentTime: {
    fontSize: 12,
    color: "#7A8A99",
  },
  commentContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 0,
  },
  commentContent: {
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 20,
    flex: 1,
  },
  translatedCommentContent: {
    fontSize: 13,
    color: "#7A8A99",
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    fontStyle: "italic",
  },
  translateChip: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#B8D4E3",
    backgroundColor: "#F0F4F8",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  translateChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#5A6C7D",
    fontWeight: "500",
  },
  commentImage: {
    width: 100,
    borderRadius: 24,
    marginTop: 8,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    marginRight: 6,
  },
  commentActionText: {
    fontSize: 12,
    color: "#7A8A99",
    marginLeft: 4,
    fontWeight: "500",
  },
  repliesContainer: {
    marginTop: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 12,
  },
  replyItem: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  replyAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nestedRepliesContainer: {
    marginTop: 8,
    backgroundColor: "#F0F4F8",
    borderRadius: 20,
    padding: 10,
  },
  nestedReplyItem: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  nestedReplyInputContainer: {
    marginTop: 8,
  },
  nestedReplyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  nestedReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginRight: 6,
    backgroundColor: "#FFFFFF",
  },
  nestedReplySend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#B8D4E3",
    alignItems: "center",
    justifyContent: "center",
  },
  deepNestedRepliesContainer: {
    marginTop: 8,
    backgroundColor: "#F0F4F8",
    borderRadius: 20,
    padding: 8,
  },
  deepNestedReplyItem: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  deepNestedReplyInputContainer: {
    marginTop: 6,
  },
  deepNestedReplyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  deepNestedReplyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    marginRight: 6,
    backgroundColor: "#FFFFFF",
  },
  deepNestedReplySend: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#B8D4E3",
    alignItems: "center",
    justifyContent: "center",
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
    backgroundColor: "#F8F9FA",
    color: "#2C3E50",
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B8D4E3",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E8EDF2",
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  selfReplyHint: {
    fontSize: 12,
    color: "#B8D4E3",
    marginBottom: 4,
    fontStyle: "italic",
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 6,
    backgroundColor: "#FFFFFF",
    color: "#2C3E50",
  },
  replySend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#B8D4E3",
    alignItems: "center",
    justifyContent: "center",
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: "#F8F9FA",
    color: "#2C3E50",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  saveButton: {
    backgroundColor: "#B8D4E3",
    borderWidth: 0,
  },
  editButtonText: {
    fontSize: 14,
    color: "#7A8A99",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#2C3E50",
  },
});

export default CommentSection;
