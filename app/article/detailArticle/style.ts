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
    marginBottom: 20,
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
