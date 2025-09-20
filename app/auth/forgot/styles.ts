import { StyleSheet, Dimensions } from "react-native";
import { spacing } from "../../../src/constants/theme";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A8EEA" },
  scrollContent: { flexGrow: 1 },

  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  illustration: { width: width * 0.8, height: width * 0.8 },

  formCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: -140,
  },
  formTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000",
    marginBottom: spacing.sm,
    textAlign: "left",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#000",
    marginBottom: spacing.xl,
    textAlign: "left",
  },

  inputContainer: { marginBottom: spacing.lg },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#000",
  },

  sendButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: "#fff", fontWeight: "700" },
});

export default styles;
