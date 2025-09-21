import { StyleSheet } from "react-native";
import { typography } from "../../../src/constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },

  // Header Image Styles
  imageWrapper: {
    position: "relative",
    margin: 12,
    marginTop: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
  },
  backBtn: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  backCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  overlayTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: "600",
    color: "#fff",
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  overlayLocation: {
    fontSize: typography.body2.fontSize,
    color: "#fff",
  },

  // Content Styles
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Guest Details Styles
  guestSection: {
    marginBottom: 20,
  },
  guestSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  guestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  guestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  guestDetails: {
    gap: 8,
  },
  guestDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guestDetailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  guestDetailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    flex: 2,
    textAlign: "right",
  },

  // Price Card Styles
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    fontSize: 16,
    color: "#111",
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    color: "#2F9E44",
    fontWeight: "800",
  },

  // Confirm Button Styles
  confirmButton: {
    backgroundColor: "#2F9E44",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  confirmButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Loading and Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // New Tour Information Styles
  tourHeader: {
    marginBottom: 16,
  },
  tourName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    lineHeight: 26,
  },
  tourMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  tourDetails: {
    flexDirection: "row",
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  // Contact Information Styles
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  contactDetails: {
    gap: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },

  // Booking Information Styles
  bookingSummary: {
    gap: 16,
  },
  guestSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  guestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  guestText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  bookingDetails: {
    gap: 12,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bookingText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },

  // Enhanced Price Summary Styles
  priceItems: {
    gap: 16,
  },
  priceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priceItemLeft: {
    flex: 1,
  },
  priceItemLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  priceItemUnit: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  priceItemValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "right",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default styles;
