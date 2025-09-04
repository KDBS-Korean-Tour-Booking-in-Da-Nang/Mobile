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
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "../../src/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import forumService from "../../src/services/forumService";
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from "../../src/constants/theme";

export default function CreatePost() {
  const { goBack } = useNavigation();
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

    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung bài viết.");
      return;
    }

    setLoading(true);
    try {
      await forumService.createPost({
        userEmail: user.email,
        title,
        content,
        hashtags,
        images,
      });

      Alert.alert("Thành công", "Bài viết của bạn đã được đăng!", [
        { text: "OK", onPress: () => goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tạo bài viết. Vui lòng thử lại."
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
        <Text style={styles.headerTitle}>Tạo bài viết mới</Text>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text style={styles.postButtonText}>Đăng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Tiêu đề bài viết..."
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.contentInput}
          placeholder="Bạn đang nghĩ gì?"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Hashtags */}
        <View style={styles.hashtagContainer}>
          <TextInput
            style={styles.hashtagInput}
            placeholder="Nhập hashtag và nhấn Enter..."
            value={currentHashtag}
            onChangeText={setCurrentHashtag}
            onSubmitEditing={handleAddHashtag}
          />
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
          <Text style={styles.imagePickerText}>Thêm ảnh</Text>
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
  hashtagInput: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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
