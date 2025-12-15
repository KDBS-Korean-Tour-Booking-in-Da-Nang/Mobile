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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      Alert.alert(t("common.error"), t("forum.titleRequired"));
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        hashtags,
      });
    } catch {
      Alert.alert(t("common.error"), t("forum.cannotCreateUpdate"));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("forum.editTitle")}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color="#7A8A99" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder={t("forum.titlePlaceholder")}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.text.secondary}
            />

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={t("forum.contentPlaceholder")}
              value={content}
              onChangeText={setContent}
              placeholderTextColor={colors.text.secondary}
              multiline
            />

            <View style={styles.hashtagContainer}>
              <View style={styles.hashtagInputContainer}>
                <TextInput
                  style={styles.hashtagInput}
                  placeholder={t("forum.hashtagPlaceholder")}
                  value={currentHashtag}
                  onChangeText={setCurrentHashtag}
                  onSubmitEditing={handleAddHashtag}
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity
                  style={styles.addHashtagButton}
                  onPress={handleAddHashtag}
                >
                  <Ionicons name="add-outline" size={20} color="#B8D4E3" />
                </TouchableOpacity>
              </View>
              <View style={styles.hashtagList}>
                {hashtags.map((tag, index) => (
                  <View key={index} style={styles.hashtagChip}>
                    <Text style={styles.hashtagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveHashtag(tag)}>
                      <Ionicons
                        name="close-circle-outline"
                        size={16}
                        color="#7A8A99"
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
              <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
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
                {loading ? t("forum.submittingPost") : t("common.save")}
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
    marginBottom: spacing.md,
    fontSize: 15,
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
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  hashtagInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 15,
    color: "#2C3E50",
  },
  addHashtagButton: {
    padding: spacing.sm,
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D5E3ED",
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    margin: spacing.xs,
  },
  hashtagText: {
    color: "#5A6C7D",
    marginRight: spacing.sm,
    fontWeight: "500",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md as any,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
  },
  btn: {
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: 24,
    minWidth: 100,
    alignItems: "center",
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: "#7A8A99",
    fontWeight: "500",
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: "#B8D4E3",
  },
  btnPrimaryText: {
    color: "#2C3E50",
    fontWeight: "600",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default EditPostModal;
