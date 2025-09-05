import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
} from "react-native";
import {
  getCommentsForPost,
  createComment,
  CommentResponse,
  CreateCommentRequest,
} from "../endpoints/comments";
import { useAuthContext } from "../contexts/authContext";
import { colors, spacing } from "../constants/theme";

interface CommentSectionProps {
  postId: number;
  onAdded?: (comment: CommentResponse) => void;
}

const CommentItem = ({ comment }: { comment: CommentResponse }) => (
  <View style={styles.commentContainer}>
    <View style={styles.commentHeader}>
      <Text style={styles.commentUsername}>{comment.username}</Text>
      {/* A proper time ago function should be used here */}
      <Text style={styles.commentTime}>a while ago</Text>
    </View>
    <Text style={styles.commentContent}>{comment.content}</Text>
  </View>
);

const CommentSection = ({ postId, onAdded }: CommentSectionProps) => {
  const { user } = useAuthContext();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const fetchedComments = await getCommentsForPost(postId);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) {
      return;
    }

    const commentData: CreateCommentRequest = {
      postId,
      userEmail: user.email,
      content: newComment.trim(),
    };

    try {
      const createdComment = await createComment(commentData);
      setComments([createdComment, ...comments]); // Add to top of the list
      setNewComment("");
      onAdded?.(createdComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Viết bình luận..."
          value={newComment}
          onChangeText={setNewComment}
          placeholderTextColor={colors.text.secondary}
        />
        <Button
          title="Gửi"
          onPress={handleAddComment}
          disabled={!newComment.trim()}
        />
      </View>

      {isLoading ? (
        <Text>Đang tải bình luận...</Text>
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item }) => <CommentItem comment={item} />}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text>Chưa có bình luận nào.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    backgroundColor: colors.surface.secondary,
  },
  commentContainer: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  commentUsername: {
    fontWeight: "bold",
  },
  commentTime: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  commentContent: {},
});

export default CommentSection;
