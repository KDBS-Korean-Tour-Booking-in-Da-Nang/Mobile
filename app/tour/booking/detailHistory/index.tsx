import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import MainLayout from "../../../../src/components/MainLayout";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../../../src/endpoints/tour";
import { BookingResponse, TourResponse } from "../../../../src/types/tour";

export default function BookingDetail() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();

  const bookingId = params.bookingId
    ? Number(
        Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId
      )
    : NaN;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      if (!bookingId || Number.isNaN(bookingId)) return;
      const data = (await tourEndpoints.getBookingById(bookingId)).data;
      setBooking(data);

      try {
        const tour: TourResponse = (await tourEndpoints.getById(data.tourId))
          .data;
        const total =
          (tour.adultPrice || 0) * (data.adultsCount || 0) +
          (tour.childrenPrice || 0) * (data.childrenCount || 0) +
          (tour.babyPrice || 0) * (data.babiesCount || 0);
        setTotalAmount(total);
      } catch {
        setTotalAmount(null);
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <MainLayout>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Text>{t("tour.errors.missingData")}</Text>
        </View>
      </MainLayout>
    );
  }

  const renderGuestType = (bookingGuestType?: string) => {
    const gt = String(bookingGuestType || "").toUpperCase();
    if (gt === "ADULT") return t("tour.detail.adult");
    if (gt === "CHILD" || gt === "CHILDREN") return t("tour.detail.children");
    if (gt === "BABY") return t("tour.detail.baby");
    return t("common.na");
  };

  const formatPrice = (price: number) =>
    (price || 0).toLocaleString("vi-VN") + " VND";

  return (
    <MainLayout>
      <ScrollView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 20,
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#e9ecef",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f8f9fa",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "600", color: "#000" }}>
            {t("tour.confirm.tourInfo")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#eef2f5",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              {booking.tourName}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("payment.result.status")}
              </Text>
              <Text style={{ fontWeight: "700", color: "#2e7d32" }}>
                {t("payment.result.success")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.departureDate")}
              </Text>
              <Text style={{ fontWeight: "600" }}>{booking.departureDate}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.totalGuests")}
              </Text>
              <Text style={{ fontWeight: "600" }}>{booking.totalGuests}</Text>
            </View>
            {typeof totalAmount === "number" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "#6c757d" }}>
                  {t("tour.confirm.priceSummary")}
                </Text>
                <Text style={{ fontWeight: "700", color: "#111" }}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>
            )}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.pickUpPoint")}
              </Text>
              <Text style={{ fontWeight: "600" }}>
                {booking.pickupPoint || t("common.na")}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#eef2f5",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              {t("tour.confirm.contactInfo")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.fullName")}
              </Text>
              <Text style={{ fontWeight: "600" }}>{booking.contactName}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.phoneNumber")}
              </Text>
              <Text style={{ fontWeight: "600" }}>{booking.contactPhone}</Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#6c757d" }}>
                {t("tour.booking.email")}
              </Text>
              <Text style={{ fontWeight: "600" }}>
                {booking.contactEmail || t("common.na")}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#eef2f5",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              {t("tour.confirm.guestDetails")}
            </Text>
            {booking.guests && booking.guests.length > 0 ? (
              booking.guests.map((g) => (
                <View
                  key={g.bookingGuestId}
                  style={{
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f3f5",
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>{g.fullName}</Text>
                  <Text style={{ color: "#6c757d" }}>
                    {t("tour.booking.gender")}: {g.gender} ·{" "}
                    {t("tour.booking.idNumber")}: {g.idNumber} ·{" "}
                    {renderGuestType(g.bookingGuestType)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: "#6c757d" }}>{t("common.na")}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
}
