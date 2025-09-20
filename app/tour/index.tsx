import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../src/components/MainLayout";
import { useNavigation } from "../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import BookingButton from "../../src/components/BookingButton";
import { useTranslation } from "react-i18next";
import { tourService } from "../../src/services/tourService";
import { TourResponse } from "../../src/types/tour";
import styles from "./styles";

export default function TourDetail() {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1; // Default to tour ID 1

  const [tour, setTour] = useState<TourResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation scroll effects
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  // Load tour data
  useEffect(() => {
    const loadTour = async () => {
      try {
        setLoading(true);
        const tourData = await tourService.getTourById(tourId);
        setTour(tourData);
      } catch (error) {
        console.error("Error loading tour:", error);
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t]);

  // Handle scroll for navigation effects - hide when scrolling down, show when scrolling up
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

  const handleBooking = () => {
    if (tour) {
      navigate(`/tour/buying?id=${tour.id}`);
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

  if (!tour) {
    return (
      <MainLayout>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>{t("tour.errors.notFound")}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigate("/home")}
          >
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
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
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri:
                tour.tourImgPath ||
                "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
            }}
            style={styles.heroImage}
          />
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          {/* Title and location overlay inside image */}
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayTitle}>{tour.tourName}</Text>
            <View style={styles.overlayRow}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.overlayLocation}>
                {tour.tourDeparturePoint}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Meta grid: RATING | TYPE | ESTIMATE | VEHICLE */}
          <View style={styles.metaBox}>
            <View style={styles.metaRowContent}>
              {/* Rating */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>
                  {t("tour.meta.rating")}
                </Text>
                <View style={styles.metaValueRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.metaValue}>4.5</Text>
                </View>
              </View>
              <View style={styles.metaDivider} />
              {/* Type */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>{t("tour.meta.type")}</Text>
                <Text style={styles.metaValue}>
                  {tour.tourType || t("tour.types.openTrip")}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Estimate */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>
                  {t("tour.meta.estimate")}
                </Text>
                <Text style={styles.metaValue}>
                  {tour.tourDuration || "3D 2N"}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Vehicle */}
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>
                  {t("tour.meta.vehicle")}
                </Text>
                <Text style={styles.metaValue}>
                  {tour.tourVehicle || t("tour.vehicles.car")}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {t("tour.detail.description")}
          </Text>
          <Text style={styles.paragraph}>
            {tour.tourDescription || t("tour.content.description")}
          </Text>

          <View style={styles.card}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.amount")}</Text>
                <Text style={styles.infoValue}>{tour.amount || 20}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.adult")}</Text>
                <Text style={styles.infoValue}>
                  {tour.adultPrice
                    ? `${tour.adultPrice.toLocaleString()} Đ`
                    : "3,200,000 Đ"}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>
                  {t("tour.detail.children")}
                </Text>
                <Text style={styles.infoValue}>
                  {tour.childrenPrice
                    ? `${tour.childrenPrice.toLocaleString()} Đ`
                    : "1,800,000 Đ"}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>{t("tour.detail.baby")}</Text>
                <Text style={styles.infoValue}>
                  {tour.babyPrice
                    ? `${tour.babyPrice.toLocaleString()} Đ`
                    : "900,000 Đ"}
                </Text>
              </View>
            </View>
          </View>

          {/* Tour Content/Destinations */}
          {tour.contents && tour.contents.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>
                {t("tour.detail.destinations")}
              </Text>
              {tour.contents.map((content, idx) => (
                <View key={idx} style={styles.contentBlock}>
                  <View style={styles.contentBox} />
                  <View style={styles.contentHeader}>
                    <Text style={styles.contentTitle}>
                      {content.tourContentTitle}
                    </Text>
                    <Text style={styles.contentDescription}>
                      {content.tourContentDescription}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Booking button appears at the very end of content */}
          <BookingButton onPress={handleBooking} />
          {/* Spacer after button so it's fully visible above system/nav bars when scrolled to end */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </MainLayout>
  );
}
