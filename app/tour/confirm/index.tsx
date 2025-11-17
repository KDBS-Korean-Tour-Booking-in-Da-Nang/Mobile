import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../../src/contexts/authContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tourEndpoints } from "../../../services/endpoints/tour";
import { voucherEndpoints } from "../../../services/endpoints/voucher";
import { TourResponse } from "../../../src/types/response/tour.response";
import {
  VoucherResponse,
  VoucherDiscountType,
  VoucherStatus,
} from "../../../src/types/response/voucher.response";
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
  const [voucher, setVoucher] = React.useState<VoucherResponse | null>(null);
  const [showVoucherModal, setShowVoucherModal] = React.useState(false);
  const [availableVouchers, setAvailableVouchers] = React.useState<
    VoucherResponse[]
  >([]);
  const [selectedVoucherId, setSelectedVoucherId] = React.useState<
    number | null
  >(null);
  const [loadingVouchers, setLoadingVouchers] = React.useState(false);
  const [voucherError, setVoucherError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      // Component mounted
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

  const loadVouchers = React.useCallback(
    async (bookingId: number) => {
      if (!bookingId) {
        setAvailableVouchers([]);
        setSelectedVoucherId(null);
        setVoucher(null);
        return;
      }
      try {
        setLoadingVouchers(true);
        setVoucherError(null);
        const response = await voucherEndpoints.previewAllAvailable(bookingId);

        const data = Array.isArray(response.data) ? response.data : [];
        const normalized = data
          .map((raw: any) => {
            try {
              const toNumber = (val: any) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return Number.isNaN(num) ? 0 : num;
              };

              const normalizedType =
                String(raw.discountType || "").toUpperCase() === "PERCENT"
                  ? VoucherDiscountType.PERCENT
                  : VoucherDiscountType.FIXED;

              return {
                voucherId: Number(raw.voucherId ?? raw.id ?? 0),
                companyId: Number(raw.companyId ?? 0),
                code: raw.voucherCode || raw.code || "",
                name: raw.name || raw.voucherName || "",
                discountType: normalizedType,
                discountValue: toNumber(raw.discountValue),
                minOrderValue: toNumber(raw.minOrderValue),
                totalQuantity: toNumber(raw.totalQuantity),
                remainingQuantity: toNumber(raw.remainingQuantity),
                startDate: raw.startDate || "",
                endDate: raw.endDate || "",
                status: raw.status ?? VoucherStatus.ACTIVE,
                createdAt: raw.createdAt || "",
                updatedAt: raw.updatedAt || "",
                tourId: raw.tourId ? Number(raw.tourId) : undefined,
                companyUsername: raw.companyUsername ?? undefined,
                tourName: raw.tourName ?? undefined,
                tourIds: Array.isArray(raw.tourIds)
                  ? raw.tourIds
                      .map((id: any) => Number(id))
                      .filter((n: number) => !Number.isNaN(n))
                  : undefined,
              } as VoucherResponse;
            } catch {
              return null;
            }
          })
          .filter((v): v is VoucherResponse => !!v && !!v.code);

        if (normalized.length === 0) {
          setVoucherError(t("tour.confirm.noVoucherAvailable"));
        } else {
          setVoucherError(null);
        }

        setAvailableVouchers(normalized);
        if (voucher) {
          const stillExists = normalized.find(
            (item) => item.code === voucher.code
          );
          if (!stillExists) {
            setVoucher(null);
            setSelectedVoucherId(null);
          }
        }
        if (normalized.length === 0) {
          setSelectedVoucherId(null);
          setVoucher(null);
        }
      } catch (error) {
        setVoucherError(t("tour.confirm.voucherLoadFailed"));
        setAvailableVouchers([]);
        setSelectedVoucherId(null);
        setVoucher(null);
      } finally {
        setLoadingVouchers(false);
      }
    },
    [t, voucher]
  );

  const applyVoucherToBooking = React.useCallback(
    async (bookingId: number) => {
      if (!voucher?.code) return true;
      try {
        await voucherEndpoints.applyVoucher({
          bookingId,
          voucherCode: voucher.code,
        });
        return true;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          t("tour.confirm.voucherApplyFailed");
        Alert.alert(t("common.error"), message);
        setVoucher(null);
        setSelectedVoucherId(null);
        return false;
      }
    },
    [voucher, t]
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
    if (!voucher) return 0;
    const base = originalTotal || 0;
    if (base <= 0) return 0;
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      return Math.floor((base * Number(voucher.discountValue || 0)) / 100);
    }
    return Number(voucher.discountValue || 0);
  }, [voucher, originalTotal]);

  const discountAmount = Math.min(
    Math.max(computedDiscount, 0),
    Math.max(originalTotal, 0)
  );
  const finalTotal = Math.max(originalTotal - discountAmount, 0);

  React.useEffect(() => {
    const loadBooking = async () => {
      if (!currentBookingId) return;
      try {
        const response = (await tourEndpoints.getBookingById(currentBookingId))
          .data;
        if (!response) return;

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

        const tourKey = String(response.tourId ?? currentTourId ?? "na");
        const pendingKeyCache = `pendingBooking:${userEmailKey}:${tourKey}`;
        try {
          await AsyncStorage.setItem(
            pendingKeyCache,
            JSON.stringify({ bookingId: response.bookingId, ts: Date.now() })
          );
        } catch (err) {
          // Unable to cache booking
        }
      } catch (error) {
        // Load booking failed
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
        } catch (err) {}
      }

      if (resolvedEmail && !currentTourId) {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const pendingKeys = keys.filter((k) =>
            k.startsWith(`pendingBooking:${userEmailKey}:`)
          );

          if (pendingKeys.length > 0) {
            let latestBooking: { bookingId: number; tourId: number } | null = null;
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
              } catch (err) {}
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
                } catch (err) {}
              }
            }
          } catch (err: any) {
            const statusCode = err?.response?.status;
            if (statusCode !== 400 && statusCode !== 404) {
              console.error("Error loading bookings from database:", err);
            }
          }
        } catch (err) {}
      }
    };

    restorePendingBooking();
  }, [currentBookingId, currentTourId, pendingKey, resolvedEmail, userEmailKey]);

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

  React.useEffect(() => {
    if (!currentBookingId) {
      setAvailableVouchers([]);
      return;
    }
    loadVouchers(currentBookingId);
  }, [currentBookingId, loadVouchers]);

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

      const applied = await applyVoucherToBooking(bookingId);
      if (!applied) {
        setConfirming(false);
        return;
      }

      try {
        await AsyncStorage.setItem(
          pendingKey,
          JSON.stringify({ bookingId, ts: Date.now() })
        );
      } catch (err) {}

      router.push({
        pathname: "/payment" as any,
        params: {
          bookingId: String(bookingId),
          userEmail: userEmailKey || bookingData.customerEmail || "",
          amount: finalTotal.toString(),
          voucherCode: voucher?.code || "",
          orderInfo: `Booking payment for tour: ${tour.tourName}`,
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("tour.confirm.voucher")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectVoucherButton,
                  !currentBookingId && styles.selectVoucherButtonDisabled,
                ]}
                onPress={() => {
                  if (!currentBookingId) {
                    Alert.alert(
                      t("common.info") || "Thông tin",
                      t("tour.confirm.createBookingFirst")
                    );
                    return;
                  }
                  setSelectedVoucherId(voucher?.voucherId || null);
                  setShowVoucherModal(true);
                }}
                disabled={!currentBookingId}
              >
                <Text
                  style={[
                    styles.selectVoucherButtonText,
                    !currentBookingId && styles.selectVoucherButtonTextDisabled,
                  ]}
                >
                  {t("tour.confirm.selectVoucher")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={!currentBookingId ? "#ccc" : "#007AFF"}
                />
              </TouchableOpacity>
            </View>

            {voucher ? (
              <View style={styles.voucherCard}>
                <View style={styles.voucherHeader}>
                  <View style={styles.voucherIcon}>
                    <Ionicons name="ticket" size={14} color="#34C759" />
                  </View>
                  <Text style={styles.voucherCode}>
                    {voucher.code.toUpperCase()}
                  </Text>
                  <Text style={styles.voucherDetailValue}>
                    {voucher.discountType === VoucherDiscountType.PERCENT
                      ? `${voucher.discountValue}%`
                      : `${voucher.discountValue.toLocaleString()} VND`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setVoucher(null)}
                    style={styles.removeVoucherButton}
                  >
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
                {voucher.name && (
                  <Text style={styles.voucherName}>{voucher.name}</Text>
                )}
              </View>
            ) : (
              <View style={styles.noVoucherCard}>
                <Text style={styles.noVoucherText}>
                  {t("tour.confirm.noVoucher")}
                </Text>
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
              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.discountLabel}>
                    {t("tour.confirm.discount")}
                  </Text>
                  <Text style={styles.discountValue}>
                    -{discountAmount.toLocaleString()} VND
                  </Text>
                </View>
              )}

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>{t("tour.confirm.total")}</Text>
                <Text style={styles.totalValue}>
                  {finalTotal.toLocaleString()} VND
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (confirming || !currentBookingId) && styles.confirmButtonDisabled,
              { marginBottom: 40 },
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

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.confirm.availableVouchers")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVoucherModal(false);
                  setSelectedVoucherId(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {loadingVouchers ? (
                <View style={styles.voucherLoadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.voucherLoadingText}>
                    {t("tour.confirm.loadingVouchers")}
                  </Text>
                </View>
              ) : availableVouchers.length > 0 ? (
                availableVouchers.map((v) => (
                  <TouchableOpacity
                    key={v.voucherId}
                    style={[
                      styles.voucherOptionCard,
                      selectedVoucherId === v.voucherId &&
                        styles.voucherOptionCardSelected,
                    ]}
                    onPress={() => setSelectedVoucherId(v.voucherId)}
                  >
                    <View style={styles.voucherOptionRow}>
                      <View style={styles.radioButtonContainer}>
                        <View
                          style={[
                            styles.radioButton,
                            selectedVoucherId === v.voucherId &&
                              styles.radioButtonSelected,
                          ]}
                        >
                          {selectedVoucherId === v.voucherId && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                      </View>
                      <View style={styles.voucherOptionIcon}>
                        <Ionicons name="ticket" size={18} color="#34C759" />
                      </View>
                      <Text style={styles.voucherOptionCode}>
                        {v.code.toUpperCase()}
                      </Text>
                      <Text style={styles.voucherOptionDetailValue}>
                        {v.discountType === VoucherDiscountType.PERCENT
                          ? `${v.discountValue}%`
                          : `${v.discountValue.toLocaleString()} VND`}
                      </Text>
                    </View>
                    {v.name && (
                      <Text style={styles.voucherOptionName}>{v.name}</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.voucherEmptyContainer}>
                  <Ionicons name="ticket-outline" size={48} color="#ccc" />
                  <Text style={styles.voucherEmptyText}>
                    {voucherError || t("tour.confirm.noVoucherAvailable")}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowVoucherModal(false);
                  setSelectedVoucherId(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t("tour.confirm.close")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !selectedVoucherId && styles.modalConfirmButtonDisabled,
                ]}
                onPress={() => {
                  if (selectedVoucherId) {
                    const selectedVoucher = availableVouchers.find(
                      (v) => v.voucherId === selectedVoucherId
                    );
                    if (selectedVoucher) {
                      setVoucher(selectedVoucher);
                      setShowVoucherModal(false);
                      setSelectedVoucherId(null);
                    }
                  }
                }}
                disabled={!selectedVoucherId}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {t("tour.confirm.select")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}
