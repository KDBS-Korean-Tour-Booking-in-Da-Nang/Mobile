import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MainLayout from "../../../../components/MainLayout";
import { tourEndpoints } from "../../../../services/endpoints/tour";
import {
  BookingResponse,
  BookingStatus,
  GuestResponse,
} from "../../../../src/types/response/booking.response";
import { TourResponse } from "../../../../src/types/response/tour.response";
import { formatPriceKRW } from "../../../../src/utils/currency";
import styles from "./style";

export default function BookingDetail() {
  const { t } = useTranslation();
  const params = useLocalSearchParams() || {};
  const router = useRouter();

  const bookingId = params?.bookingId
    ? Number(
        Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId
      )
    : NaN;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [remainingAmount, setRemainingAmount] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showComplaintConfirmModal, setShowComplaintConfirmModal] =
    useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [showCancelPreview, setShowCancelPreview] = useState(false);
  const [loadingCancelPreview, setLoadingCancelPreview] = useState(false);
  const [cancelPreview, setCancelPreview] = useState<BookingResponse | null>(
    null
  );
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [cancelSuccessData, setCancelSuccessData] =
    useState<BookingResponse | null>(null);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      if (!bookingId || Number.isNaN(bookingId)) {
        setLoading(false);
        return;
      }
      const data = (await tourEndpoints.getBookingById(bookingId)).data;
      setBooking(data);

      try {
        const tour: TourResponse = (
          await tourEndpoints.getById(data?.tourId || 0)
        ).data;

        const originalTotal =
          (tour.adultPrice || 0) * (data.adultsCount || 0) +
          (tour.childrenPrice || 0) * (data.childrenCount || 0) +
          (tour.babyPrice || 0) * (data.babiesCount || 0);


        const finalTotal = data?.totalDiscountAmount !== undefined && data.totalDiscountAmount > 0
          ? Number(data.totalDiscountAmount)
          : originalTotal;
        
        setTotalAmount(finalTotal);

        if (data?.depositDiscountAmount !== undefined && data.depositDiscountAmount > 0) {
          const depositValue = Number(data.depositDiscountAmount);
          setDepositAmount(depositValue);

          setRemainingAmount(Math.max(finalTotal - depositValue, 0));
        } else {

        const dp = Number(tour.depositPercentage ?? 0);
        if (!Number.isNaN(dp)) {
          const depositValue =
              dp > 0 && dp < 100 ? Math.round((finalTotal * dp) / 100) : finalTotal;
          setDepositAmount(depositValue);
            setRemainingAmount(Math.max(finalTotal - depositValue, 0));
        } else {
          setDepositAmount(null);
          setRemainingAmount(null);
          }
        }
      } catch {
        setTotalAmount(null);
        setDepositAmount(null);
        setRemainingAmount(null);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8D4E3" />
        </View>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
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

  const formatPrice = (price: number) => formatPriceKRW(price || 0);

  const bookingStatus = booking?.bookingStatus
    ? String(booking.bookingStatus).toUpperCase()
    : "";

  const isPendingPayment =
    bookingStatus === BookingStatus.PENDING_PAYMENT ||
    bookingStatus === "PENDING_PAYMENT";

  const isPendingDepositPayment =
    bookingStatus === BookingStatus.PENDING_DEPOSIT_PAYMENT ||
    bookingStatus === "PENDING_DEPOSIT_PAYMENT";

  const isPendingBalancePayment =
    bookingStatus === BookingStatus.PENDING_BALANCE_PAYMENT ||
    bookingStatus === "PENDING_BALANCE_PAYMENT";

  const isWaitingForUpdate =
    bookingStatus === BookingStatus.WAITING_FOR_UPDATE ||
    bookingStatus === "WAITING_FOR_UPDATE";

  const isWaitingForApproved =
    bookingStatus === BookingStatus.WAITING_FOR_APPROVED ||
    bookingStatus === "WAITING_FOR_APPROVED";

  const isAwaitingCompletion =
    bookingStatus === BookingStatus.BOOKING_SUCCESS_WAIT_FOR_CONFIRMED ||
    bookingStatus === "BOOKING_SUCCESS_WAIT_FOR_CONFIRMED";

  const isBalanceSuccess =
    bookingStatus === BookingStatus.BOOKING_BALANCE_SUCCESS ||
    bookingStatus === "BOOKING_BALANCE_SUCCESS";

  const isSuccessPending =
    bookingStatus === BookingStatus.BOOKING_SUCCESS_PENDING ||
    bookingStatus === "BOOKING_SUCCESS_PENDING";

  const isBookingSuccess =
    bookingStatus === BookingStatus.BOOKING_SUCCESS ||
    bookingStatus === "BOOKING_SUCCESS";

  const isUnderComplaint =
    bookingStatus === BookingStatus.BOOKING_UNDER_COMPLAINT ||
    bookingStatus === "BOOKING_UNDER_COMPLAINT";

  const isCancelled =
    bookingStatus === BookingStatus.BOOKING_CANCELLED ||
    bookingStatus === "BOOKING_CANCELLED";

  const isRejected =
    bookingStatus === BookingStatus.BOOKING_REJECTED ||
    bookingStatus === "BOOKING_REJECTED";

  const isFailed =
    bookingStatus === BookingStatus.BOOKING_FAILED ||
    bookingStatus === "BOOKING_FAILED";

  const renderPaymentSummary = () => {
    const total = totalAmount ?? 0;
    const deposit = depositAmount ?? 0;
    const remaining = remainingAmount ?? Math.max(total - deposit, 0);

    if (isWaitingForApproved || isWaitingForUpdate || isPendingBalancePayment) {
      return (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t("tour.booking.depositPaid") || "Deposit paid"}
            </Text>
            <Text style={styles.valueBold}>{formatPrice(deposit)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t("tour.booking.remainingAmount") || "Remaining amount"}
            </Text>
            <Text style={styles.valueBold}>{formatPrice(remaining)}</Text>
          </View>
        </>
      );
    }

    if (isPendingDepositPayment) {
      return (
        <View style={styles.row}>
          <Text style={styles.label}>
            {t("tour.booking.depositRequired") || "Deposit required"}
          </Text>
          <Text style={styles.valueBold}>{formatPrice(deposit)}</Text>
        </View>
      );
    }

    if (isBalanceSuccess || isBookingSuccess) {
      return (
        <View style={styles.row}>
          <Text style={styles.label}>
            {t("tour.booking.totalPaid") || "Total paid"}
          </Text>
          <Text style={styles.valueBold}>{formatPrice(total)}</Text>
        </View>
      );
    }

    if (typeof totalAmount === "number") {
      return (
        <View style={styles.row}>
          <Text style={styles.label}>{t("tour.confirm.priceSummary")}</Text>
          <Text style={styles.valueBold}>{formatPrice(total)}</Text>
        </View>
      );
    }

    return null;
  };

  const canCancel =
    isWaitingForApproved ||
    isWaitingForUpdate ||
    isPendingBalancePayment ||
    isBalanceSuccess;

  const handlePreviewCancel = async () => {
    if (!booking?.bookingId) return;
    try {
      setLoadingCancelPreview(true);
      const res = await tourEndpoints.previewCancelBooking(booking.bookingId);
      setCancelPreview(res.data || null);
      setShowCancelPreview(true);
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error?.response?.data?.message || t("tour.booking.cancelFailed") || "Error"
      );
    } finally {
      setLoadingCancelPreview(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking?.bookingId || confirmingCancel) return;
    try {
      setConfirmingCancel(true);
      const res = await tourEndpoints.cancelBooking(booking.bookingId);

      setShowCancelPreview(false);
      setCancelSuccessData(res.data || null);
      setShowCancelSuccessModal(true);
      await loadBooking();
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error?.response?.data?.message ||
          t("tour.booking.cancelFailed") ||
          "Cancel failed"
      );
    } finally {
      setConfirmingCancel(false);
    }
  };

  const translateBookingStatus = (status?: string) => {
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
  };

  const getStatusText = () => translateBookingStatus(bookingStatus);

  const getStatusColor = () => {
    if (
      isPendingPayment ||
      isPendingDepositPayment ||
      isPendingBalancePayment
    ) {
      return "#FF9500";
    }

    if (isWaitingForUpdate || isWaitingForApproved || isSuccessPending) {
      return "#FF9500";
    }

    if (isAwaitingCompletion) {
      return "#FF9500";
    }

    if (isBookingSuccess || isBalanceSuccess) {
      return "#34C759";
    }

    if (isUnderComplaint) {
      return "#5856D6";
    }

    if (isRejected || isFailed) {
      return "#FF3B30";
    }

    if (isCancelled) {
      return "#8E8E93";
    }

    return "#666";
  };

  const handleContinuePayment = async () => {
    if (!booking?.bookingId || !booking?.tourId) {
      return;
    }

    const normalizedStatus = String(booking.bookingStatus || "").toUpperCase();


    let amountToPay = 0;
    if (normalizedStatus === "PENDING_BALANCE_PAYMENT") {

      const totalAfterDiscount = booking?.totalDiscountAmount ?? booking?.totalAmount ?? 0;
      const depositAfterDiscount = booking?.depositDiscountAmount ?? 0;
      amountToPay = Math.max(totalAfterDiscount - depositAfterDiscount, 0);
    } else {

      amountToPay = Number(booking?.depositDiscountAmount ?? booking?.depositAmount ?? booking?.totalAmount ?? 0);
    }

    const voucherCode = booking?.voucherCode || "";

    if (isPendingBalancePayment) {
      router.push({
        pathname: "/tour/confirm" as any,
        params: {
          bookingId: String(booking.bookingId),
          tourId: String(booking.tourId),
          bookingStatus: String(booking.bookingStatus || "PENDING_BALANCE_PAYMENT"),
          amount: amountToPay.toString(),
          voucherCode,
        },
      });
      return;
    }

    if (isPendingPayment || isPendingDepositPayment) {
      router.push({
        pathname: "/payment" as any,
        params: {
          bookingId: String(booking.bookingId),
          userEmail: (booking.contactEmail || "").toLowerCase(),
          bookingStatus: String(booking.bookingStatus || "PENDING_PAYMENT"),
          amount: amountToPay.toString(),
          voucherCode,
        },
      });
    }
  };

  const handleOpenUpdateModal = () => {
    if (!booking) return;

    const guests = Array.isArray(booking.guests) ? booking.guests : [];
    const mapGuestsByType = (type: string) =>
      guests
        .filter((g: GuestResponse) => g.bookingGuestType === type)
        .map((g: GuestResponse) => ({
          fullName: g.fullName || "",
          birthDate: g.birthDate || "",
          gender: g.gender || "",
          idNumber: g.idNumber || "",
          nationality: g.nationality || "",
        }));

    setUpdateData({
      contactName: booking.contactName || "",
      contactPhone: booking.contactPhone || "",
      contactEmail: booking.contactEmail || "",
      contactAddress: booking.contactAddress || "",
      pickupPoint: booking.pickupPoint || "",
      note: booking.note || "",
      adultInfo: mapGuestsByType("ADULT"),
      childrenInfo: mapGuestsByType("CHILD"),
      babyInfo: mapGuestsByType("BABY"),
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = () => {
    setShowUpdateModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!booking?.bookingId || !updateData) return;

    try {
      setUpdating(true);
      setShowConfirmModal(false);

      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
        return dateStr;
      };

      const mapGuests = (guests: any[], type: string) =>
        guests.map((g) => ({
          fullName: g.fullName || "",
          birthDate: normalizeDate(g.birthDate || ""),
          gender: g.gender || "OTHER",
          idNumber: g.idNumber || "",
          nationality: g.nationality || "",
          bookingGuestType: type,
        }));

      const payload = {
        tourId: booking.tourId,
        userEmail: booking.contactEmail || "",
        contactName: updateData.contactName || "",
        contactPhone: updateData.contactPhone || "",
        contactEmail: updateData.contactEmail || "",
        contactAddress: updateData.contactAddress || "",
        pickupPoint: updateData.pickupPoint || "",
        note: updateData.note || "",
        departureDate: booking.departureDate || "",
        adultsCount: updateData.adultInfo?.length || 0,
        childrenCount: updateData.childrenInfo?.length || 0,
        babiesCount: updateData.babyInfo?.length || 0,
        bookingGuestRequests: [
          ...mapGuests(updateData.adultInfo || [], "ADULT"),
          ...mapGuests(updateData.childrenInfo || [], "CHILD"),
          ...mapGuests(updateData.babyInfo || [], "BABY"),
        ],
      };

      await tourEndpoints.updateBooking(booking.bookingId, payload);

      await loadBooking();

      Alert.alert(
        t("common.success") || "Thành công",
        t("tour.booking.updateSuccess") || "Cập nhật thông tin thành công!"
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Lỗi",
        error?.response?.data?.message ||
          t("tour.booking.updateFailed") ||
          "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCompletion = () => {
    if (!booking?.bookingId || confirmingCompletion) {
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
              setConfirmingCompletion(true);
              await tourEndpoints.confirmBookingCompletion(booking.bookingId);
              setBooking((prev) =>
                prev
                  ? {
                      ...prev,
                      userConfirmedCompletion: true,
                      bookingStatus: BookingStatus.BOOKING_SUCCESS,
                    }
                  : prev
              );
              await loadBooking();
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
              setConfirmingCompletion(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenComplaint = () => {
    setComplaintMessage("");
    setShowComplaintModal(true);
  };

  const handleComplaintSubmit = () => {
    if (!complaintMessage.trim()) {
      Alert.alert(
        t("common.error") || "Lỗi",
        t("tour.booking.complaintMessageRequired") ||
          "Vui lòng nhập nội dung khiếu nại."
      );
      return;
    }
    setShowComplaintModal(false);
    setShowComplaintConfirmModal(true);
  };

  const handleConfirmComplaint = async () => {
    if (!booking?.bookingId || !complaintMessage.trim()) {
      return;
    }

    try {
      setSubmittingComplaint(true);
      setShowComplaintConfirmModal(false);
      await tourEndpoints.createComplaint(
        booking.bookingId,
        complaintMessage.trim()
      );
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              bookingStatus: BookingStatus.BOOKING_UNDER_COMPLAINT,
            }
          : prev
      );
      setComplaintMessage("");
      await loadBooking();
      Alert.alert(
        t("common.success") || "Thành công",
        t("tour.booking.complaintSubmitted") ||
          "Khiếu nại của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất."
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Lỗi",
        error?.response?.data?.message ||
          t("tour.booking.complaintFailed") ||
          "Không thể gửi khiếu nại. Vui lòng thử lại."
      );
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <MainLayout>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back-outline" size={22} color="#7A8A99" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("tour.confirm.tourInfo")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{booking?.tourName || ""}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t("payment.result.status")}</Text>
              <Text style={[styles.statusSuccess, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>
                {t("tour.booking.departureDate")}
              </Text>
              <Text style={styles.value}>{booking?.departureDate || ""}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.totalGuests")}</Text>
              <Text style={styles.value}>{booking?.totalGuests || 0}</Text>
            </View>
            {renderPaymentSummary()}
            <View style={styles.rowLast}>
              <Text style={styles.label}>{t("tour.booking.pickUpPoint")}</Text>
              <Text style={styles.value}>
                {booking?.pickupPoint || t("common.na")}
              </Text>
            </View>
            {isWaitingForUpdate && (
              <TouchableOpacity
                style={styles.updateInfoButton}
                onPress={handleOpenUpdateModal}
                disabled={updating}
              >
                <Ionicons name="create-outline" size={18} color="#5A6C7D" />
                <Text style={styles.updateInfoButtonText}>
                  {t("tour.booking.updateInfo") || "Cập nhật thông tin"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.contactInfo")}
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.fullName")}</Text>
              <Text style={styles.value}>{booking?.contactName || ""}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t("tour.booking.phoneNumber")}</Text>
              <Text style={styles.value}>{booking?.contactPhone || ""}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>{t("tour.booking.email")}</Text>
              <Text style={styles.value}>
                {booking?.contactEmail || t("common.na")}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("tour.confirm.guestDetails")}
            </Text>
            {booking.guests &&
            Array.isArray(booking.guests) &&
            booking.guests.length > 0 ? (
              booking.guests.map((g) => (
                <View
                  key={g?.bookingGuestId || Math.random()}
                  style={styles.guestItem}
                >
                  <Text style={styles.guestName}>{g?.fullName || ""}</Text>
                  <Text style={styles.guestMeta}>
                    {t("tour.booking.gender")}: {g?.gender || ""} ·{" "}
                    {t("tour.booking.idNumber")}: {g?.idNumber || ""} ·{" "}
                    {renderGuestType(g?.bookingGuestType)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{t("common.na")}</Text>
            )}
          </View>

          {((isPendingPayment ||
            isPendingDepositPayment ||
            isPendingBalancePayment) ||
            canCancel) && (
            <View style={styles.paymentButtonsContainer}>
          {(isPendingPayment ||
            isPendingDepositPayment ||
            isPendingBalancePayment) && (
            <TouchableOpacity
              style={styles.continuePaymentButton}
              onPress={handleContinuePayment}
            >
              <Ionicons name="card-outline" size={18} color="#2C3E50" />
              <Text style={styles.continuePaymentButtonText}>
                {t("payment.continuePayment")}
              </Text>
            </TouchableOpacity>
              )}

              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handlePreviewCancel}
                  disabled={loadingCancelPreview}
                >
                  {loadingCancelPreview ? (
                    <ActivityIndicator size="small" color="#8B4A5A" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={18} color="#8B4A5A" />
                      <Text style={styles.cancelButtonText}>
                        {t("tour.booking.cancelAction")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {isAwaitingCompletion && !booking?.userConfirmedCompletion && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.confirmCompletionButton}
                onPress={handleConfirmCompletion}
                disabled={confirmingCompletion}
              >
                {confirmingCompletion ? (
                  <>
                    <ActivityIndicator size="small" color="#2C3E50" />
                    <Text style={styles.confirmCompletionButtonText}>
                      {t("tour.booking.confirmCompletionProcessing") ||
                        "Đang xác nhận..."}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={18} color="#2C3E50" />
                    <Text style={styles.confirmCompletionButtonText}>
                      {t("tour.booking.confirmCompletion") ||
                        "Xác nhận tour đã hoàn thành"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.complaintButton}
                onPress={handleOpenComplaint}
                disabled={submittingComplaint}
              >
                <Ionicons name="alert-circle-outline" size={18} color="#8B4A5A" />
                <Text style={styles.complaintButtonText}>
                  {t("tour.booking.complaint") || "Khiếu nại"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.updateInfo") || "Cập nhật thông tin"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUpdateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#7A8A99" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {updateData && (
                <>
                  {}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      {t("tour.confirm.contactInfo")}
                    </Text>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.fullName")}
                      </Text>
                      <TextInput
                        style={[
                          styles.modalInput,
                          isWaitingForUpdate && styles.modalInputDisabled,
                        ]}
                        value={updateData.contactName}
                        onChangeText={(text) => {
                          // Remove numbers from name input
                          const filteredText = text.replace(/[0-9]/g, "");
                          setUpdateData({ ...updateData, contactName: filteredText });
                        }}
                        placeholder={t("tour.booking.fullName")}
                        editable={!isWaitingForUpdate}
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.phoneNumber")}
                      </Text>
                      <TextInput
                        style={styles.modalInput}
                        value={updateData.contactPhone}
                        onChangeText={(text) => {
                          const digits = (text || "").replace(/\D/g, "");
                          setUpdateData({
                            ...updateData,
                            contactPhone: digits,
                          });
                        }}
                        placeholder={t("tour.booking.phoneNumber")}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.email")}
                      </Text>
                      <TextInput
                        style={[
                          styles.modalInput,
                          isWaitingForUpdate && styles.modalInputDisabled,
                        ]}
                        value={updateData.contactEmail}
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, contactEmail: text })
                        }
                        placeholder={t("tour.booking.email")}
                        keyboardType="email-address"
                        editable={!isWaitingForUpdate}
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.address")}
                      </Text>
                      <TextInput
                        style={styles.modalInput}
                        value={updateData.contactAddress}
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, contactAddress: text })
                        }
                        placeholder={t("tour.booking.address")}
                        multiline
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.pickUpPoint")}
                      </Text>
                      <TextInput
                        style={styles.modalInput}
                        value={updateData.pickupPoint}
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, pickupPoint: text })
                        }
                        placeholder={t("tour.booking.pickUpPoint")}
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.note")}
                      </Text>
                      <TextInput
                        style={[styles.modalInput, styles.modalTextArea]}
                        value={updateData.note}
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, note: text })
                        }
                        placeholder={t("tour.booking.note")}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>

                  {}
                  {updateData.adultInfo && updateData.adultInfo.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {t("tour.booking.adult")}
                      </Text>
                      {updateData.adultInfo.map((guest: any, idx: number) => (
                        <View key={idx} style={styles.modalGuestCard}>
                          <Text style={styles.modalGuestTitle}>
                            {t("tour.booking.adult")} {idx + 1}
                          </Text>
                          <View style={styles.modalField}>
                            <Text style={styles.modalLabel}>
                              {t("tour.booking.fullname")}
                            </Text>
                            <TextInput
                              style={styles.modalInput}
                              value={guest.fullName}
                              onChangeText={(text) => {
                                const filteredText = text.replace(/[0-9]/g, "");
                                const newAdultInfo = [...updateData.adultInfo];
                                newAdultInfo[idx].fullName = filteredText;
                                setUpdateData({
                                  ...updateData,
                                  adultInfo: newAdultInfo,
                                });
                              }}
                            />
                          </View>
                          <View style={styles.modalField}>
                            <Text style={styles.modalLabel}>
                              {t("tour.booking.idNumber")}
                            </Text>
                            <TextInput
                              style={styles.modalInput}
                              value={guest.idNumber}
                              onChangeText={(text) => {
                                const newAdultInfo = [...updateData.adultInfo];
                                newAdultInfo[idx].idNumber = text;
                                setUpdateData({
                                  ...updateData,
                                  adultInfo: newAdultInfo,
                                });
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {updateData.childrenInfo &&
                    updateData.childrenInfo.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>
                          {t("tour.booking.children")}
                        </Text>
                        {updateData.childrenInfo.map(
                          (guest: any, idx: number) => (
                            <View key={idx} style={styles.modalGuestCard}>
                              <Text style={styles.modalGuestTitle}>
                                {t("tour.booking.children")} {idx + 1}
                              </Text>
                              <View style={styles.modalField}>
                                <Text style={styles.modalLabel}>
                                  {t("tour.booking.fullname")}
                                </Text>
                                <TextInput
                                  style={styles.modalInput}
                                  value={guest.fullName}
                                  onChangeText={(text) => {
                                    const newChildrenInfo = [
                                      ...updateData.childrenInfo,
                                    ];
                                    newChildrenInfo[idx].fullName = text;
                                    setUpdateData({
                                      ...updateData,
                                      childrenInfo: newChildrenInfo,
                                    });
                                  }}
                                />
                              </View>
                              <View style={styles.modalField}>
                                <Text style={styles.modalLabel}>
                                  {t("tour.booking.idNumber")}
                                </Text>
                                <TextInput
                                  style={styles.modalInput}
                                  value={guest.idNumber}
                                  onChangeText={(text) => {
                                    const newChildrenInfo = [
                                      ...updateData.childrenInfo,
                                    ];
                                    newChildrenInfo[idx].idNumber = text;
                                    setUpdateData({
                                      ...updateData,
                                      childrenInfo: newChildrenInfo,
                                    });
                                  }}
                                />
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  {updateData.babyInfo && updateData.babyInfo.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        {t("tour.booking.baby")}
                      </Text>
                      {updateData.babyInfo.map((guest: any, idx: number) => (
                        <View key={idx} style={styles.modalGuestCard}>
                          <Text style={styles.modalGuestTitle}>
                            {t("tour.booking.baby")} {idx + 1}
                          </Text>
                          <View style={styles.modalField}>
                            <Text style={styles.modalLabel}>
                              {t("tour.booking.fullname")}
                            </Text>
                            <TextInput
                              style={styles.modalInput}
                              value={guest.fullName}
                              onChangeText={(text) => {
                                const newBabyInfo = [...updateData.babyInfo];
                                newBabyInfo[idx].fullName = text;
                                setUpdateData({
                                  ...updateData,
                                  babyInfo: newBabyInfo,
                                });
                              }}
                            />
                          </View>
                          <View style={styles.modalField}>
                            <Text style={styles.modalLabel}>
                              {t("tour.booking.idNumber")}
                            </Text>
                            <TextInput
                              style={styles.modalInput}
                              value={guest.idNumber}
                              onChangeText={(text) => {
                                const newBabyInfo = [...updateData.babyInfo];
                                newBabyInfo[idx].idNumber = text;
                                setUpdateData({
                                  ...updateData,
                                  babyInfo: newBabyInfo,
                                });
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleUpdateSubmit}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {t("common.submit")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>
              {t("tour.booking.confirmUpdate") ||
                "Bạn chắc chắn cập nhật đúng thông tin chứ?"}
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmModalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmModalCancelText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalConfirmButton}
                onPress={handleConfirmUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#2C3E50" size="small" />
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

      {}
      <Modal
        visible={showComplaintModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowComplaintModal(false)}
      >
        <View style={styles.complaintModalOverlay}>
          <View style={styles.complaintModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.complaintTitle") || "Khiếu nại"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowComplaintModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#7A8A99" />
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

      {}
      <Modal
        visible={showCancelPreview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCancelPreview(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.cancelPreviewTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCancelPreview(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#7A8A99" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {cancelPreview ? (
                <>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.refundAmount")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {formatPrice(cancelPreview.refundAmount || 0)}
                    </Text>
                    <Text style={styles.modalNote}>
                      {`${t("tour.booking.refundFromPaid")} `}
                      {formatPrice(cancelPreview.payedAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.refundPercentage")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {`${cancelPreview.refundPercentage || 0}%`}
                    </Text>
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.payedAmount")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {formatPrice(cancelPreview.payedAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.depositAmount")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {formatPrice(cancelPreview.depositAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.totalAmount")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {formatPrice(cancelPreview.totalAmount || 0)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.modalField}>
                  <ActivityIndicator size="small" color="#B8D4E3" />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCancelPreview(false)}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleConfirmCancel}
                disabled={confirmingCancel}
              >
                {confirmingCancel ? (
                  <ActivityIndicator color="#2C3E50" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>
                    {t("tour.booking.cancelAction")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showCancelSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCancelSuccessModal(false)}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.cancelSuccessTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCancelSuccessModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#7A8A99" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {cancelSuccessData ? (
                <>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.refundAmount")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {formatPrice(cancelSuccessData.refundAmount || 0)}
                    </Text>
                    <Text style={styles.modalNote}>
                      {`${t("tour.booking.refundFromPaid")} `}
                      {formatPrice(cancelSuccessData.payedAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {t("tour.booking.refundPercentage")}
                    </Text>
                    <Text style={styles.modalInput}>
                      {`${cancelSuccessData.refundPercentage || 0}%`}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.modalField}>
                  <ActivityIndicator size="small" color="#B8D4E3" />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={() => setShowCancelSuccessModal(false)}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {t("common.confirm") || "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
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
                  <ActivityIndicator color="#2C3E50" size="small" />
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
