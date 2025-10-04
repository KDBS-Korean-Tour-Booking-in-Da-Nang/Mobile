import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Image } from "expo-image";
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

  const popularHashtags = [
    "danang",
    "travel",
    "3n2d",
    "vietnam",
    "tourism",
    "beach",
    "food",
    "culture",
    "adventure",
    "photography",
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("forum.errorTitle"), t("forum.cannotPerformAction"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 6,
    });

    if (!result.canceled) {
      const normalized = result.assets.map((a) => ({
        uri: a.uri,
        type:
          a.mimeType ||
          (a.fileName?.endsWith(".png") ? "image/png" : "image/jpeg"),
        name:
          a.fileName ||
          `photo_${Date.now()}_${Math.floor(Math.random() * 10000)}.${(
            a.uri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg"
          ).toLowerCase()}`,
      }));
      setImages((prev) => [...prev, ...normalized]);
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
    } catch {
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>
              {t("forum.createPostModal.close")}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("forum.createPostModal.title")}
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
              {t("forum.createPostModal.upload")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.sectionTitle}>
              {t("forum.createPostModal.postTitle")}
            </Text>
            <View style={styles.titleInputContainer}>
              <Text style={styles.titleLabel}>
                {t("forum.createPostModal.shortTitle")}
              </Text>
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.titleInput}
                placeholder={t("forum.createPostModal.textField")}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>
              {t("forum.createPostModal.description")}
            </Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder={t("forum.createPostModal.description")}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.uploadSection}>
            <View style={styles.uploadContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadText}>
                  {t("forum.createPostModal.tapToAdd")}
                </Text>
                <Text style={styles.uploadText}>
                  {t("forum.createPostModal.photoVideo")}
                </Text>
              </TouchableOpacity>

              {images.map((image, index) => (
                <View key={index} style={styles.selectedImageItem}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.selectedImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.hashtagSection}>
            <Text style={styles.sectionTitle}>
              {t("forum.createPostModal.chooseHashtags")}
            </Text>

            <View style={styles.hashtagInputContainer}>
              <Text style={styles.hashtagLabel}>
                {t("forum.createPostModal.hashtag")}
              </Text>
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.hashtagInput}
                placeholder={t("forum.createPostModal.textField")}
                value={hashtagInput}
                onChangeText={setHashtagInput}
                onSubmitEditing={addHashtag}
              />
            </View>

            {hashtags.length > 0 && (
              <View style={styles.selectedHashtags}>
                {hashtags.map((hashtag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectedHashtag}
                    onPress={() => removeHashtag(index)}
                  >
                    <Text style={styles.selectedHashtagText}>#{hashtag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#e9ecef",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
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
    fontWeight: "700",
    color: "#000000",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    marginTop: 0,
    marginBottom: 0,
  },
  uploadContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  uploadText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    textAlign: "center",
  },
  selectedImageItem: {
    position: "relative",
  },
  hashtagSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  hashtagLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
  },
  hashtagInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#6c757d",
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#6c757d",
  },
  selectedHashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  selectedHashtag: {
    backgroundColor: "#a1d3ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedHashtagText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
  },
  popularHashtags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popularHashtag: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularHashtagText: {
    fontSize: 12,
    color: "#6c757d",
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  titleInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
  },
  colon: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 32,
  },
  titleInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#6c757d",
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
  },
  descriptionSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  descriptionInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    color: "#000000",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  imagesSection: {
    marginBottom: 24,
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
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
});

export default CreatePostModal;
