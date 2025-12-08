import { StyleSheet } from "react-native";

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flexGrow: 1,
    maxHeight: "60%",
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#212529",
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666",
  },
  reasonContainer: {
    gap: 12,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  reasonButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  reasonButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  reasonButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  reasonButtonTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

