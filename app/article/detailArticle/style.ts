import { StyleSheet } from "react-native";
import { colors } from "../../../constants/theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  overlayBackButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginLeft: 4,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  articleContainer: {
    backgroundColor: "#FFFFFF",
  },
  articleImageContainer: {
    height: 200,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  articleImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
  },
  articleContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    lineHeight: 32,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  articleAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  articleAuthorText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  articleDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  articleTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  articleTag: {
    fontSize: 12,
    color: "#007AFF",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  articleSummary: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  articleBody: {
    marginBottom: 32,
  },
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginLeft: 8,
  },
  translateButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  contentImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: "#212529",
    lineHeight: 26,
    textAlign: "justify",
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  sourceButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  commentsSection: {
    marginTop: 32,
    marginHorizontal: -16, // Offset articleContent padding
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  commentsHeader: {
    marginBottom: 20,
    marginHorizontal: 0,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  commentInputContainer: {
    marginBottom: 28,
    marginHorizontal: 0,
  },
  commentInputWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentInput: {
    padding: 14,
    fontSize: 16,
    color: "#212529",
    minHeight: 90,
    maxHeight: 130,
    lineHeight: 22,
  },
  commentSubmitButton: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  commentSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  commentSubmitButtonTextDisabled: {
    color: "#999",
  },
  commentsLoadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  noCommentsContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  noCommentsText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  commentsList: {
    gap: 20,
    paddingHorizontal: 8,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
    marginHorizontal: 0,
    paddingTop: 8,
  },
  commentAvatarContainer: {
    marginRight: 10,
    marginLeft: 4,
    marginTop: 2,
  },
  commentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  commentAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  commentContent: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 16,
    marginLeft: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  commentUserName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#212529",
    lineHeight: 22,
    marginTop: 2,
  },
});

export const contentHtmlCss = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; padding: 0; margin: 0; color: #212529; }
  .container { padding: 0 12px 20px 12px; }
  p, div { font-size: 16px; line-height: 26px; text-align: justify; }
  img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 0 12px 0 !important; background: #F5F5F5; }
  iframe, video { max-width: 100%; }
  .introtext { background: transparent; padding: 0; border-radius: 0; margin: 0 0 12px 0; font-style: italic; }
  .fulltext { text-align: center; }
  .fulltext img { margin: 1rem auto !important; display: block !important; }
`;
