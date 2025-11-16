import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  VoucherResponse,
  VoucherDiscountType,
  VoucherStatus,
} from "../../../src/types/response/voucher.response";
import styles from "./styles";
import { voucherEndpoints } from "../../../services/endpoints/voucher";

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

export default function VoucherList() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const router = useRouter();

  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await voucherEndpoints.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      const normalized = data
        .map(normalizeVoucher)
        .filter((v): v is VoucherResponse => !!v);
      setVouchers(normalized);
    } catch (error: any) {
      setLoadError(
        t("tour.voucher.list.loadFailed") ||
          error?.response?.data?.message ||
          "Không thể tải danh sách voucher"
      );
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVouchers();
    setRefreshing(false);
  }, [loadVouchers]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const filteredVouchers = useMemo(() => {
    let filtered = vouchers;

    const k = keyword.trim().toLowerCase();
    if (k) {
      filtered = filtered.filter((v) => {
        const code = (v.code || "").toLowerCase();
        const name = (v.name || "").toLowerCase();
        const discountValueStr = v.discountValue.toString();
        const discountValueFormatted = v.discountValue.toLocaleString();
        const discountTypeStr =
          v.discountType === VoucherDiscountType.PERCENT
            ? `${v.discountValue}%`
            : `${v.discountValue.toLocaleString()} VND`;

        return (
          code.includes(k) ||
          name.includes(k) ||
          discountValueStr.includes(k) ||
          discountValueFormatted.includes(k) ||
          discountTypeStr.toLowerCase().includes(k)
        );
      });
    }

    return filtered;
  }, [vouchers, keyword]);

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("tour.loading")}</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("tour.voucher.list.title") || "Danh sách Voucher"}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder={
              t("tour.voucher.list.searchPlaceholder") || "Tìm kiếm voucher..."
            }
            placeholderTextColor="#9aa0a6"
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword("")}>
              <Ionicons name="close-circle" size={18} color="#9aa0a6" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.vouchersList}>
          {filteredVouchers.length > 0 ? (
            filteredVouchers.map((voucher) => (
              <TouchableOpacity
                key={voucher.voucherId}
                style={styles.voucherCard}
                onPress={() => {
                  router.push({
                    pathname: "/tour/voucherList/voucherDetail" as any,
                    params: { voucherId: voucher.voucherId },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.voucherCardHeader} pointerEvents="box-none">
                  <View style={styles.voucherIconContainer}>
                    <Ionicons name="ticket" size={32} color="#FF6B6B" />
                  </View>
                  <View style={styles.voucherHeaderInfo}>
                    <Text style={styles.voucherCode}>{voucher.code}</Text>
                    <Text style={styles.voucherName} numberOfLines={2}>
                      {voucher.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.voucherDetails} pointerEvents="box-none">
                  <View style={styles.voucherDetailRow}>
                    <Ionicons name="pricetag" size={16} color="#666" />
                    <Text style={styles.voucherDetailLabel}>
                      {t("tour.confirm.discount")}:
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {voucher.discountType === VoucherDiscountType.PERCENT
                        ? `${voucher.discountValue}%`
                        : `${voucher.discountValue.toLocaleString()} VND`}
                    </Text>
                  </View>

                  {voucher.companyUsername && (
                    <View style={styles.voucherDetailRow}>
                      <Ionicons name="business" size={16} color="#666" />
                      <Text style={styles.voucherDetailLabel}>
                        {t("tour.voucher.company")}:
                      </Text>
                      <Text style={styles.voucherDetailValue}>
                        {voucher.companyUsername}
                      </Text>
                    </View>
                  )}

                  <View style={styles.voucherDetailRow}>
                    <Ionicons name="basket-outline" size={16} color="#666" />
                    <Text style={styles.voucherDetailLabel}>
                      {t("tour.confirm.remaining")}:
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {voucher.remainingQuantity} / {voucher.totalQuantity}
                    </Text>
                  </View>
                </View>

                {voucher.remainingQuantity === 0 && (
                  <View style={styles.voucherOutOfStock} pointerEvents="none">
                    <Text style={styles.voucherOutOfStockText}>
                      {t("tour.voucher.outOfStock")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {t("tour.voucher.list.empty")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {loadError || t("tour.voucher.list.emptySubtitle")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </MainLayout>
  );
}
