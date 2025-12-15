import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from "react-native";
import styles from "./styles";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../components/MainLayout";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../../src/contexts/authContext";
import { tourEndpoints } from "../../../services/endpoints/tour";
import {
  BookingSummaryResponse,
  BookingStatus,
} from "../../../src/types/response/booking.response";
import { TourResponse } from "../../../src/types/response/tour.response";
import { getTourThumbnailUrl } from "../../../src/utils/media";

export default function HistoryBooking() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<BookingSummaryResponse[]>([]);
  const [tourImageById, setTourImageById] = useState<Record<number, string>>(
    {}
  );
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [complainingId, setComplainingId] = useState<number | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showComplaintConfirmModal, setShowComplaintConfirmModal] =
    useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const resolveTourCardImage = (t?: TourResponse): string => {
    if (!t) return "";

    const cover = getTourThumbnailUrl(t?.tourImgPath);
    return cover || "";
  };

  const translateBookingStatus = useCallback(
    (status?: string) => {
      const normalized = String(status || "").toUpperCase();
      if (!normalized) {
        return t("common.na");
      }
      const keyWithoutUnderscores = normalized.replace(/_/g, ".");
      const key = `tour.booking.status.${keyWithoutUnderscores}`;
      const translated = t(key);
      if (translated === key) {
        return normalized.replace(/_/g, " ").toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
      return translated;
    },
    [t]
  );

  const getStatusBadgeColor = useCallback((status?: string) => {
    const normalized = String(status || "").toUpperCase();
    switch (normalized) {
      case BookingStatus.BOOKING_SUCCESS:
      case BookingStatus.BOOKING_BALANCE_SUCCESS:
      case "SUCCESS":
        return "#34C759";

      case BookingStatus.PENDING_PAYMENT:
      case BookingStatus.PENDING_DEPOSIT_PAYMENT:
      case BookingStatus.PENDING_BALANCE_PAYMENT:
        return "#FF9500";

      case BookingStatus.WAITING_FOR_UPDATE:
      case BookingStatus.WAITING_FOR_APPROVED:
      case BookingStatus.BOOKING_SUCCESS_PENDING:
      case BookingStatus.BOOKING_SUCCESS_WAIT_FOR_CONFIRMED:
        return "#FF9500";

      case BookingStatus.BOOKING_REJECTED:
      case BookingStatus.BOOKING_FAILED:
        return "#FF3B30";

      case BookingStatus.BOOKING_UNDER_COMPLAINT:
        return "#5856D6";

      case BookingStatus.BOOKING_CANCELLED:
        return "#8E8E93";

      default:
        return "#9aa0a6";
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.email) {
        setItems([]);
        setTourImageById({});
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        setItems([]);
        setTourImageById({});
        return;
      }

      let bookings: any[] = [];

      try {
        const bookingsResponse = await tourEndpoints.getBookingsByEmail(
          user.email
        );
        bookings = Array.isArray(bookingsResponse.data)
          ? bookingsResponse.data
          : [];
      } catch {
        bookings = [];
      }

      const allBookings = bookings.map((booking: any) => {
        const tourName =
          booking.tourName || booking.tour?.tourName || booking.tourName || "";

        const formatDate = (dateStr: any) => {
          if (!dateStr) return "";
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "";
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
          } catch {
            return "";
          }
        };

        const adultCount = booking.adultsCount || booking.adultCount || 0;
        const childrenCount = booking.childrenCount || booking.childCount || 0;
        const babyCount = booking.babiesCount || booking.babyCount || 0;
        const totalGuests = adultCount + childrenCount + babyCount;

        return {
          bookingId: booking.bookingId || booking.id,
          tourId: booking.tourId || booking.tour?.id,
          tourName: tourName,
          departureDate: formatDate(
            booking.departureDate || booking.departure_date
          ),
          totalGuests: totalGuests,
          status: booking.status || booking.bookingStatus,
          createdAt:
            booking.createdAt || booking.created_at || new Date().toISOString(),
          userConfirmedCompletion: booking.userConfirmedCompletion ?? false,
        };
      });

      const validBookings = allBookings.filter(
        (b: any) => b.bookingId && b.tourId
      );

      const sortedBookings = validBookings.sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setItems(sortedBookings);

      const ids: number[] = Array.from(
        new Set(
          sortedBookings.map((x: any) => Number(x.tourId)).filter(Boolean)
        )
      );
      if (ids.length > 0) {
        const pairs = await Promise.all(
          ids.map(async (id: number) => {
            try {
              const tour = (await tourEndpoints.getById(id)).data;
              return [id, resolveTourCardImage(tour)] as const;
            } catch {
              return [id, resolveTourCardImage()] as const;
            }
          })
        );
        const map: Record<number, string> = {};
        pairs.forEach(([id, url]) => (map[id as number] = url));
        setTourImageById(map);
      } else {
        setTourImageById({});
      }
    } catch (error: any) {
      const statusCode = error?.response?.status;
      if (statusCode !== 400 && statusCode !== 404) {
        Alert.alert(
          t("common.error"),
          t("tour.errors.bookingHistoryLoadFailed")
        );
      }
      setItems([]);
      setTourImageById({});
    } finally {
      setLoading(false);
    }
  }, [t, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleOpenBooking = (bookingId: number) => {
    router.push({
      pathname: "/tour/historyBooking/detailHistory",
      params: { bookingId },
    } as any);
  };

  const isAwaitingCompletion = (status?: string) => {
    if (!status) return false;
    const normalized = String(status).toUpperCase();
    return (
      normalized === BookingStatus.BOOKING_SUCCESS_WAIT_FOR_CONFIRMED ||
      normalized === "BOOKING_SUCCESS_WAIT_FOR_CONFIRMED"
    );
  };

  const handleOpenComplaint = (bookingId: number) => {
    setComplainingId(bookingId);
    setComplaintMessage("");
    setShowComplaintModal(true);
  };

  const handleComplaintSubmit = () => {
    if (!complaintMessage.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("tour.booking.complaintMessageRequired") ||
          "Vui lòng nhập nội dung khiếu nại."
      );
      return;
    }
    setShowComplaintModal(false);
    setShowComplaintConfirmModal(true);
  };

  const handleConfirmComplaint = async () => {
    if (!complainingId || !complaintMessage.trim()) {
      return;
    }

    try {
      setSubmittingComplaint(true);
      setShowComplaintConfirmModal(false);
      await tourEndpoints.createComplaint(
        complainingId,
        complaintMessage.trim()
      );
      setItems((prev) =>
        prev.map((item) =>
          item.bookingId === complainingId
            ? { ...item, status: BookingStatus.BOOKING_UNDER_COMPLAINT }
            : item
        )
      );
      setComplaintMessage("");
      setComplainingId(null);
      await loadData();
      Alert.alert(
        t("common.success") || "Success",
        t("tour.booking.complaintSubmitted") ||
          "Khiếu nại của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất."
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Error",
        error?.response?.data?.message ||
          t("tour.booking.complaintFailed") ||
          "Không thể gửi khiếu nại. Vui lòng thử lại."
      );
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleConfirmCompletion = (bookingId: number) => {
    if (confirmingId !== null) {
      return;
    }

    Alert.alert(
      t("tour.booking.confirmCompletionTitle") || "Xác nhận hoàn thành tour",
      t("tour.booking.confirmCompletionMessage") ||
        "Bạn đã hoàn thành tour này? Sau khi xác nhận sẽ không thể hoàn tác.",
      [
        {
          text: t("common.cancel") || "Hủy",
          style: "cancel",
        },
        {
          text: t("common.confirm") || "Xác nhận",
          onPress: async () => {
            try {
              setConfirmingId(bookingId);
              await tourEndpoints.confirmBookingCompletion(bookingId);
              setItems((prev) =>
                prev.map((item) =>
                  item.bookingId === bookingId
                    ? {
                        ...item,
                        userConfirmedCompletion: true,
                        status: BookingStatus.BOOKING_SUCCESS,
                      }
                    : item
                )
              );
              await loadData();
              Alert.alert(
                t("common.success") || "Thành công",
                t("tour.booking.confirmCompletionSuccess") ||
                  "Cảm ơn bạn đã xác nhận!"
              );
            } catch (error: any) {
              Alert.alert(
                t("common.error") || "Lỗi",
                error?.response?.data?.message ||
                  t("tour.booking.confirmCompletionFailed") ||
                  "Không thể xác nhận, vui lòng thử lại."
              );
            } finally {
              setConfirmingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {t("tour.historyBooking.loading")}
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("payment.result.details") || "Booking History"}
          </Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.contentPadding}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>{t("tour.errors.notFound")}</Text>
            </View>
          ) : (
            items.map((it) => {
              const awaiting = isAwaitingCompletion(it.status);
              const isProcessing = confirmingId === it.bookingId;
              const hasUserConfirmed = it.userConfirmedCompletion === true;
              return (
                <View key={it.bookingId} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => handleOpenBooking(it.bookingId)}
                    style={styles.cardRow}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{
                        uri:
                          tourImageById[Number(it.tourId)] ||
                          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=120&fit=crop",
                      }}
                      style={styles.cardImage}
                    />
                    <View style={styles.cardBody}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {it.tourName}
                        </Text>
                        <View
                          style={[
                            styles.cardStatusBadge,
                            { backgroundColor: getStatusBadgeColor(it.status) },
                          ]}
                        >
                          <Text style={styles.cardStatusText}>
                            {translateBookingStatus(it.status)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rowIconText}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#6c757d"
                        />
                        <Text style={styles.rowText}>{it.departureDate}</Text>
                      </View>
                      <View style={[styles.rowIconText, styles.rowGapSmall]}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#6c757d"
                        />
                        <Text style={styles.rowText}>
                          {it.totalGuests}{" "}
                          {t("tour.booking.totalGuests") || "guests"}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9aa0a6"
                    />
                  </TouchableOpacity>
                  {awaiting && !hasUserConfirmed && (
                    <View style={styles.cardActionButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.cardConfirmButton,
                          styles.cardActionButton,
                        ]}
                        onPress={() => handleConfirmCompletion(it.bookingId)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <ActivityIndicator size="small" color="#81C784" />
                            <Text style={styles.cardConfirmButtonText}>
                              {t("tour.booking.confirmCompletionProcessing") ||
                                "Đang xác nhận..."}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-done"
                              size={18}
                              color="#81C784"
                            />
                            <Text style={styles.cardConfirmButtonText}>
                              {t("tour.booking.confirmCompletion") ||
                                "Xác nhận tour đã hoàn thành"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.cardComplaintButton,
                          styles.cardActionButton,
                        ]}
                        onPress={() => handleOpenComplaint(it.bookingId)}
                        disabled={
                          submittingComplaint && complainingId === it.bookingId
                        }
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={18}
                          color="#FF8A65"
                        />
                        <Text style={styles.cardComplaintButtonText}>
                          {t("tour.booking.complaint") || "Khiếu nại"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showComplaintModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComplaintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.complaintTitle") || "Khiếu nại"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowComplaintModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>
                  {t("tour.booking.complaintMessage") || "Nội dung khiếu nại"}
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={complaintMessage}
                  onChangeText={setComplaintMessage}
                  placeholder={
                    t("tour.booking.complaintPlaceholder") ||
                    "Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                  }
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowComplaintModal(false)}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleComplaintSubmit}
              >
                <Text style={styles.modalSubmitText}>
                  {t("common.continue") || "Tiếp tục"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showComplaintConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowComplaintConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>
              {t("tour.booking.complaintConfirmTitle") || "Xác nhận khiếu nại"}
            </Text>
            <Text style={styles.confirmModalMessage}>
              {t("tour.booking.complaintConfirmMessage") ||
                "Bạn có chắc chắn muốn gửi khiếu nại này không? Sau khi gửi, trạng thái đặt tour sẽ chuyển thành 'Đang xử lý khiếu nại'."}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmModalCancelButton}
                onPress={() => setShowComplaintConfirmModal(false)}
              >
                <Text style={styles.confirmModalCancelText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalConfirmButton}
                onPress={handleConfirmComplaint}
                disabled={submittingComplaint}
              >
                {submittingComplaint ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmModalConfirmText}>
                    {t("common.confirm")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}
