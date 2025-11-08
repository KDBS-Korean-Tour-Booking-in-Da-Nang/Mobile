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
import {
  VoucherResponse,
  VoucherDiscountType,
  VoucherStatus,
} from "../../../src/types/tour";
import styles from "./styles";

export default function VoucherList() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | "ALL">(
    "ALL"
  );

  // Mock data - sẽ thay bằng API call sau
  const mockVouchers: VoucherResponse[] = [
    {
      voucherId: 1,
      companyId: 1,
      code: "SUMMER2024",
      name: "Giảm giá mùa hè 2024",
      discountType: VoucherDiscountType.PERCENTAGE,
      discountValue: 15,
      minOrderValue: 1000000,
      totalQuantity: 100,
      remainingQuantity: 45,
      startDate: "2024-01-01T00:00:00",
      endDate: "2024-12-31T23:59:59",
      status: VoucherStatus.ACTIVE,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    },
    {
      voucherId: 2,
      companyId: 1,
      code: "WELCOME50",
      name: "Voucher chào mừng",
      discountType: VoucherDiscountType.FIXED_AMOUNT,
      discountValue: 50000,
      minOrderValue: 500000,
      totalQuantity: 200,
      remainingQuantity: 120,
      startDate: "2024-01-01T00:00:00",
      endDate: "2024-12-31T23:59:59",
      status: VoucherStatus.ACTIVE,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    },
    {
      voucherId: 3,
      companyId: 1,
      code: "VIP20",
      name: "Voucher VIP giảm 20%",
      discountType: VoucherDiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderValue: 2000000,
      totalQuantity: 50,
      remainingQuantity: 15,
      startDate: "2024-01-01T00:00:00",
      endDate: "2024-12-31T23:59:59",
      status: VoucherStatus.ACTIVE,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    },
    {
      voucherId: 4,
      companyId: 1,
      code: "SPRING30",
      name: "Voucher mùa xuân 30%",
      discountType: VoucherDiscountType.PERCENTAGE,
      discountValue: 30,
      minOrderValue: 3000000,
      totalQuantity: 30,
      remainingQuantity: 5,
      startDate: "2024-01-01T00:00:00",
      endDate: "2024-12-31T23:59:59",
      status: VoucherStatus.ACTIVE,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    },
    {
      voucherId: 5,
      companyId: 1,
      code: "NEW100K",
      name: "Giảm 100K cho đơn hàng mới",
      discountType: VoucherDiscountType.FIXED_AMOUNT,
      discountValue: 100000,
      minOrderValue: 1000000,
      totalQuantity: 100,
      remainingQuantity: 0,
      startDate: "2024-01-01T00:00:00",
      endDate: "2024-12-31T23:59:59",
      status: VoucherStatus.INACTIVE,
      createdAt: "2024-01-01T00:00:00",
      updatedAt: "2024-01-01T00:00:00",
    },
  ];

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with API call
      // const vouchersData = (await voucherEndpoints.getAll()).data;
      // setVouchers(Array.isArray(vouchersData) ? vouchersData : []);
      setVouchers(mockVouchers);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

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

    // Filter by keyword
    const k = keyword.trim().toLowerCase();
    if (k) {
      filtered = filtered.filter((v) => {
        const code = (v.code || "").toLowerCase();
        const name = (v.name || "").toLowerCase();
        return code.includes(k) || name.includes(k);
      });
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((v) => v.status === filterStatus);
    }

    return filtered;
  }, [vouchers, keyword, filterStatus]);

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

  const getStatusColor = (status: VoucherStatus) => {
    switch (status) {
      case VoucherStatus.ACTIVE:
        return "#2F9E44";
      case VoucherStatus.INACTIVE:
        return "#999";
      case VoucherStatus.EXPIRED:
        return "#FF4444";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: VoucherStatus) => {
    switch (status) {
      case VoucherStatus.ACTIVE:
        return t("tour.voucher.status.active") || "Đang hoạt động";
      case VoucherStatus.INACTIVE:
        return t("tour.voucher.status.inactive") || "Không hoạt động";
      case VoucherStatus.EXPIRED:
        return t("tour.voucher.status.expired") || "Hết hạn";
      default:
        return status;
    }
  };

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
            placeholder={t("tour.voucher.list.searchPlaceholder") || "Tìm kiếm voucher..."}
            placeholderTextColor="#9aa0a6"
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword("")}>
              <Ionicons name="close-circle" size={18} color="#9aa0a6" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === "ALL" && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus("ALL")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === "ALL" && styles.filterButtonTextActive,
                ]}
              >
                {t("tour.voucher.filter.all") || "Tất cả"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === VoucherStatus.ACTIVE &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(VoucherStatus.ACTIVE)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === VoucherStatus.ACTIVE &&
                    styles.filterButtonTextActive,
                ]}
              >
                {t("tour.voucher.filter.active") || "Đang hoạt động"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === VoucherStatus.INACTIVE &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(VoucherStatus.INACTIVE)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === VoucherStatus.INACTIVE &&
                    styles.filterButtonTextActive,
                ]}
              >
                {t("tour.voucher.filter.inactive") || "Không hoạt động"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === VoucherStatus.EXPIRED &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(VoucherStatus.EXPIRED)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === VoucherStatus.EXPIRED &&
                    styles.filterButtonTextActive,
                ]}
              >
                {t("tour.voucher.filter.expired") || "Hết hạn"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.vouchersList}>
          {filteredVouchers.length > 0 ? (
            filteredVouchers.map((voucher) => (
              <View key={voucher.voucherId} style={styles.voucherCard}>
                <View style={styles.voucherCardHeader}>
                  <View style={styles.voucherIconContainer}>
                    <Ionicons name="ticket" size={32} color="#FF6B6B" />
                  </View>
                  <View style={styles.voucherHeaderInfo}>
                    <Text style={styles.voucherCode}>{voucher.code}</Text>
                    <Text style={styles.voucherName} numberOfLines={2}>
                      {voucher.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.voucherStatusBadge,
                      { backgroundColor: getStatusColor(voucher.status) },
                    ]}
                  >
                    <Text style={styles.voucherStatusText}>
                      {getStatusText(voucher.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.voucherDetails}>
                  <View style={styles.voucherDetailRow}>
                    <Ionicons name="pricetag" size={16} color="#666" />
                    <Text style={styles.voucherDetailLabel}>
                      {t("tour.confirm.discount")}:
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {voucher.discountType === VoucherDiscountType.PERCENTAGE
                        ? `${voucher.discountValue}%`
                        : `${voucher.discountValue.toLocaleString()} VND`}
                    </Text>
                  </View>

                  <View style={styles.voucherDetailRow}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.voucherDetailLabel}>
                      {t("tour.voucher.minOrder") || "Đơn tối thiểu"}:
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {voucher.minOrderValue.toLocaleString()} VND
                    </Text>
                  </View>

                  <View style={styles.voucherDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.voucherDetailLabel}>
                      {t("tour.voucher.validUntil") || "Có hiệu lực đến"}:
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {formatDate(voucher.endDate)}
                    </Text>
                  </View>

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
                  <View style={styles.voucherOutOfStock}>
                    <Text style={styles.voucherOutOfStockText}>
                      {t("tour.voucher.outOfStock") || "Đã hết"}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {t("tour.voucher.list.empty") || "Không tìm thấy voucher"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t("tour.voucher.list.emptySubtitle") ||
                  "Hãy thử điều chỉnh từ khóa hoặc bộ lọc."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </MainLayout>
  );
}

