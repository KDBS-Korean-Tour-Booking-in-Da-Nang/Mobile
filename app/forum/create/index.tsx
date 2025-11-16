import React, { useState } from "react";
import {
  View,
  Text,
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
import { useNavigation } from "../../../navigation/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import forumEndpoints from "../../../services/endpoints/forum";
import { colors, spacing } from "../../../constants/theme";
import styles from "./styles";

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
  const MAX_TITLE = 120;
  const MAX_CONTENT = 5000;

  const createPostFormData = (data: {
    title: string;
    content: string;
    userEmail?: string;
    hashtags?: string[];
    images?: any[];
  }): FormData => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    if (data.userEmail) {
      formData.append("userEmail", data.userEmail);
    }
    if (data.hashtags && data.hashtags.length > 0) {
      data.hashtags.forEach((hashtag) => {
        formData.append("hashtags", hashtag);
      });
    }
    if (data.images) {
      data.images.forEach((image: any, idx: number) => {
        const uri: string = image?.uri || image?.path || "";
        const clean = uri.split("?")[0];
        const ext = (
          clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg"
        ).toLowerCase();
        const mime =
          image?.type ||
          (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);
        const name = image?.name || `photo_${Date.now()}_${idx}.${ext}`;
        if (uri) {
          formData.append("images", { uri, name, type: mime } as any);
        }
      });
    }
    return formData;
  };

  const handleAddHashtag = () => {
    const raw = currentHashtag.trim();
    if (!raw) return;
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (!hashtags.includes(normalized)) {
      setHashtags([...hashtags, normalized]);
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

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      Alert.alert(t("createPost.error"), t("createPost.titleRequired"));
      return;
    }
    if (trimmedTitle.length > MAX_TITLE) {
      Alert.alert(
        t("createPost.error"),
        t("createPost.titleTooLong", { max: MAX_TITLE })
      );
      return;
    }

    if (!trimmedContent) {
      Alert.alert(t("createPost.error"), t("createPost.contentRequired"));
      return;
    }
    if (trimmedContent.length > MAX_CONTENT) {
      Alert.alert(
        t("createPost.error"),
        t("createPost.contentTooLong", { max: MAX_CONTENT })
      );
      return;
    }

    setLoading(true);
    try {
      const formData = createPostFormData({
        userEmail: user.email,
        title: trimmedTitle,
        content: trimmedContent,
        hashtags,
        images,
      });
      await forumEndpoints.createPost(formData);

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
                <Text style={styles.hashtagText}>{tag}</Text>
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

        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          <Ionicons name="camera" size={24} color={colors.text.secondary} />
          <Text style={styles.imagePickerText}>{t("createPost.addImage")}</Text>
        </TouchableOpacity>

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
