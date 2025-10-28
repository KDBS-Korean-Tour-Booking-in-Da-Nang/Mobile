import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  Dimensions,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useLocalSearchParams } from "expo-router";
import BookingButton from "../../../components/BookingButton";
import RateTour from "../../../components/RateTour";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../../services/endpoints/tour";
import { TourResponse } from "../../../src/types/tour";
import styles from "./styles";

export default function TourDetail() {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1;

  const [tour, setTour] = useState<TourResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  useEffect(() => {
    const loadTour = async () => {
      try {
        setLoading(true);
        const res = await tourEndpoints.getById(tourId);
        setTour(res.data);
        setCurrentImageIndex(0);
      } catch (error) {
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t]);

  const handleScroll = useCallback((event: any) => {
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

  const handleBooking = () => {
    if (tour) {
      navigate(`/tour/buying?id=${tour.id}`);
    }
  };

  const imageList = useMemo(() => {
    const contentImages = (tour?.contents || [])
      .flatMap((c: any) => (Array.isArray(c.images) ? c.images : []))
      .map((u: any) => (typeof u === "string" ? u.trim() : ""))
      .filter((u: any) => u && /^https?:\/\//i.test(u));
    const cover =
      tour?.tourImgPath && /^https?:\/\//i.test((tour.tourImgPath || "").trim())
        ? [tour!.tourImgPath.trim()]
        : [];
    const all = [...cover, ...contentImages];
    return all.length > 0 ? all : [""];
  }, [tour]);

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

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      imageList.length ? (prev + 1) % imageList.length : 0
    );
  };

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
            source={{ uri: imageList[currentImageIndex] }}
            style={styles.heroImage}
            contentFit="cover"
            cachePolicy="disk"
          />
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { left: undefined, right: 12 }]}
            onPress={handleNextImage}
          >
            <View style={styles.backCircle}>
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          <View
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              backgroundColor: "rgba(255,255,255,0.85)",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#111" }}>
              {currentImageIndex + 1}/{imageList.length}
            </Text>
          </View>
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
          <View style={styles.metaBox}>
            <View style={styles.metaRowContent}>
              <View style={styles.metaCol}>
                <Text
                  style={[
                    styles.metaLabelCaps,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaLabelCapsSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  {t("tour.meta.rating")}
                </Text>
                <View style={styles.metaValueRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text
                    style={[
                      styles.metaValue,
                      (Dimensions.get("window").width <= 360 ||
                        Dimensions.get("window").height <= 700) &&
                        styles.metaValueSm,
                    ]}
                  >
                    4.5
                  </Text>
                </View>
              </View>
              <View style={styles.metaDivider} />
              {/* Type (center to balance with other columns) */}
              <View style={[styles.metaCol, styles.metaColNarrow]}>
                <Text
                  style={[
                    styles.metaLabelCaps,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaLabelCapsSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  {t("tour.meta.type")}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaValueSm,
                  ]}
                >
                  {tour.tourType || t("tour.types.openTrip")}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Estimate */}
              <View style={styles.metaCol}>
                <Text
                  style={[
                    styles.metaLabelCaps,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaLabelCapsSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  {t("tour.meta.estimate")}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaValueSm,
                  ]}
                >
                  {tour.tourDuration || "3D 2N"}
                </Text>
              </View>
              <View style={styles.metaDivider} />
              {/* Vehicle */}
              <View style={styles.metaCol}>
                <Text
                  style={[
                    styles.metaLabelCaps,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaLabelCapsSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  {t("tour.meta.vehicle")}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.metaValueSm,
                  ]}
                >
                  {tour.tourVehicle || t("tour.vehicles.car")}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.sectionTitle,
              (Dimensions.get("window").width <= 360 ||
                Dimensions.get("window").height <= 700) &&
                styles.sectionTitleSm,
            ]}
          >
            {t("tour.detail.description")}
          </Text>
          <Text style={styles.paragraph}>
            {tour.tourDescription || t("tour.content.description")}
          </Text>

          <View style={styles.card}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text
                  style={[
                    styles.infoLabel,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoLabelSm,
                  ]}
                >
                  {t("tour.detail.amount")}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoValueSm,
                  ]}
                >
                  {tour.amount || 20}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text
                  style={[
                    styles.infoLabel,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoLabelSm,
                  ]}
                >
                  {t("tour.detail.adult")}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoValueSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {tour.adultPrice
                    ? `${tour.adultPrice.toLocaleString()} Đ`
                    : ""}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text
                  style={[
                    styles.infoLabel,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoLabelSm,
                  ]}
                >
                  {t("tour.detail.children")}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoValueSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {tour.childrenPrice
                    ? `${tour.childrenPrice.toLocaleString()} Đ`
                    : ""}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoCol}>
                <Text
                  style={[
                    styles.infoLabel,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoLabelSm,
                  ]}
                >
                  {t("tour.detail.baby")}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    (Dimensions.get("window").width <= 360 ||
                      Dimensions.get("window").height <= 700) &&
                      styles.infoValueSm,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {tour.babyPrice ? `${tour.babyPrice.toLocaleString()} Đ` : ""}
                </Text>
              </View>
            </View>
          </View>

          {tour.contents && tour.contents.length > 0 && (
            <>
              {tour.contents.map((content, idx) => (
                <View key={idx} style={[styles.sectionBlock, styles.outerCard]}>
                  <View style={styles.blockHeader}>
                    <Text style={styles.blockHeaderText}>
                      {t("tour.detail.destinationAndItinerary")}
                    </Text>
                  </View>
                  <View style={styles.blockBox}>
                    <View style={styles.contentCard}>
                      <Text style={styles.contentTitle}>
                        {content.tourContentTitle}
                      </Text>
                      <Text style={styles.contentDescription}>
                        {content.tourContentDescription}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          <BookingButton onPress={handleBooking} />

          <RateTour tourId={tour?.id || 0} onRateSubmitted={(rate) => {}} />

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </MainLayout>
  );
}
