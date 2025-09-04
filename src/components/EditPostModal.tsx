import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors, spacing } from "../constants/theme";

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
  const [hashtags, setHashtags] = useState(initialHashtags.join(", "));

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setContent(initialContent);
      setHashtags(initialHashtags.join(", "));
    }
  }, [visible, initialTitle, initialContent, initialHashtags]);

  const handleSave = async () => {
    const finalHashtags = hashtags
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    await onSave({
      title: title.trim(),
      content: content.trim(),
      hashtags: finalHashtags,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.header}>Chỉnh sửa bài viết</Text>
          <TextInput
            style={styles.input}
            placeholder="Tiêu đề"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.text.secondary}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Nội dung"
            value={content}
            onChangeText={setContent}
            placeholderTextColor={colors.text.secondary}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Hashtags (cách nhau bằng dấu phẩy)"
            value={hashtags}
            onChangeText={setHashtags}
            placeholderTextColor={colors.text.secondary}
          />
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    padding: spacing.lg,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    marginBottom: spacing.md,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md as any,
  },
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
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
