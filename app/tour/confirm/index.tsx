import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { tourEndpoints } from "../../../services/endpoints/tour";
import { voucherEndpoints } from "../../../services/endpoints/voucher";
import { useAuthContext } from "../../../src/contexts/authContext";
import { TourResponse } from "../../../src/types/response/tour.response";
import {
  ApplyVoucherResponse,
  VoucherDiscountType,
  VoucherResponse,
} from "../../../src/types/response/voucher.response";
import {
  formatPriceKRW,
  formatPriceKRWNumber,
} from "../../../src/utils/currency";
import styles from "./styles";

export default function ConfirmTour() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();

  const initialBookingData = params.bookingData
    ? JSON.parse(
        Array.isArray(params.bookingData)
          ? params.bookingData[0]
          : (params.bookingData as string)
      )
    : null;
  const voucherDataParam = params.voucherData
    ? Array.isArray(params.voucherData)
      ? params.voucherData[0]
      : params.voucherData
    : "";

  const voucherFromParams: VoucherResponse | null = React.useMemo(() => {
    if (!voucherDataParam) return null;
    try {
      const parsed = JSON.parse(String(voucherDataParam));
      if (parsed && parsed.code) {
        return parsed as VoucherResponse;
      }
    } catch {}
    return null;
  }, [voucherDataParam]);
  const bookingIdParam = Array.isArray(params.bookingId)
    ? params.bookingId[0]
    : params.bookingId;
  const tourIdParam = Array.isArray(params.tourId)
    ? params.tourId[0]
    : params.tourId;
  const initialBookingId = bookingIdParam ? Number(bookingIdParam) : null;
  const initialTourId = tourIdParam ? Number(tourIdParam) : null;

  const [bookingData, setBookingData] = React.useState<any | null>(
    initialBookingData
  );
  const [currentBookingId, setCurrentBookingId] = React.useState<number | null>(
    initialBookingId
  );
  const [currentTourId, setCurrentTourId] = React.useState<number | null>(
    initialTourId
  );

  const resolvedEmail =
    (user as any)?.email ||
    (user as any)?.userEmail ||
    bookingData?.customerEmail ||
    "";
  const userEmailKey = String(resolvedEmail || "")
    .trim()
    .toLowerCase();
  const tourKey = String(currentTourId ?? "na");
  const pendingKey = `pendingBooking:${userEmailKey}:${tourKey}`;

  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);
  const [bookingStatus, setBookingStatus] = React.useState<string>("");
  const [voucherPreview, setVoucherPreview] =
    React.useState<ApplyVoucherResponse | null>(null);
  const [bookingResponse, setBookingResponse] = React.useState<any | null>(null);

  React.useEffect(() => {
    try {
    } catch {}
  }, []);

  const normalizeDateString = React.useCallback((value: any): string | null => {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const match = trimmed.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})$/);
      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {}
    return null;
  }, []);

  const formatDisplayDate = React.useCallback(
    (value: any): string => {
      const normalized = normalizeDateString(value);
      if (!normalized) return "";
      const [yyyy, mm, dd] = normalized.split("-");
      return `${dd}/${mm}/${yyyy}`;
    },
    [normalizeDateString]
  );

  const originalTotal = React.useMemo(() => {
    if (!bookingData || !tour) return 0;
    const adultTotal =
      Number(bookingData.adultCount || 0) * Number(tour.adultPrice || 0);
    const childTotal =
      Number(bookingData.childrenCount || 0) * Number(tour.childrenPrice || 0);
    const babyTotal =
      Number(bookingData.babyCount || 0) * Number(tour.babyPrice || 0);
    return adultTotal + childTotal + babyTotal;
  }, [bookingData, tour]);

  const computedDiscount = React.useMemo(() => {
    if (!voucherFromParams) return 0;
    const base = originalTotal || 0;
    if (base <= 0) return 0;
    const discountTypeStr = String(voucherFromParams.discountType || "").toUpperCase();
    if (discountTypeStr === "PERCENT" || discountTypeStr === VoucherDiscountType.PERCENT) {
      return Math.floor(
        (base * Number(voucherFromParams.discountValue || 0)) / 100
      );
    }
    return Number(voucherFromParams.discountValue || 0);
  }, [voucherFromParams, originalTotal]);

  const discountAmount = React.useMemo(() => {
    if (voucherPreview?.discountAmount !== undefined) {
      return Math.max(Number(voucherPreview.discountAmount || 0), 0);
    }
    return Math.min(
    Math.max(computedDiscount, 0),
    Math.max(originalTotal, 0)
  );
  }, [voucherPreview, computedDiscount, originalTotal]);

  const finalTotal = React.useMemo(() => {
    if (bookingResponse?.totalDiscountAmount !== undefined && bookingResponse.totalDiscountAmount > 0) {
      return Math.max(Number(bookingResponse.totalDiscountAmount), 0);
    }
    if (voucherPreview?.finalTotal !== undefined) {
      return Math.max(Number(voucherPreview.finalTotal || 0), 0);
    }
    return Math.max(originalTotal - discountAmount, 0);
  }, [voucherPreview, originalTotal, discountAmount, bookingResponse]);

  const displayTotal = finalTotal;

  const normalizedBookingStatus = React.useMemo(
    () => String(bookingStatus || "").toUpperCase(),
    [bookingStatus]
  );

  const depositPercentage = React.useMemo(() => {
    if (voucherPreview?.depositPercentage !== undefined) {
      const raw = Number(voucherPreview.depositPercentage) * 100;
      if (!Number.isNaN(raw)) {
        return Math.min(Math.max(raw, 0), 100);
      }
    }
    const raw = Number(tour?.depositPercentage ?? 100);
    if (Number.isNaN(raw)) return 100;
    return Math.min(Math.max(raw, 0), 100);
  }, [tour?.depositPercentage, voucherPreview?.depositPercentage]);

  const amountDueNow = React.useMemo(() => {
    if (bookingResponse?.depositDiscountAmount !== undefined && bookingResponse.depositDiscountAmount > 0) {
      return Math.max(Math.round(Number(bookingResponse.depositDiscountAmount)), 0);
    }
    if (voucherPreview?.finalDepositAmount !== undefined) {
      return Math.max(Number(voucherPreview.finalDepositAmount || 0), 0);
    }
    if (finalTotal <= 0) return 0;
    if (depositPercentage > 0 && depositPercentage < 100) {
      return Math.round(finalTotal * (depositPercentage / 100));
    }
    return finalTotal;
  }, [depositPercentage, finalTotal, voucherPreview, bookingResponse]);

  const remainingBalance = React.useMemo(() => {
    if (voucherPreview?.finalRemainingAmount !== undefined) {
      return Math.max(Number(voucherPreview.finalRemainingAmount || 0), 0);
    }
    return Math.max(finalTotal - amountDueNow, 0);
  }, [finalTotal, amountDueNow, voucherPreview]);

  React.useEffect(() => {
    const loadVoucherPreview = async () => {
      if (!currentBookingId) return;
      try {
        try {
        const res = await voucherEndpoints.previewApply(currentBookingId);
          if (res.data) {
            setVoucherPreview(res.data);
            return;
          }
        } catch {
          setVoucherPreview(null);
        }
      } catch {
        setVoucherPreview(null);
      }
    };
    loadVoucherPreview();
  }, [currentBookingId]);

  React.useEffect(() => {
    const loadBooking = async () => {
      if (!currentBookingId) return;
      try {
        const response = (await tourEndpoints.getBookingById(currentBookingId))
          .data;
        if (!response) return;

        setBookingResponse(response);

        if (response.tourId && response.tourId !== currentTourId) {
          setCurrentTourId(response.tourId);
        }

        const guests = Array.isArray(response.guests) ? response.guests : [];
        const mapGuestsByType = (type: string) =>
          guests
            .filter((g: any) => g.bookingGuestType === type)
            .map((g: any) => ({
              fullName: g.fullName,
              birthDate: formatDisplayDate(g.birthDate),
              gender: g.gender || "OTHER",
              idNumber: g.idNumber || "",
              nationality: g.nationality || "",
            }));

        const normalized = {
          customerName: response.contactName || "",
          customerPhone: response.contactPhone || "",
          customerEmail: response.contactEmail || response.userEmail || "",
          customerAddress: response.contactAddress || "",
          adultCount: response.adultsCount ?? mapGuestsByType("ADULT").length,
          childrenCount:
            response.childrenCount ?? mapGuestsByType("CHILD").length,
          babyCount: response.babiesCount ?? mapGuestsByType("BABY").length,
          adultInfo: mapGuestsByType("ADULT"),
          childrenInfo: mapGuestsByType("CHILD"),
          babyInfo: mapGuestsByType("BABY"),
          pickUpPoint: response.pickupPoint || "",
          departureDate: formatDisplayDate(response.departureDate),
          note: response.note || "",
        };

        setBookingData(normalized);

        if (response.bookingStatus) {
          setBookingStatus(String(response.bookingStatus));
        }

        const tourKey = String(response.tourId ?? currentTourId ?? "na");
        const pendingKeyCache = `pendingBooking:${userEmailKey}:${tourKey}`;
        try {
          await AsyncStorage.setItem(
            pendingKeyCache,
            JSON.stringify({ bookingId: response.bookingId, ts: Date.now() })
          );
        } catch {
        }
      } catch {
      }
    };

    loadBooking();
  }, [
    currentBookingId,
    currentTourId,
    userEmailKey,
    formatDisplayDate,
    pendingKey,
  ]);

  React.useEffect(() => {
    const restorePendingBooking = async () => {
      if (currentBookingId) return;

      if (currentTourId && resolvedEmail) {
        try {
          const cached = await AsyncStorage.getItem(pendingKey);
          if (cached) {
            const saved = JSON.parse(cached);
            if (saved?.bookingId) {
              setCurrentBookingId(saved.bookingId);
              return;
            }
          }
        } catch {}
      }

      if (resolvedEmail && !currentTourId) {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const pendingKeys = keys.filter((k) =>
            k.startsWith(`pendingBooking:${userEmailKey}:`)
          );

          if (pendingKeys.length > 0) {
            let latestBooking: { bookingId: number; tourId: number } | null =
              null;
            let latestTs = 0;

            for (const key of pendingKeys) {
              try {
                const cached = await AsyncStorage.getItem(key);
                if (cached) {
                  const saved = JSON.parse(cached);
                  if (saved?.bookingId && saved?.ts && saved.ts > latestTs) {
                    latestTs = saved.ts;
                    const parts = key.split(":");
                    const tourIdFromKey = parts[2] ? Number(parts[2]) : null;
                    if (tourIdFromKey && !isNaN(tourIdFromKey)) {
                      latestBooking = {
                        bookingId: saved.bookingId,
                        tourId: tourIdFromKey,
                      };
                    }
                  }
                }
              } catch {}
            }

            if (latestBooking) {
              setCurrentTourId(latestBooking.tourId);
              setCurrentBookingId(latestBooking.bookingId);
              return;
            }
          }

          try {
            const bookingsResponse = await tourEndpoints.getBookingsByEmail(
              resolvedEmail
            );
            const bookings = Array.isArray(bookingsResponse.data)
              ? bookingsResponse.data
              : [];

            const unpaidBookings = bookings
              .filter((b: any) => {
                const status = String(b.status || "").toUpperCase();
                return (
                  status !== "SUCCESS" &&
                  status !== "COMPLETED" &&
                  status !== "CANCELLED"
                );
              })
              .sort((a: any, b: any) => {
                const aTime = new Date(a.createdAt || 0).getTime();
                const bTime = new Date(b.createdAt || 0).getTime();
                return bTime - aTime;
              });

            if (unpaidBookings.length > 0) {
              const latestUnpaid = unpaidBookings[0];
              const bookingId = latestUnpaid.bookingId || latestUnpaid.id;
              const tourId = latestUnpaid.tourId;

              if (bookingId && tourId) {
                setCurrentTourId(tourId);
                setCurrentBookingId(bookingId);

                const cacheKey = `pendingBooking:${userEmailKey}:${tourId}`;
                try {
                  await AsyncStorage.setItem(
                    cacheKey,
                    JSON.stringify({ bookingId, ts: Date.now() })
                  );
                } catch {}
              }
            }
          } catch {
          }
        } catch {}
      }
    };

    restorePendingBooking();
  }, [
    currentBookingId,
    currentTourId,
    pendingKey,
    resolvedEmail,
    userEmailKey,
  ]);

  React.useEffect(() => {
    const loadTour = async () => {
      if (!currentTourId) {
        Alert.alert(t("common.error"), t("tour.errors.tourNotFound"));
        goBack();
        return;
      }

      try {
        setLoading(true);
        const tourData = (await tourEndpoints.getById(currentTourId)).data;
        setTour(tourData);
      } catch {
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
        goBack();
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [currentTourId, t, goBack]);

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
    if (!tour || !bookingData) {
      Alert.alert(t("common.error"), t("tour.errors.missingData"));
      return;
    }

    const bookingId = currentBookingId;
    if (!bookingId) {
      Alert.alert(t("common.error"), t("tour.confirm.bookingMissing"));
      return;
    }

    if (confirming) {
      return;
    }

    try {
      setConfirming(true);

      try {
        await AsyncStorage.setItem(
          pendingKey,
          JSON.stringify({ bookingId, ts: Date.now() })
        );
    } catch {}

      const normalizedStatus = String(bookingStatus || "").toUpperCase();
      const bookingStatusForPayment =
        normalizedStatus === "PENDING_BALANCE_PAYMENT"
          ? "PENDING_BALANCE_PAYMENT"
          : depositPercentage > 0 && depositPercentage < 100
          ? "PENDING_DEPOSIT_PAYMENT"
          : bookingStatus || "PENDING_PAYMENT";

      const paymentAmount = amountDueNow;

      router.push({
        pathname: "/payment" as any,
        params: {
          bookingId: String(bookingId),
          userEmail: userEmailKey || bookingData.customerEmail || "",
          bookingStatus: bookingStatusForPayment,
          amount: String(Math.round(paymentAmount)), 
          voucherCode: voucherPreview?.voucherCode || "",
          orderInfo:
            depositPercentage > 0 && depositPercentage < 100
              ? `Deposit payment for tour: ${tour.tourName}`
              : `Booking payment for tour: ${tour.tourName}`,
        },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("tour.errors.paymentFailed") ||
        "Không thể tạo thanh toán. Vui lòng thử lại.";
      Alert.alert(t("common.error"), message);
    } finally {
      setConfirming(false);
    }
  };

  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollThreshold = 50;

  if (loading || (!bookingData && currentBookingId)) {
    return (
      <MainLayout isNavVisible={isNavVisible}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8D4E3" />
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
          <Text style={styles.headerTitle}>
            {t("tour.confirm.tourInfo")}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.tourHeader}>
                <Text style={styles.tourName}>{tour.tourName}</Text>
                <View style={styles.tourMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={16} color="#7A8A99" />
                    <Text style={styles.metaText}>
                      {tour.tourDeparturePoint}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#7A8A99" />
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
                  <Ionicons name="mail-outline" size={16} color="#7A8A99" />
                  <Text style={styles.contactText}>
                    {bookingData.customerEmail}
                  </Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="location-outline" size={16} color="#7A8A99" />
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
                      <Ionicons name="person-outline" size={20} color="#5A6C7D" />
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
                          color="#5A6C7D"
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
                        color="#5A6C7D"
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
                      {formatPriceKRWNumber(tour.adultPrice)} KRW/person
                    </Text>
                  </View>
                  <Text style={styles.priceItemValue}>
                    {formatPriceKRW(
                      bookingData.adultCount * (tour.adultPrice || 0)
                    )}
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
                        {formatPriceKRWNumber(tour.childrenPrice)} KRW/person
                      </Text>
                    </View>
                    <Text style={styles.priceItemValue}>
                      {formatPriceKRW(
                        bookingData.childrenCount * (tour.childrenPrice || 0)
                      )}
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
                        {formatPriceKRWNumber(tour.babyPrice)} KRW/person
                      </Text>
                    </View>
                    <Text style={styles.priceItemValue}>
                      {formatPriceKRW(
                        bookingData.babyCount * (tour.babyPrice || 0)
                      )}
                    </Text>
                  </View>
                )}
              </View>

              {discountAmount > 0 && (
                <>
                <View style={styles.totalRow}>
                  <Text style={styles.discountLabel}>
                    {t("tour.confirm.discount")}
                  </Text>
                  <Text style={styles.discountValue}>
                    -{formatPriceKRW(discountAmount)}
                  </Text>
                </View>
                  <View style={styles.priceDivider} />
                </>
              )}

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>{t("tour.confirm.total")}</Text>
                <Text style={styles.totalValue}>
                  {formatPriceKRW(displayTotal)}
                </Text>
              </View>

              {depositPercentage > 0 && depositPercentage < 100 && (
                <>
                  {normalizedBookingStatus === "PENDING_BALANCE_PAYMENT" ? (
                    <View style={styles.totalRow}>
                      <Text style={styles.remainingLabel}>
                        {t("tour.booking.remainingAmount") ||
                          "Remaining amount"}
                      </Text>
                      <Text style={styles.remainingValue}>
                        {formatPriceKRW(remainingBalance)}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={styles.depositLabel}>
                          {t("tour.booking.depositRequired") ||
                            "Deposit to pay now"}
                        </Text>
                        <Text style={styles.depositValue}>
                          {formatPriceKRW(amountDueNow)}
                        </Text>
                      </View>
                      <Text style={styles.depositNote}>
                        {tour?.depositPercentage
                          ? `${tour.depositPercentage}% ${t("tour.booking.depositRequired") ||
                              "deposit payment required"}`
                          : t("tour.booking.depositRequired")}
                      </Text>
                    </>
                  )}
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (confirming || !currentBookingId) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmBooking}
            disabled={confirming || !currentBookingId}
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
