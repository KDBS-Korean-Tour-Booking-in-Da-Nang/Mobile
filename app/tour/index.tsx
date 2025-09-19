import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../src/components/MainLayout";
import { typography } from "../../src/constants/theme";
import { useNavigation } from "../../src/navigation";
import BookingButton from "../../src/components/BookingButton";
import { useTranslation } from "react-i18next";

export default function TourDetail() {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
            }}
            style={styles.heroImage}
          />
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          {/* Title and location overlay inside image */}
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayTitle}>Nui Phu Si</Text>
            <View style={styles.overlayRow}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.overlayLocation}>Da Nang</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title and location moved into image overlay */}

          {/* Meta grid: RATING | TYPE | ESTIMATE | VEHICLE */}
          <View style={styles.metaBox}>
            <View style={styles.metaRowContent}>
              {/* Rating */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>RATING</Text>
                <View style={styles.metaValueRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.metaValue}>4.5</Text>
                </View>
              </View>
              <View style={styles.metaDivider} />
              {/* Type */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>TYPE</Text>
                <Text style={styles.metaValue}>Open Trip</Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Estimate */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>ESTIMATE</Text>
                <Text style={styles.metaValue}>3D 2N</Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Vehicle */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>VEHICLE</Text>
                <Text style={styles.metaValue}>Car</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {t("tour.detail.description")}
          </Text>
          <Text style={styles.paragraph}>
            Mount Semeru or Mount Meru is a cone volcano in East Java,
            Indonesia. Mount Semeru is the highest mountain on the island of
            Java, with its peak Mahameru, 3,676 meters above sea level.
          </Text>

          <View style={styles.card}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.amount")}</Text>
                <Text style={styles.infoValue}>20</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.adult")}</Text>
                <Text style={styles.infoValue}>3,200,000 Đ</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>
                  {t("tour.detail.children")}
                </Text>
                <Text style={styles.infoValue}>1,800,000 Đ</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.baby")}</Text>
                <Text style={styles.infoValue}>900,000 Đ</Text>
              </View>
            </View>
          </View>

          {/* Itinerary Blocks */}
          {[1, 2, 3].map((idx) => (
            <View key={idx} style={styles.sectionBlock}>
              <View style={styles.blockBox} />
              <View style={styles.blockHeader}>
                <Text style={styles.blockHeaderText}>
                  {t("tour.detail.destination")}
                </Text>
              </View>
            </View>
          ))}

          {/* Booking button appears at the very end of content */}
          <BookingButton onPress={() => navigate("/buyingTour")} />
          {/* Spacer after button so it's fully visible above system/nav bars when scrolled to end */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  imageWrapper: {
    position: "relative",
    margin: 12,
    marginTop: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: 260, borderRadius: 16 },
  backBtn: { position: "absolute", top: 12, left: 12 },
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
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  overlayLocation: { fontSize: typography.body2.fontSize, color: "#fff" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  metaBox: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#eee",
    paddingVertical: 12,
    marginBottom: 24,
  },
  metaRowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  metaCol: { flex: 1, paddingHorizontal: 8, alignItems: "center" },
  metaDivider: { width: 2, backgroundColor: "#e0e0e0", alignSelf: "stretch" },
  metaLabelCaps: {
    fontSize: typography.body2.fontSize,
    color: "#6c757d",
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: "700",
    textAlign: "center",
  },
  metaValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  paragraph: { fontSize: 13, lineHeight: 18, color: "#555", marginBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#cfcfcf",
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  infoCol: { flex: 1, alignItems: "center" },
  infoDivider: {
    width: 2,
    backgroundColor: "#cfcfcf",
    borderRadius: 1,
    marginHorizontal: 6,
  },
  infoLabel: {
    fontSize: typography.caption.fontSize,
    color: "#9e9e9e",
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 24,
    color: "#111",
    fontWeight: "800",
    textAlign: "center",
  },
  sectionBlock: {
    marginTop: 36,
    marginBottom: 24,
    paddingHorizontal: 8,
    position: "relative",
  },
  blockHeader: {
    position: "absolute",
    top: -22,
    left: 7,
    right: 7,
    height: 44,
    backgroundColor: "#b9ffcc",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#b0e8c0",
    alignItems: "center",
    justifyContent: "center",
  },
  blockHeaderText: { fontSize: 16, fontWeight: "700", color: "#111" },
  blockBox: {
    height: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  bottomSpace: { height: 140 },
});
