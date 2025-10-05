import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import MainLayout from "../../../src/components/MainLayout";
import { useNavigation } from "../../../src/navigation";
import { tourEndpoints } from "../../../src/endpoints/tour";
import { BookingResponse } from "../../../src/types/tour";

export default function BookingView() {
  const { id, bookingId: bookingIdParam } = useLocalSearchParams();
  const bookingId = id
    ? Number(id)
    : bookingIdParam
    ? Number(bookingIdParam)
    : NaN;
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [booking, setBooking] = React.useState<BookingResponse | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!bookingId || Number.isNaN(bookingId)) {
        setError(t("tour.errors.missingData"));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await tourEndpoints.getBookingById(bookingId);
        setBooking(res.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || t("tour.errors.bookingFailed")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId, t]);

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("tour.loading")}</Text>
        </View>
      </MainLayout>
    );
  }

  if (error || !booking) {
    return (
      <MainLayout>
        <View style={styles.centerWrap}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>
            {error || t("tour.errors.notFound")}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={goBack}>
            <Text style={styles.retryButtonText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payment.result.details")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{booking.tourName}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t("payment.result.bookingId")}</Text>
            <Text style={styles.value}>{booking.bookingId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t("payment.result.orderId")}</Text>
            <Text style={styles.value}>{booking.bookingId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t("tour.booking.departureDate")}</Text>
            <Text style={styles.value}>{booking.departureDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t("tour.booking.totalGuests")}</Text>
            <Text style={styles.value}>{booking.totalGuests}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t("tour.confirm.contactInfo")}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t("tour.booking.fullName")}</Text>
            <Text style={styles.value}>{booking.contactName}</Text>
          </View>
          {!!booking.contactPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.phoneNumber")}</Text>
              <Text style={styles.value}>{booking.contactPhone}</Text>
            </View>
          )}
          {!!booking.contactEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.email")}</Text>
              <Text style={styles.value}>{booking.contactEmail}</Text>
            </View>
          )}
          {!!booking.contactAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.address")}</Text>
              <Text style={styles.value}>{booking.contactAddress}</Text>
            </View>
          )}
          {!!booking.pickupPoint && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.pickUpPoint")}</Text>
              <Text style={styles.value}>{booking.pickupPoint}</Text>
            </View>
          )}
          {!!booking.note && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.note")}</Text>
              <Text style={styles.value}>{booking.note}</Text>
            </View>
          )}
        </View>

        {booking.guests?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.guestDetails")}
            </Text>
            {booking.guests.map((g, idx) => (
              <View key={g.bookingGuestId || idx} style={styles.guestItem}>
                <Text style={styles.guestIndex}>{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{g.fullName}</Text>
                  <Text style={styles.guestMeta}>
                    {t("tour.booking.gender")}: {g.gender}
                  </Text>
                  <Text style={styles.guestMeta}>
                    {t("tour.booking.nationality")}: {g.nationality}
                  </Text>
                  <Text style={styles.guestMeta}>
                    {t("tour.booking.idNumber")}: {g.idNumber || t("common.na")}
                  </Text>
                  <Text style={styles.guestMeta}>
                    {t("tour.booking.dateOfBirth")}: {g.birthDate}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    position: "relative",
    zIndex: 2,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  label: {
    color: "#666",
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  guestItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  guestIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E7F0FF",
    color: "#1E63F3",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
    marginRight: 10,
  },
  guestName: {
    fontWeight: "700",
    color: "#000",
  },
  guestMeta: {
    color: "#444",
    marginTop: 2,
  },
});
