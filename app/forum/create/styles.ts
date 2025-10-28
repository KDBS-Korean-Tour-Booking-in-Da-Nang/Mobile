import { StyleSheet } from "react-native";
import { colors, spacing, borderRadius } from "../../../constants/theme";

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

export default styles;
