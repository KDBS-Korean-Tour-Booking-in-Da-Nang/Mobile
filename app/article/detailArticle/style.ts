import { StyleSheet } from "react-native";
import { colors } from "../../../constants/theme";

const styles = StyleSheet.create({
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
    marginHorizontal: 16,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
  },
  commentsHeader: {
    marginBottom: 20,
    marginHorizontal: 0,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  commentInputContainer: {
    marginBottom: 28,
    marginHorizontal: 0,
  },
  commentInputWrapper: {
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  commentInput: {
    padding: 16,
    fontSize: 15,
    color: "#111",
    minHeight: 100,
    maxHeight: 140,
    lineHeight: 22,
  },
  commentSubmitButton: {
    alignSelf: "flex-end",
    backgroundColor: "#5BA3FF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#5BA3FF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#F0F0F0",
  },
  commentSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  commentSubmitButtonTextDisabled: {
    color: "#CCC",
  },
  commentsLoadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  noCommentsContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
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
    marginBottom: 16,
    marginHorizontal: 0,
    paddingTop: 8,
  },
  commentAvatarContainer: {
    marginRight: 12,
    marginLeft: 0,
    marginTop: 2,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    borderWidth: 2,
    borderColor: "#F5F5F5",
  },
  commentAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F5F5F5",
  },
  commentContent: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    padding: 16,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    color: "#111",
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    marginTop: 4,
  },
  suggestToursSection: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    borderRadius: 28,
  },
  suggestToursHeader: {
    marginBottom: 16,
  },
  suggestToursTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    letterSpacing: -0.3,
  },
  suggestToursLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  suggestToursList: {
    marginHorizontal: -20,
    paddingHorizontal: 4,
  },
  suggestTourCard: {
    width: 200,
    marginLeft: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  suggestTourImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  suggestTourContent: {
    padding: 14,
  },
  suggestTourName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  suggestTourPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary.main,
  },
  suggestToursEmpty: {
    paddingVertical: 20,
    alignItems: "center",
  },
  suggestToursEmptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default styles;

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
