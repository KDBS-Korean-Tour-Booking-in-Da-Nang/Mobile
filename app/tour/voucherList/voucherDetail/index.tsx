import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../../components/MainLayout";
import { useNavigation } from "../../../../navigation/navigation";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  VoucherResponse,
  VoucherDiscountType,
  VoucherStatus,
} from "../../../../src/types/response/voucher.response";
import { TourResponse } from "../../../../src/types/response/tour.response";
import styles from "./styles";
import { formatPriceKRW } from "../../../../src/utils/currency";
import { voucherEndpoints } from "../../../../services/endpoints/voucher";
import { tourEndpoints } from "../../../../services/endpoints/tour";

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const normalizeDate = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return new Date(value).toISOString();
  } catch {
    return String(value);
  }
};

const normalizeVoucher = (raw: any): VoucherResponse | null => {
  if (!raw) return null;
  const tourIds = Array.isArray(raw.tourIds)
    ? raw.tourIds
        .map((id: any) => Number(id))
        .filter((n: number) => !Number.isNaN(n))
    : undefined;

  const normalizedType =
    String(raw.discountType || "").toUpperCase() === "PERCENT"
      ? VoucherDiscountType.PERCENT
      : VoucherDiscountType.FIXED;

  return {
    voucherId: Number(raw.voucherId ?? raw.id ?? 0),
    companyId: Number(raw.companyId ?? 0),
    code: raw.code ?? "",
    name: raw.name ?? "",
    discountType: normalizedType,
    discountValue: toNumber(raw.discountValue),
    minOrderValue: toNumber(raw.minOrderValue),
    totalQuantity: toNumber(raw.totalQuantity),
    remainingQuantity: toNumber(raw.remainingQuantity),
    startDate: normalizeDate(raw.startDate),
    endDate: normalizeDate(raw.endDate),
    status: raw.status ?? VoucherStatus.ACTIVE,
    createdAt: normalizeDate(raw.createdAt),
    updatedAt: normalizeDate(raw.updatedAt),
    tourId: raw.tourId ? Number(raw.tourId) : undefined,
    companyUsername: raw.companyUsername ?? undefined,
    tourName: raw.tourName ?? undefined,
    tourIds,
  };
};

