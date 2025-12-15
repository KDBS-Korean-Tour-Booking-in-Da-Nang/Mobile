import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { forumEndpoints, PostResponse, ForumCommentResponse } from "../services/endpoints/forum";
import ReportModal from "./ReportModal";
import { useAuthContext } from "../src/contexts/authContext";
import CommentSection from "./CommentSection";
import { useTranslation } from "react-i18next";
import { useNavigation } from "../navigation/navigation";
import { geminiEndpoints } from "../services/endpoints/gemini";
import usersEndpoints from "../services/endpoints/users";

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
  const { navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(post.userReaction === "LIKE");
  const [isDisliked, setIsDisliked] = useState(post.userReaction === "DISLIKE");
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [dislikeCount, setDislikeCount] = useState(post.dislikeCount);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ForumCommentResponse[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hasReported, setHasReported] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    null
  );
  const [isShowingTranslated, setIsShowingTranslated] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [postUserId, setPostUserId] = useState<number | null>(null);

  useEffect(() => {
    if (
      onLoadFullDetails &&
      post.imageUrls.length === 0 &&
      post.hashtags.length === 0
    ) {
      onLoadFullDetails(post.id);
    }
  }, [post.id, post.imageUrls.length, post.hashtags.length, onLoadFullDetails]);

  useEffect(() => {
    const loadUserId = async () => {
      if (!post.username || postUserId) return;
      try {
        const usersResponse = await usersEndpoints.getAll();
        let allUsers: any[] = [];
        if (Array.isArray(usersResponse.data)) {
          allUsers = usersResponse.data;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.result)) {
          allUsers = usersResponse.data.result;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.content)) {
          allUsers = usersResponse.data.content;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.data)) {
          allUsers = usersResponse.data.data;
        }
        
        const foundUser = allUsers.find((u: any) => 
          (u.username || u.name || "").trim().toLowerCase() === post.username.trim().toLowerCase()
        );
        if (foundUser) {
          setPostUserId(foundUser.userId || foundUser.id);
        }
      } catch (error) {
        console.error("Error loading userId:", error);
      }
    };
    
    if (showUserDropdown && !postUserId) {
      loadUserId();
    }
  }, [post.username, showUserDropdown, postUserId]);

  const handleUserPress = () => {
    if (isOwner) {
      return;
    }
    setShowUserDropdown(!showUserDropdown);
    setShowMenu(false); 
  };

  const handleChatPress = () => {
    if (postUserId) {
      setShowUserDropdown(false);
      navigate(`/chat/user?userId=${postUserId}`);
    }
  };

  const isOwner =
    (user?.username || "").trim().toLowerCase() ===
    (post.username || "").trim().toLowerCase();

  const checkIfSaved = useCallback(async () => {
    if (!user?.email) {
      setIsSaved(false);
      return;
    }
    try {
      const response = await forumEndpoints.checkPostSaved(post.id);
      const saved = response.data?.saved || false;
      setIsSaved(saved);
    } catch {
      setIsSaved(false);
    }
  }, [post.id, user?.email]);

  useEffect(() => {
    if (user?.email) {
      checkIfSaved();
    }
    (async () => {
      try {
        const response = await forumEndpoints.getReactionSummary(
          post.id,
          "POST",
          user?.email
        );
        const summary = response.data;
        if (summary) {
          setLikeCount(summary.likeCount || 0);
          setDislikeCount(summary.dislikeCount || 0);
          setIsLiked(summary.userReaction === "LIKE");
          setIsDisliked(summary.userReaction === "DISLIKE");
        }
      } catch {}
    })();
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

  useEffect(() => {
    (async () => {
      try {
        const response = await forumEndpoints.getCommentsByPost(post.id);
        const postComments = response.data || [];
        setCommentCount(postComments.length || 0);
      } catch {}
    })();
  }, [post.id]);

  const handleReaction = async (reactionType: "LIKE" | "DISLIKE") => {
    if (isLoading) return;
    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }

    setIsLoading(true);
    try {
      if (reactionType === "LIKE") {
        if (isLiked) {
          await forumEndpoints.removeReaction(post.id, "POST", user.email);
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        } else {
          await forumEndpoints.addReaction(
            {
              targetId: post.id,
              targetType: "POST",
              reactionType: "LIKE",
            },
            user.email
          );
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);

          if (isDisliked) {
            setIsDisliked(false);
            setDislikeCount((prev) => Math.max(0, prev - 1));
          }
        }
        try {
          const summaryResponse = await forumEndpoints.getReactionSummary(
            post.id,
            "POST",
            user.email
          );
          const summary = summaryResponse.data;
          if (summary) {
            setLikeCount(summary.likeCount || 0);
            setDislikeCount(summary.dislikeCount || 0);
            setIsLiked(summary.userReaction === "LIKE");
            setIsDisliked(summary.userReaction === "DISLIKE");
          }
        } catch {}
      } else {
        if (isDisliked) {
          await forumEndpoints.removeReaction(post.id, "POST", user.email);
          setIsDisliked(false);
          setDislikeCount((prev) => Math.max(0, prev - 1));
        } else {
          await forumEndpoints.addReaction(
            {
              targetId: post.id,
              targetType: "POST",
              reactionType: "DISLIKE",
            },
            user.email
          );
          setIsDisliked(true);
          setDislikeCount((prev) => prev + 1);

          if (isLiked) {
            setIsLiked(false);
            setLikeCount((prev) => Math.max(0, prev - 1));
          }
        }
        try {
          const summaryResponse = await forumEndpoints.getReactionSummary(
            post.id,
            "POST",
            user.email
          );
          const summary = summaryResponse.data;
          if (summary) {
            setLikeCount(summary.likeCount || 0);
            setDislikeCount(summary.dislikeCount || 0);
            setIsLiked(summary.userReaction === "LIKE");
            setIsDisliked(summary.userReaction === "DISLIKE");
          }
        } catch {}
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
        await forumEndpoints.unsavePost(post.id);
        setIsSaved(false);
      } else {
        await forumEndpoints.savePost(post.id);
        setIsSaved(true);
      }
    } catch {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
    } finally {
      setIsLoading(false);
    }
    await checkIfSaved();
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
      await forumEndpoints.createReport(
        {
          targetType: "POST",
          targetId: post.id,
          reasons,
          description: description || undefined,
        },
        user!.email
      );
      setReportVisible(false);
      try {
        const key = `reported:post:${post.id}:${user!.email}`;
        await AsyncStorage.setItem(key, "1");
        setHasReported(true);
      } catch {}
      Alert.alert(t("forum.successTitle"), t("forum.reportSuccess"));
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        try {
          const key = `reported:post:${post.id}:${user!.email}`;
          await AsyncStorage.setItem(key, "1");
          setHasReported(true);
        } catch {}
        Alert.alert(t("forum.notificationTitle"), t("forum.reportDuplicate"));
      } else {
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
        const response = await forumEndpoints.getCommentsByPost(post.id);
        const postComments = response.data || [];
        setComments(postComments);
        setCommentCount(postComments.length);
      } catch {}
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

  const extractTourIdFromContent = (text: string): number | null => {
    if (!text) return null;
    const patterns = [
      /(?:https?:\/\/[^\s]+)?\/?tour\/detail\?id=(\d+)/i,
      /(?:https?:\/\/[^\s]+)?\/?tour\/tourDetail\?id=(\d+)/i,
      /(?:https?:\/\/[^\s]+)?\/?tour\?id=(\d+)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const id = Number(match[1]);
        if (Number.isFinite(id)) return id;
      }
    }
    return null;
  };

  const stripTourLinks = (text: string): string => {
    if (!text) return "";
    const withoutMeta = text
      .replace(/<!--META:\{[\s\S]*?\}-->/gi, "")
      .replace(/\[\[META:\{[\s\S]*?\}\]\]/gi, "");
    const withoutLinks = withoutMeta
      .replace(/(?:https?:\/\/[^\s]+)?\/?tour\/detail\?id=\d+/gi, "")
      .replace(/(?:https?:\/\/[^\s]+)?\/?tour\/tourDetail\?id=\d+/gi, "")
      .replace(/(?:https?:\/\/[^\s]+)?\/?tour\?id=\d+/gi, "");
    return withoutLinks
      .replace(/[\t ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleTranslate = async () => {
    try {
      const baseContent = stripTourLinks(post.content || "");
      if (!baseContent) {
        return;
      }
      setIsTranslating(true);
      const response = await geminiEndpoints.translate({ text: baseContent });
      const text =
        typeof response.data === "string" ? response.data.trim() : "";
      if (!text) {
        return;
      }
      setTranslatedContent(text);
      setIsShowingTranslated(true);
    } catch {
      Alert.alert(t("common.error"), t("forum.translateFailed"));
    } finally {
      setIsTranslating(false);
    }
  };

  const renderImages = (urls: string[]) => {
    const total = urls.length;
    const containerWidth = width - 64;
    const linkedTourId = extractTourIdFromContent(post.content || "");
    const handleImagePress = (index: number) => {
      if (linkedTourId) {
        navigate(`/tour/tourDetail?id=${linkedTourId}`);
        return;
      }
      setPreviewIndex(index);
      setPreviewOpen(true);
    };

    if (total === 1) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(0)}
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
              contentFit="cover"
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
              onPress={() => handleImagePress(i)}
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
                  contentFit="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

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
              onPress={() => handleImagePress(i)}
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
                  contentFit="cover"
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
              onPress={() => handleImagePress(2 + i)}
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
                  contentFit="cover"
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

  const getTruncatedContent = (content: string) => {
    const words = content.split(" ");
    const maxWords = 20; // Approximate 2 lines
    if (words.length <= maxWords) return content;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const toggleShowTranslated = () => {
    if (translatedContent) {
      setIsShowingTranslated((prev) => !prev);
    } else {
      handleTranslate();
    }
  };

  return (
    <TouchableWithoutFeedback 
      onPress={() => {
        setShowMenu(false);
        setShowUserDropdown(false);
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity 
              onPress={handleUserPress} 
              activeOpacity={isOwner ? 1 : 0.7}
              disabled={isOwner}
            >
              <Image
                source={{
                  uri:
                    post.userAvatar ||
                    "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2F300404237650498609%2F&psig=AOvVaw2FuMEvODdlA_lCA6G3gQp9&ust=1757299985491000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCIiX4t3SxY8DFQAAAAAdAAAAABAE ",
                }}
                style={styles.avatar}
                contentFit="cover"
              />
            </TouchableOpacity>
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <TouchableOpacity 
                  onPress={handleUserPress} 
                  activeOpacity={isOwner ? 1 : 0.7}
                  disabled={isOwner}
                >
                  <Text style={styles.username}>{post.username}</Text>
                </TouchableOpacity>
                <Text style={styles.timestamp}>
                  • {formatDate(post.createdAt)}
                </Text>
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{post.title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              onPress={() => {
                setShowMenu(!showMenu);
                setShowUserDropdown(false); // Close user dropdown if open
              }}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-vertical-outline" size={20} color="#7A8A99" />
            </TouchableOpacity>
            
            {post.content && post.content.trim().length > 0 && (
              <TouchableOpacity
                style={styles.translateChip}
                onPress={toggleShowTranslated}
                disabled={isTranslating}
              >
                <Ionicons
                  name="language-outline"
                  size={14}
                  color="#B8D4E3"
                />
                <Text style={styles.translateChipText}>
                  {isTranslating
                    ? t("common.loading")
                    : isShowingTranslated
                    ? t("forum.hideTranslation")
                    : t("forum.translate")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showUserDropdown && !isOwner && (
          <View style={styles.userDropdown}>
            <TouchableOpacity
              style={styles.userDropdownItem}
              onPress={handleChatPress}
              disabled={!postUserId}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#B8D4E3" />
              <Text style={styles.userDropdownText}>
                {(() => {
                  const translated = t("chat.chat");
                  return translated && translated !== "chat.chat" ? translated : "Chat";
                })()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.contentWrapper}>
            {(() => {
              const rawContent = stripTourLinks(post.content || "");
              return (
                <>
                  <Text style={styles.body}>
                    {showFullContent
                      ? rawContent
                      : getTruncatedContent(rawContent)}
                  </Text>
                  {isShowingTranslated && translatedContent && (
                    <Text style={styles.translatedBody}>
                      {showFullContent
                        ? translatedContent
                        : getTruncatedContent(translatedContent)}
                    </Text>
                  )}
                </>
              );
            })()}
          </View>
          {stripTourLinks(post.content || "").length > 100 &&
            !showFullContent && (
              <TouchableOpacity onPress={() => setShowFullContent(true)}>
                <Text style={styles.seeMoreText}>{t("forum.seeMore")}</Text>
              </TouchableOpacity>
            )}
          {showFullContent &&
            stripTourLinks(post.content || "").length > 100 && (
              <TouchableOpacity onPress={() => setShowFullContent(false)}>
                <Text style={styles.seeMoreText}>{t("forum.seeLess")}</Text>
              </TouchableOpacity>
            )}

          {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {post.hashtags.map((hashtag, index) => {
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

          {(() => {
            const contentRaw = post.content || "";
            const hasMeta =
              /<!--META:(\{[\s\S]*?\})-->/i.test(contentRaw) ||
              /\[\[META:(\{[\s\S]*?\})\]\]/i.test(contentRaw);
            const hasLink = !!extractTourIdFromContent(contentRaw);
            if (hasMeta || hasLink) return null;
            if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
              return (
                <View style={styles.imagesContainer}>
                  {renderImages(post.imageUrls)}
                </View>
              );
            }
            return null;
          })()}

          {(() => {
            let tourId: number | null = null;
            let coverFromMeta: string | undefined;
            let tourNameFromMeta: string | undefined;
            let tourDescFromMeta: string | undefined;
            const metaMatch =
              (post.content || "").match(/<!--META:(\{[\s\S]*?\})-->/i) ||
              (post.content || "").match(/\[\[META:(\{[\s\S]*?\})\]\]/i);
            if (metaMatch && metaMatch[1]) {
              try {
                const meta = JSON.parse(metaMatch[1]);
                if (
                  meta &&
                  meta.shareType === "TOUR" &&
                  Number.isFinite(meta.tourId)
                ) {
                  tourId = Number(meta.tourId);
                  coverFromMeta =
                    typeof meta.cover === "string" ? meta.cover : undefined;
                  tourNameFromMeta =
                    typeof meta.tourName === "string"
                      ? meta.tourName
                      : undefined;
                  tourDescFromMeta =
                    typeof meta.tourDescription === "string"
                      ? meta.tourDescription
                      : undefined;
                }
              } catch {}
            }
            if (!tourId) tourId = extractTourIdFromContent(post.content || "");
            if (!tourId) return null;
            const cover = coverFromMeta || (post.imageUrls || [])[0];
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigate(`/tour/tourDetail?id=${tourId}`)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                  marginTop: 8,
                }}
              >
                {cover ? (
                  <Image
                    source={{ uri: cover }}
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    contentFit="cover"
                  />
                ) : null}
                <Text
                  style={{ fontWeight: "700", fontSize: 16 }}
                  numberOfLines={1}
                >
                  {(tourNameFromMeta && tourNameFromMeta.trim()) || post.title}
                </Text>
                {tourDescFromMeta && tourDescFromMeta.trim() ? (
                  <Text
                    style={{ color: "#555", marginTop: 6 }}
                    numberOfLines={2}
                  >
                    {tourDescFromMeta.trim()}
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={() => navigate(`/tour/tourDetail?id=${tourId}`)}
                  style={{ marginTop: 6 }}
                >
                  <Text
                    style={{ color: "#007AFF" }}
                  >{`/tour/tourDetail?id=${tourId}`}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })()}
        </View>

        {showMenu && (
          <View style={styles.menuDropdown}>
            {isOwner ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onEdit?.(post);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#7A8A99" />
                  <Text style={styles.menuItemText}>{t("common.edit")}</Text>
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
                    color={isSaved ? "#8B6A9F" : "#7A8A99"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isSaved && styles.menuItemTextActive,
                    ]}
                  >
                    {isSaved ? t("forum.unsave") : t("forum.save")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#F5B8C4" />
                  <Text style={styles.menuItemTextDanger}>
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
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
                    color={isSaved ? "#8B6A9F" : "#7A8A99"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isSaved && styles.menuItemTextActive,
                    ]}
                  >
                    {isSaved ? t("forum.unsave") : t("forum.save")}
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
                    <Ionicons name="flag-outline" size={18} color="#F5B8C4" />
                    <Text style={styles.menuItemTextDanger}>
                      {t("forum.report")}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("LIKE")}
            disabled={isLoading}
          >
            <Ionicons
              name={isLiked ? "arrow-up" : "arrow-up-outline"}
              size={20}
              color={isLiked ? "#B8D4E3" : "#7A8A99"}
            />
            <Text style={[styles.actionText, isLiked && { color: "#5A6C7D" }]}>
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
              color={isDisliked ? "#F5B8C4" : "#7A8A99"}
            />
            <Text
              style={[styles.actionText, isDisliked && { color: "#8B4A5A" }]}
            >
              {dislikeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleComments}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#7A8A99" />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>
        </View>

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
                    contentFit="contain"
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
    backgroundColor: "#FFFFFF",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: "#2C3E50",
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 12,
    color: "#7A8A99",
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerRightContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  menuButton: {
    padding: 6,
    borderRadius: 20,
  },
  menuDropdown: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1000,
    minWidth: 140,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#2C3E50",
    flex: 1,
    fontWeight: "500",
  },
  menuItemTextActive: {
    color: "#8B6A9F",
  },
  menuItemTextDanger: {
    marginLeft: 10,
    fontSize: 14,
    color: "#8B4A5A",
    flex: 1,
    fontWeight: "500",
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
    position: "relative",
  },
  contentWrapper: {
    flex: 1,
    paddingRight: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    flex: 1,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 20,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  seeMoreText: {
    fontSize: 14,
    color: "#B8D4E3",
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
    color: "#5A6C7D",
    backgroundColor: "#D5E3ED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 4,
    fontWeight: "500",
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
    borderTopColor: "#F0F4F8",
  },
  actionText: {
    fontSize: 12,
    color: "#7A8A99",
    marginLeft: 4,
    fontWeight: "500",
  },
  translatedBody: {
    fontSize: 13,
    color: "#7A8A99",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 6,
    fontStyle: "italic",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
  },
  translateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#B8D4E3",
    backgroundColor: "#F0F4F8",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  translateChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#5A6C7D",
    fontWeight: "500",
  },
  userDropdown: {
    position: "absolute",
    top: 60,
    left: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1000,
    minWidth: 140,
    overflow: "hidden",
  },
  userDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userDropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "500",
  },
});

export default PostCard;
