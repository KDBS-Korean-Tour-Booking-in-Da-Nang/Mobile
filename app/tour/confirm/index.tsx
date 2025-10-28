import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tourEndpoints } from "../../../services/endpoints/tour";
import {
  TourResponse,
  BookingRequest,
  BookingGuestRequest,
} from "../../../src/types/tour";
import styles from "./styles";

export default function ConfirmTour() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const bookingData = params.bookingData
    ? JSON.parse(params.bookingData as string)
    : null;
  const tourId = params.tourId ? Number(params.tourId) : null;
  const userEmailKey = (
    (user as any)?.email ||
    (user as any)?.userEmail ||
    ""
  ).toLowerCase();
  const tourKey = String(tourId ?? "na");
  const pendingKey = `pendingBooking:${userEmailKey}:${tourKey}`;

  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollThreshold = 50;

  React.useEffect(() => {
    const loadTour = async () => {
      if (!tourId) {
        Alert.alert(t("common.error"), t("tour.errors.tourNotFound"));
        goBack();
        return;
      }

      try {
        setLoading(true);
        const tourData = (await tourEndpoints.getById(tourId)).data;
        setTour(tourData);
      } catch (error) {
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
        goBack();
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t, goBack]);

  const handleScroll = React.useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

    if (scrollDifference > scrollThreshold) {
      if (currentScrollY > lastScrollY.current) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  }, []);

  const handleConfirmBooking = async () => {
    if (!tour || !bookingData || !user) {
      Alert.alert(t("common.error"), t("tour.errors.missingData"));
      return;
    }

    try {
      setConfirming(true);

      try {
        const raw = await AsyncStorage.getItem(pendingKey);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.bookingId) {
            const paymentResponse = (
              await tourEndpoints.createBookingPayment({
                bookingId: saved.bookingId,
                userEmail: userEmailKey, 
              })
            ).data;
            if (paymentResponse?.success && paymentResponse?.payUrl) {
              Alert.alert(
                t("tour.confirm.paymentRedirect"),
                `Redirecting to payment page...`,
                [
                  {
                    text: t("common.ok"),
                    onPress: () => {
                      router.push({
                        pathname: "/payment" as any,
                        params: {
                          bookingId: String(saved.bookingId),
                          userEmail: userEmailKey, 
                          amount: (
                            bookingData.adultCount * (tour.adultPrice || 0) +
                            bookingData.childrenCount *
                              (tour.childrenPrice || 0) +
                            bookingData.babyCount * (tour.babyPrice || 0)
                          ).toString(),
                          orderInfo: `Booking payment for tour: ${tour.tourName}`,
                        },
                      });
                    },
                  },
                ]
              );
              return;
            }
          }
        }
      } catch {}
      const guests: BookingGuestRequest[] = [];

      if (bookingData.adultInfo) {
        bookingData.adultInfo.forEach((guest: any) => {
          guests.push({
            fullName: guest.fullName || "Guest",
            birthDate: guest.birthDate
              ? (() => {
                  try {
                    const date = new Date(guest.birthDate);
                    if (isNaN(date.getTime())) {
                      return new Date().toISOString().split("T")[0];
                    }
                    return date.toISOString().split("T")[0];
                  } catch {
                    return new Date().toISOString().split("T")[0];
                  }
                })()
              : new Date().toISOString().split("T")[0],
            gender: (guest.gender || "OTHER").toUpperCase(),
            idNumber: guest.idNumber || "",
            nationality: guest.nationality || "Vietnamese",
            bookingGuestType: "ADULT",
          });
        });
      }

      if (bookingData.childrenInfo) {
        bookingData.childrenInfo.forEach((guest: any) => {
          guests.push({
            fullName: guest.fullName || "Guest",
            birthDate: guest.birthDate
              ? (() => {
                  try {
                    const date = new Date(guest.birthDate);
                    if (isNaN(date.getTime())) {
                      return new Date().toISOString().split("T")[0];
                    }
                    return date.toISOString().split("T")[0];
                  } catch {
                    return new Date().toISOString().split("T")[0];
                  }
                })()
              : new Date().toISOString().split("T")[0],
            gender: (guest.gender || "OTHER").toUpperCase(),
            idNumber: guest.idNumber || "",
            nationality: guest.nationality || "Vietnamese",
            bookingGuestType: "CHILD",
          });
        });
      }

      if (bookingData.babyInfo) {
        bookingData.babyInfo.forEach((guest: any) => {
          guests.push({
            fullName: guest.fullName || "Guest",
            birthDate: guest.birthDate
              ? (() => {
                  try {
                    const date = new Date(guest.birthDate);
                    if (isNaN(date.getTime())) {
                      return new Date().toISOString().split("T")[0];
                    }
                    return date.toISOString().split("T")[0];
                  } catch {
                    return new Date().toISOString().split("T")[0];
                  }
                })()
              : new Date().toISOString().split("T")[0],
            gender: (guest.gender || "OTHER").toUpperCase(),
            idNumber: guest.idNumber || "",
            nationality: guest.nationality || "Vietnamese",
            bookingGuestType: "BABY",
          });
        });
      }

      const sanitizedPhone = (bookingData.customerPhone || "").replace(
        /\D/g,
        ""
      );

      const formatLocalYMD = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const computeDepartureDate = () => {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (bookingData.departureDate) {
            const parsed = new Date(bookingData.departureDate);
            if (!isNaN(parsed.getTime())) {
              const localParsed = new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate()
              );
              if (localParsed > today) return formatLocalYMD(localParsed);
            }
          }
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return formatLocalYMD(tomorrow);
        } catch {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return formatLocalYMD(tomorrow);
        }
      };

      const bookingRequest: BookingRequest = {
        tourId: tour.id,
        contactName:
          bookingData.customerName && bookingData.customerName.trim() !== ""
            ? bookingData.customerName
            : "Guest User",
        contactAddress: bookingData.customerAddress || "",
        contactPhone:
          sanitizedPhone && sanitizedPhone.length === 10
            ? sanitizedPhone
            : "0123456789",
        contactEmail:
          bookingData.customerEmail && bookingData.customerEmail.trim() !== ""
            ? bookingData.customerEmail
            : "user@example.com",
        pickupPoint: bookingData.pickUpPoint || "",
        note: bookingData.note || "",
        departureDate: computeDepartureDate(),
        adultsCount: bookingData.adultCount || 0,
        childrenCount: bookingData.childrenCount || 0,
        babiesCount: bookingData.babyCount || 0,
        bookingGuestRequests: guests,
      };

      if (guests.length === 0) {
        Alert.alert(t("common.error"), "At least one guest is required");
        setConfirming(false);
        return;
      }

      const bookingResponse = (
        await tourEndpoints.createBooking(bookingRequest)
      ).data;

      try {
        await AsyncStorage.setItem(
          pendingKey,
          JSON.stringify({
            bookingId: bookingResponse.bookingId,
            ts: Date.now(),
          })
        );
      } catch {}

      const paymentResponse = (
        await tourEndpoints.createBookingPayment({
          bookingId: bookingResponse.bookingId,
          userEmail: userEmailKey
        })
      ).data;

      if (paymentResponse.success && paymentResponse.payUrl) {
        Alert.alert(
          t("tour.confirm.paymentRedirect"),
          `Booking created successfully!\nRedirecting to payment page...`,
          [
            {
              text: t("common.ok"),
              onPress: () => {
                router.push({
                  pathname: "/payment" as any,
                  params: {
                    bookingId: bookingResponse.bookingId.toString(),
                    userEmail: userEmailKey, 
                    amount: (
                      bookingData.adultCount * (tour.adultPrice || 0) +
                      bookingData.childrenCount * (tour.childrenPrice || 0) +
                      bookingData.babyCount * (tour.babyPrice || 0)
                    ).toString(),
                    orderInfo: `Booking payment for tour: ${tour.tourName}`,
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(t("common.error"), t("tour.errors.paymentFailed"), [
          {
            text: t("common.ok"),
            onPress: () => {
              goBack();
            },
          },
        ]);
      }
    } catch (error: any) {

      if (error.response) {
      
      } else if (error.request) {
      } else {
      }

      Alert.alert(
        t("common.error"),
        `Booking failed: ${
          error.response?.data?.message ||
          error.message ||
          t("tour.errors.bookingFailed")
        }`
      );
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <MainLayout isNavVisible={isNavVisible}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("tour.loading")}</Text>
        </View>
      </MainLayout>
    );
  }

  if (!tour || !bookingData) {
    return (
      <MainLayout isNavVisible={isNavVisible}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t("tour.errors.missingData")}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={goBack}>
            <Text style={styles.retryButtonText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout isNavVisible={isNavVisible}>
      <ScrollView
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.tourInfo")}
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.tourHeader}>
                <Text style={styles.tourName}>{tour.tourName}</Text>
                <View style={styles.tourMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {tour.tourDeparturePoint}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{tour.tourDuration}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tourDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t("tour.detail.type")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {t(`tour.types.${tour.tourType}`)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t("tour.detail.vehicle")}
                  </Text>
                  <Text style={styles.detailValue}>{tour.tourVehicle}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.contactInfo")}
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.contactHeader}>
                <View style={styles.contactAvatar}>
                  <Ionicons name="person" size={24} color="#007AFF" />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {bookingData.customerName}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {bookingData.customerPhone}
                  </Text>
                </View>
              </View>

              <View style={styles.contactDetails}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={16} color="#666" />
                  <Text style={styles.contactText}>
                    {bookingData.customerEmail}
                  </Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.contactText}>
                    {bookingData.customerAddress}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.bookingInfo")}
            </Text>
          </View>

          <View style={styles.section}>
            {bookingData.adultInfo && bookingData.adultInfo.length > 0 && (
              <View style={styles.guestSection}>
                <Text style={styles.guestSectionTitle}>
                  {t("tour.booking.adult")} ({bookingData.adultInfo.length})
                </Text>
                {bookingData.adultInfo.map((guest: any, index: number) => (
                  <View key={index} style={styles.guestCard}>
                    <View style={styles.guestHeader}>
                      <Ionicons name="person" size={20} color="#007AFF" />
                      <Text style={styles.guestName}>{guest.fullName}</Text>
                    </View>
                    <View style={styles.guestDetails}>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.dateOfBirth")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.birthDate}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.gender")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {t(`tour.booking.${guest.gender?.toLowerCase()}`)}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.nationality")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.nationality}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.idNumber")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.idNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {bookingData.childrenInfo &&
              bookingData.childrenInfo.length > 0 && (
                <View style={styles.guestSection}>
                  <Text style={styles.guestSectionTitle}>
                    {t("tour.booking.children")} (
                    {bookingData.childrenInfo.length})
                  </Text>
                  {bookingData.childrenInfo.map((guest: any, index: number) => (
                    <View key={index} style={styles.guestCard}>
                      <View style={styles.guestHeader}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#FF9500"
                        />
                        <Text style={styles.guestName}>{guest.fullName}</Text>
                      </View>
                      <View style={styles.guestDetails}>
                        <View style={styles.guestDetailRow}>
                          <Text style={styles.guestDetailLabel}>
                            {t("tour.booking.dateOfBirth")}:
                          </Text>
                          <Text style={styles.guestDetailValue}>
                            {guest.birthDate}
                          </Text>
                        </View>
                        <View style={styles.guestDetailRow}>
                          <Text style={styles.guestDetailLabel}>
                            {t("tour.booking.gender")}:
                          </Text>
                          <Text style={styles.guestDetailValue}>
                            {t(`tour.booking.${guest.gender?.toLowerCase()}`)}
                          </Text>
                        </View>
                        <View style={styles.guestDetailRow}>
                          <Text style={styles.guestDetailLabel}>
                            {t("tour.booking.nationality")}:
                          </Text>
                          <Text style={styles.guestDetailValue}>
                            {guest.nationality}
                          </Text>
                        </View>
                        <View style={styles.guestDetailRow}>
                          <Text style={styles.guestDetailLabel}>
                            {t("tour.booking.idNumber")}:
                          </Text>
                          <Text style={styles.guestDetailValue}>
                            {guest.idNumber}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

            {bookingData.babyInfo && bookingData.babyInfo.length > 0 && (
              <View style={styles.guestSection}>
                <Text style={styles.guestSectionTitle}>
                  {t("tour.booking.baby")} ({bookingData.babyInfo.length})
                </Text>
                {bookingData.babyInfo.map((guest: any, index: number) => (
                  <View key={index} style={styles.guestCard}>
                    <View style={styles.guestHeader}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#34C759"
                      />
                      <Text style={styles.guestName}>{guest.fullName}</Text>
                    </View>
                    <View style={styles.guestDetails}>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.dateOfBirth")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.birthDate}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.gender")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {t(`tour.booking.${guest.gender?.toLowerCase()}`)}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.nationality")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.nationality}
                        </Text>
                      </View>
                      <View style={styles.guestDetailRow}>
                        <Text style={styles.guestDetailLabel}>
                          {t("tour.booking.idNumber")}:
                        </Text>
                        <Text style={styles.guestDetailValue}>
                          {guest.idNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.priceSummary")}
            </Text>

            <View style={styles.priceCard}>
              <View style={styles.priceItems}>
                <View style={styles.priceItem}>
                  <View style={styles.priceItemLeft}>
                    <Text style={styles.priceItemLabel}>
                      {bookingData.adultCount} {t("tour.booking.adultCount")}
                    </Text>
                    <Text style={styles.priceItemUnit}>
                      {tour.adultPrice?.toLocaleString()} VND/person
                    </Text>
                  </View>
                  <Text style={styles.priceItemValue}>
                    {(
                      bookingData.adultCount * (tour.adultPrice || 0)
                    ).toLocaleString()}{" "}
                    VND
                  </Text>
                </View>

                {bookingData.childrenCount > 0 && (
                  <View style={styles.priceItem}>
                    <View style={styles.priceItemLeft}>
                      <Text style={styles.priceItemLabel}>
                        {bookingData.childrenCount}{" "}
                        {t("tour.booking.childrenCount")}
                      </Text>
                      <Text style={styles.priceItemUnit}>
                        {tour.childrenPrice?.toLocaleString()} VND/person
                      </Text>
                    </View>
                    <Text style={styles.priceItemValue}>
                      {(
                        bookingData.childrenCount * (tour.childrenPrice || 0)
                      ).toLocaleString()}{" "}
                      VND
                    </Text>
                  </View>
                )}

                {bookingData.babyCount > 0 && (
                  <View style={styles.priceItem}>
                    <View style={styles.priceItemLeft}>
                      <Text style={styles.priceItemLabel}>
                        {bookingData.babyCount} {t("tour.booking.babyCount")}
                      </Text>
                      <Text style={styles.priceItemUnit}>
                        {tour.babyPrice?.toLocaleString()} VND/person
                      </Text>
                    </View>
                    <Text style={styles.priceItemValue}>
                      {(
                        bookingData.babyCount * (tour.babyPrice || 0)
                      ).toLocaleString()}{" "}
                      VND
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.priceDivider} />

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>{t("tour.confirm.total")}</Text>
                <Text style={styles.totalValue}>
                  {(
                    bookingData.adultCount * (tour.adultPrice || 0) +
                    bookingData.childrenCount * (tour.childrenPrice || 0) +
                    bookingData.babyCount * (tour.babyPrice || 0)
                  ).toLocaleString()}{" "}
                  VND
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirming && styles.confirmButtonDisabled,
              { marginBottom: 40 }
            ]}
            onPress={handleConfirmBooking}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {t("tour.confirm.confirmBooking")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MainLayout>
  );
}