export default function VoucherDetail() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const voucherId = params.voucherId
    ? Number(
        Array.isArray(params.voucherId) ? params.voucherId[0] : params.voucherId
      )
    : null;

  const [voucher, setVoucher] = useState<VoucherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToursModal, setShowToursModal] = useState(false);
  const [applicableTours, setApplicableTours] = useState<TourResponse[]>([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadVoucher = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await voucherEndpoints.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      const normalized = data
        .map(normalizeVoucher)
        .filter((v): v is VoucherResponse => !!v);
      if (voucherId) {
        const found = normalized.find((v) => v.voucherId === voucherId);
        setVoucher(found ?? null);
      } else {
        setVoucher(null);
      }
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message ||
          t("tour.voucher.detail.loadFailed") ||
          "Không thể tải voucher"
      );
      setVoucher(null);
    } finally {
      setLoading(false);
    }
  }, [voucherId, t]);

  useEffect(() => {
    loadVoucher();
  }, [loadVoucher]);

  const loadApplicableTours = useCallback(
    async (targetVoucher: VoucherResponse) => {
      if (!targetVoucher?.tourIds || targetVoucher.tourIds.length === 0) {
        setApplicableTours([]);
        return;
      }
      try {
        setToursLoading(true);
        const requests = targetVoucher.tourIds.map((id) =>
          tourEndpoints.getById(id)
        );
        const responses = await Promise.allSettled(requests);
        const tours = responses
          .map((result) =>
            result.status === "fulfilled" && result.value?.data
              ? result.value.data
              : null
          )
          .filter(
            (item): item is TourResponse =>
              !!item && typeof item.id === "number"
          );
        setApplicableTours(tours);
      } catch {
        setApplicableTours([]);
      } finally {
        setToursLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (voucher) {
      loadApplicableTours(voucher);
    }
  }, [voucher, loadApplicableTours]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8D4E3" />
          <Text style={styles.loadingText}>{t("tour.loading")}</Text>
        </View>
      </MainLayout>
    );
  }

  if (!voucher) {
    return (
      <MainLayout>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("tour.voucher.detail.title") || "Chi tiết Voucher"}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={64} color="#B8D4E3" />
          <Text style={styles.emptyTitle}>
            {loadError || t("tour.voucher.detail.notFound")}
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("tour.voucher.detail.title") || "Chi tiết Voucher"}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.voucherCard}>
          <View style={styles.voucherCardHeader}>
            <View style={styles.voucherIconContainer}>
              <Ionicons name="ticket-outline" size={48} color="#F5B8C4" />
            </View>
            <View style={styles.voucherHeaderInfo}>
              <Text style={styles.voucherCode}>{voucher.code}</Text>
              <Text style={styles.voucherName}>{voucher.name}</Text>
            </View>
          </View>

          <View style={styles.voucherDetails}>
            <View style={styles.voucherDetailSection}>
              <Text style={styles.sectionTitle}>
                {t("tour.voucher.detail.discountInfo")}
              </Text>
              <View style={styles.voucherDetailRow}>
                <Ionicons name="pricetag-outline" size={20} color="#7A8A99" />
                <Text style={styles.voucherDetailLabel}>
                  {t("tour.confirm.discount")}:
                </Text>
                <Text style={styles.voucherDetailValue}>
                  {voucher.discountType === VoucherDiscountType.PERCENT
                    ? `${voucher.discountValue}%`
                    : formatPriceKRW(voucher.discountValue)}
                </Text>
              </View>

              <View style={styles.voucherDetailRow}>
                <Ionicons name="cash-outline" size={20} color="#7A8A99" />
                <Text style={styles.voucherDetailLabel}>
                  {t("tour.voucher.minOrder")}:
                </Text>
                <Text style={styles.voucherDetailValue}>
                  {formatPriceKRW(voucher.minOrderValue)}
                </Text>
              </View>
            </View>

            <View style={styles.voucherDetailSection}>
              <Text style={styles.sectionTitle}>
                {t("tour.voucher.detail.validityInfo")}
              </Text>
              <View style={styles.voucherDetailRow}>
                <Ionicons name="calendar-outline" size={20} color="#7A8A99" />
                <Text style={styles.voucherDetailLabel}>
                  {t("tour.voucher.validUntil")}:
                </Text>
                <Text style={styles.voucherDetailValue}>
                  {formatDate(voucher.endDate)}
                </Text>
              </View>
            </View>

            <View style={styles.voucherDetailSection}>
              <Text style={styles.sectionTitle}>
                {t("tour.voucher.applicableTour")}
              </Text>
              <TouchableOpacity
                style={styles.applicableTourButton}
                onPress={() => setShowToursModal(true)}
                disabled={!voucher.tourIds || voucher.tourIds.length === 0}
              >
                <Ionicons name="location-outline" size={20} color="#5A6C7D" />
                <Text style={styles.applicableTourButtonText}>
                  {voucher.tourIds && voucher.tourIds.length > 0
                    ? t("tour.voucher.viewApplicableTours")
                    : t("tour.voucher.noSpecificTours") ||
                      "Áp dụng cho tất cả tour đủ điều kiện"}
                </Text>
                {voucher.tourIds && voucher.tourIds.length > 0 && (
                  <Ionicons name="chevron-forward-outline" size={20} color="#5A6C7D" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {voucher.remainingQuantity === 0 && (
            <View style={styles.voucherOutOfStock}>
              <Text style={styles.voucherOutOfStockText}>
                {t("tour.voucher.outOfStock")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={showToursModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowToursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.voucher.applicableTour")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowToursModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-outline" size={20} color="#7A8A99" />
              </TouchableOpacity>
            </View>
            {toursLoading ? (
              <View style={styles.tourLoadingContainer}>
                <ActivityIndicator size="small" color="#B8D4E3" />
                <Text style={styles.tourLoadingText}>
                  {t("tour.voucher.loadingTours") ||
                    "Đang tải danh sách tour..."}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView}>
                {applicableTours.length > 0 ? (
                  applicableTours.map((tour) => (
                    <View key={tour.id} style={styles.tourItem}>
                      <Text style={styles.tourItemName}>{tour.tourName}</Text>
                      <Text style={styles.tourItemDescription}>
                        {tour.tourDescription}
                      </Text>
                      <View style={styles.tourItemInfo}>
                        <Text style={styles.tourItemPrice}>
                          {tour.adultPrice ? formatPriceKRW(tour.adultPrice) : "-"}
                        </Text>
                        <Text style={styles.tourItemDuration}>
                          {tour.tourDuration}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.tourEmptyContainer}>
                    <Ionicons name="compass-outline" size={48} color="#B8D4E3" />
                    <Text style={styles.tourEmptyText}>
                      {t("tour.voucher.noSpecificTours") ||
                        "Voucher áp dụng cho tất cả tour đáp ứng điều kiện"}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}
