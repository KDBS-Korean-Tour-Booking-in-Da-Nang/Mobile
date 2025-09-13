import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "../../src/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import { createPost } from "../../src/endpoints/forum";
import { colors, spacing, borderRadius } from "../../src/constants/theme";

export default function CreatePost() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag("");
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !user.email) {
      Alert.alert(
        "Lỗi",
        "Không thể xác định người dùng. Vui lòng thử đăng nhập lại."
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(t("createPost.error"), t("createPost.titleRequired"));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t("createPost.error"), t("createPost.contentRequired"));
      return;
    }

    setLoading(true);
    try {
      await createPost({
        userEmail: user.email,
        title,
        content,
        hashtags,
        images,
      });

      Alert.alert(t("createPost.success"), t("createPost.success"), [
        { text: "OK", onPress: () => goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        t("createPost.error"),
        error.message || t("createPost.cannotCreateUpdate")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("createPost.title")}</Text>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text style={styles.postButtonText}>
            {loading
              ? t("createPost.submittingPost")
              : t("createPost.submitPost")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder={t("createPost.titlePlaceholder")}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.contentInput}
          placeholder={t("createPost.contentPlaceholder")}
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Hashtags */}
        <View style={styles.hashtagContainer}>
          <View style={styles.hashtagInputContainer}>
            <TextInput
              style={styles.hashtagInput}
              placeholder={t("createPost.hashtagPlaceholder")}
              value={currentHashtag}
              onChangeText={setCurrentHashtag}
              onSubmitEditing={handleAddHashtag}
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

        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          <Ionicons name="camera" size={24} color={colors.text.secondary} />
          <Text style={styles.imagePickerText}>{t("createPost.addImage")}</Text>
        </TouchableOpacity>

        {/* Selected Images Preview */}
        <View style={styles.imagePreviewContainer}>
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.uri }}
              style={styles.previewImage}
            />
          ))}
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary.main}
            style={{ marginTop: spacing.lg }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    paddingTop: 50,
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
  },
  postButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: colors.primary.contrast,
    fontWeight: "bold",
  },
  formContainer: {
    padding: spacing.lg,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: spacing.lg,
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
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  imagePickerText: {
    marginLeft: spacing.md,
    color: colors.text.secondary,
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.md,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    margin: spacing.xs,
  },
});
