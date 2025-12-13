import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backIconButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerSpacer: {
    width: 40,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 20,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyMessagesText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerLeft: {
    alignItems: "flex-start",
  },
  messageContainerRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageBubbleLeft: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 24,
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  messageBubbleRight: {
    backgroundColor: "#B8D4E3", // Pastel blue
    padding: 14,
    borderRadius: 24,
    borderBottomRightRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextLeft: {
    color: "#000",
  },
  messageTextRight: {
    color: "#2C3E50", // Darker text for better contrast on pastel background
  },
  messageContent: {
    flex: 1,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeLeft: {
    color: "#999",
  },
  messageTimeRight: {
    color: "#7A8A99", // Softer gray for pastel theme
  },
  userAvatarContainer: {
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 70,
    width: "100%",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F4F8", // Softer pastel background
    borderRadius: 28, // Large rounded corners
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E8EDF2", // Soft border
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24, // Large rounded corners
    backgroundColor: "#B8D4E3", // Pastel blue
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#D5E3ED", // Lighter pastel when disabled
  },
});

export default styles;

