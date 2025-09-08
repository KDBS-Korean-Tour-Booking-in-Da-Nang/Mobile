import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  PostResponse,
  CreatePostRequest,
  createPost,
  updatePost,
} from "../endpoints/forum";
import { useAuthContext } from "../contexts/authContext";
import { useTranslation } from "react-i18next";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: PostResponse) => void;
  editPost?: PostResponse | null;
}

const { width } = Dimensions.get("window");

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  editPost,
}) => {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popular hashtags for suggestions
  const popularHashtags = [
    "công nghệ",
    "startup",
    "marketing",
    "kinh doanh",
    "học tập",
    "du lịch",
    "ẩm thực",
    "thể thao",
    "giải trí",
    "sức khỏe",
    "thời trang",
    "làm đẹp",
    "nghệ thuật",
    "âm nhạc",
    "phim ảnh",
  ];

  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setHashtags(editPost.hashtags);
      setImages(editPost.imageUrls.map((url) => ({ uri: url })));
    } else {
      resetForm();
    }
  }, [editPost, isOpen]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setHashtags([]);
    setHashtagInput("");
    setImages([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addHashtag = () => {
    const hashtag = hashtagInput.trim().toLowerCase();
    if (hashtag && !hashtags.includes(hashtag)) {
      setHashtags((prev) => [...prev, hashtag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (index: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  };

  const addSuggestedHashtag = (hashtag: string) => {
    if (!hashtags.includes(hashtag)) {
      setHashtags((prev) => [...prev, hashtag]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t("forum.errorTitle"), t("forum.titleRequired"));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t("forum.errorTitle"), t("forum.contentRequired"));
      return;
    }

    if (!user?.email) {
      Alert.alert(t("forum.errorTitle"), t("forum.loginRequiredAction"));
      return;
    }

    setIsSubmitting(true);
    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        hashtags,
        images,
        userEmail: user.email,
      };

      let response: PostResponse;
      if (editPost) {
        response = await updatePost(editPost.id, postData);
      } else {
        response = await createPost(postData);
      }

      onPostCreated(response);
      handleClose();
    } catch (error) {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotCreateUpdate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{t("forum.cancel")}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editPost ? t("forum.editTitle") : t("forum.createTitle")}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.headerButton,
              (!title.trim() || !content.trim() || isSubmitting) &&
                styles.headerButtonDisabled,
            ]}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            <Text
              style={[
                styles.headerButtonText,
                (!title.trim() || !content.trim() || isSubmitting) &&
                  styles.headerButtonTextDisabled,
              ]}
            >
              {isSubmitting ? t("forum.submittingPost") : t("forum.submitPost")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder={t("forum.titlePlaceholder")}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder={t("forum.contentPlaceholder")}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{content.length}/1000</Text>
          </View>

          {/* Hashtags */}
          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>
              {t("forum.hashtagsTitle")} ({hashtags.length})
            </Text>

            {/* Hashtag Input */}
            <View style={styles.hashtagInputContainer}>
              <TextInput
                style={styles.hashtagInput}
                placeholder={t("forum.searchHashtagPlaceholder")}
                value={hashtagInput}
                onChangeText={setHashtagInput}
                onSubmitEditing={addHashtag}
              />
              <TouchableOpacity
                onPress={addHashtag}
                style={styles.addHashtagButton}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Selected Hashtags */}
            {hashtags.length > 0 && (
              <View style={styles.selectedHashtags}>
                {hashtags.map((hashtag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectedHashtag}
                    onPress={() => removeHashtag(index)}
                  >
                    <Text style={styles.selectedHashtagText}>#{hashtag}</Text>
                    <Ionicons name="close" size={16} color="#007AFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Hashtags */}
            <Text style={styles.suggestionsTitle}>
              {t("forum.suggestionsTitle")}
            </Text>
            <View style={styles.popularHashtags}>
              {popularHashtags.map((hashtag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularHashtag}
                  onPress={() => addSuggestedHashtag(hashtag)}
                >
                  <Text style={styles.popularHashtagText}>#{hashtag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Images */}
          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>{t("forum.imagesTitle")}</Text>

            {/* Image Picker Button */}
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.imagePickerText}>{t("forum.addImage")}</Text>
            </TouchableOpacity>

            {/* Selected Images */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {images.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.selectedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonTextDisabled: {
    color: "#ccc",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
  },
  contentInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hashtagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  addHashtagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedHashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  selectedHashtag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedHashtagText: {
    fontSize: 14,
    color: "#007AFF",
    marginRight: 4,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  popularHashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popularHashtag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularHashtagText: {
    fontSize: 14,
    color: "#666",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 20,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 8,
    fontWeight: "500",
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageItem: {
    position: "relative",
    marginRight: 8,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
});

export default CreatePostModal;
