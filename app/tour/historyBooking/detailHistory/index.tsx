import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import MainLayout from "../../../../components/MainLayout";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../../../services/endpoints/tour";
import {
  BookingResponse,
  GuestResponse,
  BookingStatus,
} from "../../../../src/types/response/booking.response";
import { TourResponse } from "../../../../src/types/response/tour.response";
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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

  const formatPrice = (price: number) =>
    (price || 0).toLocaleString("vi-VN") + " VND";

  const bookingStatus = booking?.bookingStatus
    ? String(booking.bookingStatus).toUpperCase()
    : "";

  const isPendingPayment =
    bookingStatus === BookingStatus.PENDING_PAYMENT ||
    bookingStatus === "PENDING_PAYMENT";

  const isWaitingForUpdate =
    bookingStatus === BookingStatus.WAITING_FOR_UPDATE ||
    bookingStatus === "WAITING_FOR_UPDATE";

  const getStatusText = () => {
    if (isPendingPayment) {
      return t("payment.result.pendingPayment");
    }
    if (isWaitingForUpdate) {
      return t("tour.booking.waitingForUpdate") || "Chờ cập nhật thông tin";
    }
    if (
      bookingStatus === BookingStatus.BOOKING_SUCCESS ||
      bookingStatus === "BOOKING_SUCCESS"
    ) {
      return t("payment.result.success");
    }
    return bookingStatus || t("common.na");
  };

  const getStatusColor = () => {
    if (isPendingPayment) {
      return "#FF9500";
    }
    if (isWaitingForUpdate) {
      return "#FF9500";
    }
    if (
      bookingStatus === BookingStatus.BOOKING_SUCCESS ||
      bookingStatus === "BOOKING_SUCCESS"
    ) {
      return "#34C759";
    }
    return "#666";
  };

  const handleContinuePayment = () => {
    if (!booking?.bookingId || !booking?.tourId) {
      return;
    }
    router.push({
      pathname: "/tour/confirm" as any,
      params: {
        bookingId: String(booking.bookingId),
        tourId: String(booking.tourId),
      },
    });
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

  return (
    <MainLayout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
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
            {typeof totalAmount === "number" && (
              <View style={styles.row}>
                <Text style={styles.label}>
                  {t("tour.confirm.priceSummary")}
                </Text>
                <Text style={styles.valueBold}>{formatPrice(totalAmount)}</Text>
              </View>
            )}
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
                <Ionicons name="create-outline" size={20} color="#fff" />
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

          {isPendingPayment && (
            <TouchableOpacity
              style={styles.continuePaymentButton}
              onPress={handleContinuePayment}
            >
              <Ionicons name="card" size={18} color="#fff" />
              <Text style={styles.continuePaymentButtonText}>
                {t("payment.continuePayment")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Update Info Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.booking.updateInfo") || "Cập nhật thông tin"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUpdateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {updateData && (
                <>
                  {/* Contact Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      {t("tour.confirm.contactInfo")}
                    </Text>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.fullName")}
                      </Text>
                      <TextInput
                        style={[styles.modalInput, isWaitingForUpdate && styles.modalInputDisabled]}
                        value={updateData.contactName}
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, contactName: text })
                        }
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
                        onChangeText={(text) =>
                          setUpdateData({ ...updateData, contactPhone: text })
                        }
                        placeholder={t("tour.booking.phoneNumber")}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.modalField}>
                      <Text style={styles.modalLabel}>
                        {t("tour.booking.email")}
                      </Text>
                      <TextInput
                        style={[styles.modalInput, isWaitingForUpdate && styles.modalInputDisabled]}
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

                  {/* Guests Info */}
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
                                const newAdultInfo = [...updateData.adultInfo];
                                newAdultInfo[idx].fullName = text;
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

      {/* Confirm Update Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
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
