import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../src/components/MainLayout";
import { useNavigation } from "../../../src/navigation";
import { useTranslation } from "react-i18next";
import { tourService } from "../../../src/services/tourService";
import { TourResponse } from "../../../src/types/tour";
import styles from "./styles";

export default function TourList() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();

  const [tours, setTours] = useState<TourResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Navigation scroll effects
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  // Load tours
  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const toursData = await tourService.getAllTours();
      setTours(toursData);
    } catch (error) {
      console.error("Error loading tours:", error);
      Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTours();
    setRefreshing(false);
  }, [loadTours]);

  // Load tours on mount
  useEffect(() => {
    loadTours();
  }, [loadTours]);

  // Handle scroll for navigation effects
  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

    if (scrollDifference > scrollThreshold) {
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide navbar
        setIsNavVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  }, []);

  const handleTourPress = (tourId: number) => {
    navigate(`/tour?id=${tourId}`);
  };

  const resolveTourCardImage = (t: any): string => {
    const isHttp = (u?: string) =>
      !!u && /^https?:\/\//i.test((u || "").trim());
    if (isHttp(t?.tourImgPath)) return (t.tourImgPath as string).trim();
    const first = ((t?.contents || []) as any[])
      .flatMap((c) => (Array.isArray(c?.images) ? c.images : []))
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .find((u) => u && isHttp(u));
    return (
      first ||
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop"
    );
  };

  const filteredTours = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return tours;
    return tours.filter((it) => {
      const name = (it.tourName || "").toLowerCase();
      const dep = (it.tourDeparturePoint || "").toLowerCase();
      const type = (it.tourType || "").toLowerCase();
      return name.includes(k) || dep.includes(k) || type.includes(k);
    });
  }, [tours, keyword]);

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
    <MainLayout isNavVisible={isNavVisible}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("tour.list.title")}</Text>
          <TouchableOpacity
            style={styles.purchasedButton}
            onPress={() => navigate("/tour/historyBooking")}
          >
            <Ionicons name="receipt-outline" size={18} color="#007AFF" />
            <Text style={styles.purchasedButtonText}>
              {t("tour.list.viewPurchased")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder={t("tour.list.searchPlaceholder")}
            placeholderTextColor="#9aa0a6"
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword("")}>
              <Ionicons name="close-circle" size={18} color="#9aa0a6" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tours Grid */}
        <View style={styles.toursGrid}>
          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => (
              <TouchableOpacity
                key={tour.id}
                style={styles.tourCard}
                onPress={() => handleTourPress(tour.id)}
              >
                <Image
                  source={{ uri: resolveTourCardImage(tour) }}
                  style={styles.tourImage}
                />
                <View style={styles.tourContent}>
                  <Text style={styles.tourTitle} numberOfLines={2}>
                    {tour.tourName}
                  </Text>
                  <View style={styles.tourMeta}>
                    <View style={styles.locationContainer}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6c757d"
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {tour.tourDeparturePoint}
                      </Text>
                    </View>
                    <View style={styles.durationContainer}>
                      <Ionicons name="time-outline" size={14} color="#6c757d" />
                      <Text style={styles.durationText}>
                        {tour.tourDuration || "3N2D"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tourFooter}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>4.5</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>
                        {tour.adultPrice
                          ? `${tour.adultPrice.toLocaleString()} Đ`
                          : "500,000 Đ"}
                      </Text>
                      <Text style={styles.priceUnit}>/person</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="airplane-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>{t("tour.list.empty")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("tour.list.emptySubtitle")}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </MainLayout>
  );
}
