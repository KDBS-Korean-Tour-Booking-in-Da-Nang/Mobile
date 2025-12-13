import { StyleSheet, Dimensions, Platform, StatusBar } from "react-native";
import { spacing } from "../../../constants/theme";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A8EEA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 5,
    height: width * 0.4,
  },
  illustration: {
    width: width * 0.55,
    height: width * 0.55,
  },
  formCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
    marginTop: 0,
    flex: 1,
  },
  formTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: "#000",
    marginBottom: spacing.sm,
    textAlign: "left",
  },
  formSubtitle: {
    fontSize: 15,
    color: "#000",
    marginBottom: spacing.lg,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: spacing.lg,
    position: "relative",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: spacing.sm,
  },
  emailInput: {
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#000",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#000",
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    padding: spacing.sm,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "#000",
    borderRadius: 28,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    height: 54,
    justifyContent: "center",
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: spacing.sm,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
  },
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
    marginBottom: spacing.lg,
  },
  socialButton: {
    width: 56,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    marginHorizontal: spacing.md,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  signupText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  signupLink: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
});

export default styles;
