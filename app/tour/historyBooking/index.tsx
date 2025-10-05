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
} from "react-native";
import styles from "./styles";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../src/components/MainLayout";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../../src/contexts/authContext";
import { tourEndpoints } from "../../../src/endpoints/tour";
import { transactionEndpoints } from "../../../src/endpoints/transactions";
import { BookingSummaryResponse, TourResponse } from "../../../src/types/tour";

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

  const resolveTourCardImage = (t?: TourResponse): string => {
    if (!t) {
      return "";
    }
    const isHttp = (u?: string) =>
      !!u && /^https?:\/\//i.test((u || "").trim());
    if (isHttp(t?.tourImgPath)) return (t.tourImgPath as string).trim();
    const first = ((t?.contents || []) as any[])
      .flatMap((c) => (Array.isArray(c?.images) ? c.images : []))
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .find((u) => u && isHttp(u));
    return first || "";
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.email) {
        setItems([]);
        return;
      }
      const [summaries, txs] = await Promise.all([
        tourEndpoints.getBookingSummaryByEmail(user.email).then((r) => r.data),
        transactionEndpoints.getByUserEmail(user.email).then((r) => r.data),
      ]);

      const successTxs = (txs || []).filter(
        (t: any) => String(t.status).toUpperCase() === "SUCCESS"
      );
      const successOrderInfos = new Set(
        successTxs
          .map((t: any) => (t.orderInfo || "").toLowerCase())
          .filter((s: string) => !!s)
      );

      const successItems = (summaries || []).filter((s: any) => {
        const name = (s.tourName || "").toLowerCase();
        if (!name) return false;
        for (const info of successOrderInfos) {
          if ((info as string).includes(name)) return true;
        }
        return false;
      });
      setItems(successItems);

      const ids: number[] = Array.from(
        new Set(successItems.map((x: any) => Number(x.tourId)).filter(Boolean))
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
    } catch {
      Alert.alert(t("common.error"), t("payment.result.fetchError"));
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
      pathname: "/tour/booking/detailHistory",
      params: { bookingId },
    } as any);
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        style={styles.scroll}
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
            items.map((it) => (
              <TouchableOpacity
                key={it.bookingId}
                onPress={() => handleOpenBooking(it.bookingId)}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <Image
                    source={{
                      uri:
                        tourImageById[Number(it.tourId)] ||
                        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=120&fit=crop",
                    }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {it.tourName}
                    </Text>
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
                  <Ionicons name="chevron-forward" size={20} color="#9aa0a6" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}
