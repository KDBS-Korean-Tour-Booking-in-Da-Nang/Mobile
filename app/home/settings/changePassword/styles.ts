import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFBF8",
  },
  header: {
    paddingTop: Platform.select({ ios: 50, android: 40 }),
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FEFBF8",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "#FFF9F5",
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: "#2D2D2D",
    marginLeft: 8,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.select({ ios: 100, android: 120 }),
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2D2D2D",
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B8B8B",
    marginBottom: 32,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFE5E5",
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#FF8A9B",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  formContainer: {
    marginBottom: 32,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB3BA",
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
    shadowColor: "#FFB3BA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  inputStyle: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    borderWidth: 1,
  },
});

export default styles;

