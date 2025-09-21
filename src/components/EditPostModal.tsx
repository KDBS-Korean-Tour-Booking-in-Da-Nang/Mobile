import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../constants/theme";

interface EditPostModalProps {
  visible: boolean;
  initialTitle: string;
  initialContent: string;
  initialHashtags: string[];
  onSave: (data: {
    title: string;
    content: string;
    hashtags: string[];
  }) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  initialTitle,
  initialContent,
  initialHashtags,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);
  const [currentHashtag, setCurrentHashtag] = useState("");

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setContent(initialContent);
      setHashtags(initialHashtags);
      setCurrentHashtag("");
    }
  }, [visible, initialTitle, initialContent, initialHashtags]);

  const handleAddHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag("");
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung bài viết.");
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        hashtags,
      });
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật bài viết. Vui lòng thử lại.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="Tiêu đề bài viết..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.text.secondary}
            />

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Bạn đang nghĩ gì?"
              value={content}
              onChangeText={setContent}
              placeholderTextColor={colors.text.secondary}
              multiline
            />

            {/* Hashtags */}
            <View style={styles.hashtagContainer}>
              <View style={styles.hashtagInputContainer}>
                <TextInput
                  style={styles.hashtagInput}
                  placeholder="Nhập hashtag và nhấn Enter..."
                  value={currentHashtag}
                  onChangeText={setCurrentHashtag}
                  onSubmitEditing={handleAddHashtag}
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity
                  style={styles.addHashtagButton}
                  onPress={handleAddHashtag}
                >
                  <Ionicons name="add" size={20} color={colors.primary.main} />
                </TouchableOpacity>
              </View>
              <View style={styles.hashtagList}>
                {hashtags.map((tag, index) => (
                  <View key={index} style={styles.hashtagChip}>
                    <Text style={styles.hashtagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveHashtag(tag)}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.primary.contrast}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.btnGhostText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                (loading || !title.trim() || !content.trim()) &&
                  styles.btnDisabled,
              ]}
              onPress={handleSave}
              disabled={loading || !title.trim() || !content.trim()}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? "Đang lưu..." : "Lưu"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  hashtagContainer: {
    marginBottom: spacing.lg,
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  hashtagInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
  },
  addHashtagButton: {
    padding: spacing.md,
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    margin: spacing.xs,
  },
  hashtagText: {
    color: colors.primary.contrast,
    marginRight: spacing.sm,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md as any,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: colors.text.secondary,
    fontWeight: "600",
  },
  btnPrimary: {
    backgroundColor: colors.primary.main,
  },
  btnPrimaryText: {
    color: colors.primary.contrast,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default EditPostModal;
