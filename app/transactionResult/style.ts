import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
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
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  amountText: {
    fontSize: 25,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    flex: 1,
    textAlign: "right",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#FF3B30",
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default styles;
