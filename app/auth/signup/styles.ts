import { StyleSheet, Dimensions } from "react-native";
import { spacing } from "../../../constants/theme";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A8EEA" },
  contentContainer: { flexGrow: 1 },
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
    marginTop: -160,
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

  inputContainer: { marginBottom: spacing.md },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: spacing.xs,
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

  signUpButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    height: 56,
    justifyContent: "center",
  },
  signUpButtonText: { color: "#fff", fontWeight: "700" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#000" },
  dividerText: {
    marginHorizontal: spacing.md,
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },

  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
  },
  socialIcon: { width: 24, height: 24 },
  socialIconPlaceholder: { width: 24, height: 24 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 16, color: "#9CA3AF" },
  footerLink: { fontSize: 16, color: "#000", fontWeight: "700" },
});

export default styles;
