import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import MainLayout from "../../../src/components/MainLayout";
import { useNavigation } from "../../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
import { tourService } from "../../../src/services/tourService";
import {
  TourResponse,
  BookingRequest,
  GuestRequest,
} from "../../../src/types/tour";
import styles from "./styles";

export default function ConfirmTour() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  // Get booking data from params
  const bookingData = params.bookingData
    ? JSON.parse(params.bookingData as string)
    : null;
  const tourId = params.tourId ? Number(params.tourId) : null;

  // Tour data
  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  // Navigation scroll effects
  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollThreshold = 50;

  // Load tour data
  React.useEffect(() => {
    const loadTour = async () => {
      if (!tourId) {
        Alert.alert(t("common.error"), t("tour.errors.tourNotFound"));
        goBack();
        return;
      }

      try {
        setLoading(true);
        const tourData = await tourService.getTourById(tourId);
        setTour(tourData);
      } catch (error) {
        console.error("Error loading tour:", error);
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
        goBack();
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t, goBack]);

  // Handle scroll for navigation effects
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

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    if (!tour || !bookingData || !user) {
      Alert.alert(t("common.error"), t("tour.errors.missingData"));
      return;
    }

    try {
      setConfirming(true);

      // Prepare guests data
      const guests: GuestRequest[] = [];

      // Add adult guests
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
            idNumber: guest.idNumber || "000000000",
            nationality: guest.nationality || "Vietnamese",
            guestType: "ADULT",
          });
        });
      }

      // Add children guests
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
            idNumber: guest.idNumber || "000000000",
            nationality: guest.nationality || "Vietnamese",
            guestType: "CHILD", // Fixed: CHILD not CHILDREN
          });
        });
      }

      // Add baby guests
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
            idNumber: guest.idNumber || "000000000",
            nationality: guest.nationality || "Vietnamese",
            guestType: "BABY",
          });
        });
      }

      // Create booking request
      const bookingRequest: BookingRequest = {
        tourId: tour.id,
        contactName:
          bookingData.customerName && bookingData.customerName.trim() !== ""
            ? bookingData.customerName
            : "Guest User",
        contactAddress: bookingData.customerAddress || "",
        contactPhone:
          bookingData.customerPhone && bookingData.customerPhone.trim() !== ""
            ? bookingData.customerPhone
            : "0123456789",
        contactEmail:
          bookingData.customerEmail && bookingData.customerEmail.trim() !== ""
            ? bookingData.customerEmail
            : "user@example.com",
        pickupPoint: bookingData.pickUpPoint || "",
        note: bookingData.note || "",
        departureDate: bookingData.departureDate
          ? (() => {
              try {
                const date = new Date(bookingData.departureDate);
                if (isNaN(date.getTime())) {
                  return new Date(Date.now() + 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0];
                }
                return date.toISOString().split("T")[0];
              } catch {
                return new Date(Date.now() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0];
              }
            })()
          : new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0], // Tomorrow's date as default
        adultsCount: bookingData.adultCount || 0,
        childrenCount: bookingData.childrenCount || 0,
        babiesCount: bookingData.babyCount || 0,
        guests: guests,
      };

      // Validate guests
      if (guests.length === 0) {
        Alert.alert(t("common.error"), "At least one guest is required");
        setConfirming(false);
        return;
      }

      // Debug: Log booking request
      console.log("=== BOOKING DEBUG ===");
      console.log("Tour ID:", tour.id);
      console.log("Booking Data:", JSON.stringify(bookingData, null, 2));
      console.log("Booking Request:", JSON.stringify(bookingRequest, null, 2));
      console.log("Guests:", JSON.stringify(guests, null, 2));
      console.log("Adults Count:", bookingData.adultCount);
      console.log("Children Count:", bookingData.childrenCount);
      console.log("Babies Count:", bookingData.babyCount);
      console.log("===================");

      // Create booking
      const bookingResponse = await tourService.createBooking(bookingRequest);

      // Create payment for the booking
      const paymentResponse = await tourService.createBookingPayment({
        bookingId: bookingResponse.bookingId,
        userEmail: bookingRequest.contactEmail || "user@example.com",
      });

      if (paymentResponse.success && paymentResponse.payUrl) {
        // Redirect to VNPay payment page with bank transfer form
        Alert.alert(
          t("tour.confirm.paymentRedirect"),
          `Booking created successfully!\nBooking ID: ${bookingResponse.bookingId}\n\nRedirecting to VNPay payment page...\n\nPlease select "Bank Transfer" option and enter your bank account information.`,
          [
            {
              text: t("common.ok"),
              onPress: async () => {
                try {
                  // Open VNPay payment page in browser
                  const supported = await Linking.canOpenURL(
                    paymentResponse.payUrl
                  );
                  if (supported) {
                    await Linking.openURL(paymentResponse.payUrl);
                  } else {
                    Alert.alert(
                      t("common.error"),
                      "Cannot open payment page. Please try again."
                    );
                  }
                } catch (error) {
                  console.error("Error opening payment URL:", error);
                  Alert.alert(
                    t("common.error"),
                    "Failed to open payment page. Please try again."
                  );
                }
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
      console.error("Error confirming booking:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
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
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Tour Information */}
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
                  <Text style={styles.detailValue}>
                    {t(`tour.vehicles.${tour.tourVehicle}`)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information */}
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

          {/* Booking Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.bookingInfo")}
            </Text>
          </View>

          {/* Guest Details */}
          <View style={styles.section}>
            {/* Adult Guests */}
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

            {/* Children Guests */}
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

            {/* Baby Guests */}
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

          {/* Price Summary */}
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

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirming && styles.confirmButtonDisabled,
              { marginBottom: 40 }, // Thêm margin bottom để không bị che bởi thanh Android
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
