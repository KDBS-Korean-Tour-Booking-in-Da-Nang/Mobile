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
  Modal,
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
import { TourResponse } from "../../../src/types/response/tour.response";
import { VoucherDiscountType } from "../../../src/types/response/voucher.response";
import { voucherEndpoints } from "../../../services/endpoints/voucher";
import { useAuthContext } from "../../../src/contexts/authContext";
import styles from "./styles";
import {
  getTourThumbnailUrl,
  normalizeHtmlImageSrc,
} from "../../../src/utils/media";

type VoucherPreviewItem = {
  id: number;
  code: string;
  name: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue: number;
  endDate?: string;
};

const DEFAULT_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop";

export default function TourDetail() {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1;

  const [tour, setTour] = useState<TourResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroWidth = useMemo(() => Dimensions.get("window").width - 20, []);
  const imageScrollRef = useRef<ScrollView | null>(null);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<
    VoucherPreviewItem[]
  >([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [hasBookedTour, setHasBookedTour] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(false);

  useEffect(() => {
    const loadTour = async () => {
      try {
        setLoading(true);
        const res = await tourEndpoints.getById(tourId);
        console.log("[TourDetail] Tour data loaded:", {
          tourId,
          tour: res.data,
          description: res.data?.description,
          contents: res.data?.contents,
          contentsLength: res.data?.contents?.length,
        });
        if (res.data?.contents) {
          res.data.contents.forEach((content: any, idx: number) => {
            console.log(`[TourDetail] Content ${idx}:`, {
              id: content.id,
              title: content.title,
              description: content.description,
              descriptionLength: content.description?.length,
              descriptionPreview: content.description?.substring(0, 200),
            });
          });
        }
        setTour(res.data);
        setCurrentImageIndex(0);
      } catch {
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

  const formatVoucherDiscount = useCallback((voucher: VoucherPreviewItem) => {
    const value = Number(voucher.discountValue || 0);
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      return `-${value}%`;
    }
    return `-${value.toLocaleString()} Đ`;
  }, []);

  const formatVoucherExpiry = useCallback((value?: string) => {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return value || "";
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!tour?.id) {
      setAvailableVouchers([]);
      setVoucherError(null);
      setVoucherLoading(false);
      return () => {
        active = false;
      };
    }

    const loadVouchers = async () => {
      setVoucherLoading(true);
      setVoucherError(null);
      try {
        // Lấy danh sách voucher áp dụng theo tourId
        const response = await voucherEndpoints.getByTourId(tour.id);
        const data = Array.isArray(response.data) ? response.data : [];
        const normalized = data
          .map((raw: any) => {
            try {
              const code = String(raw.voucherCode || raw.code || "").trim();
              if (!code) return null;
              const toNumber = (val: any) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return Number.isNaN(num) ? 0 : num;
              };

              const discountTypeRaw = String(
                raw.discountType || raw.type || ""
              ).toUpperCase();

              return {
                id: Number(raw.voucherId ?? raw.id ?? 0),
                code,
                name: String(raw.name || raw.voucherName || code),
                discountType:
                  discountTypeRaw === VoucherDiscountType.PERCENT
                    ? VoucherDiscountType.PERCENT
                    : VoucherDiscountType.FIXED,
                discountValue: toNumber(raw.discountValue),
                minOrderValue: toNumber(raw.minOrderValue),
                endDate: raw.endDate || raw.expiredAt || "",
              } as VoucherPreviewItem;
            } catch {
              return null;
            }
          })
          .filter((item): item is VoucherPreviewItem => !!item);

        if (!active) return;
        setAvailableVouchers(normalized);
      } catch (err: any) {
        if (!active) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          t("tour.detail.voucherLoadFailed", {
            defaultValue: "Không thể tải voucher khả dụng.",
          });
        setVoucherError(message);
        setAvailableVouchers([]);
      } finally {
        if (active) {
          setVoucherLoading(false);
        }
      }
    };

    loadVouchers();

    return () => {
      active = false;
    };
  }, [tour?.id, t]);

  useEffect(() => {
    const checkUserBooking = async () => {
      if (!user?.email || !tour?.id) {
        setHasBookedTour(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        setHasBookedTour(false);
        return;
      }

      setCheckingBooking(true);
      try {
        const bookings = (await tourEndpoints.getBookingsByEmail(user.email))
          .data;
        const tourBookings = Array.isArray(bookings)
          ? bookings.filter(
              (booking: any) =>
                booking.tourId === tour.id || booking.tour?.id === tour.id
            )
          : [];

        if (tourBookings.length === 0) {
          setHasBookedTour(false);
          return;
        }

        const hasSuccessfulBooking = tourBookings.some((booking: any) => {
          const status = String(
            booking.status || booking.bookingStatus || ""
          ).toUpperCase();
          return status === "BOOKING_SUCCESS" || status === "SUCCESS";
        });

        setHasBookedTour(hasSuccessfulBooking);
      } catch {
        // Silently handle errors
        setHasBookedTour(false);
      } finally {
        setCheckingBooking(false);
      }
    };

    checkUserBooking();
  }, [user?.email, tour?.id]);

  // Hero carousel: ONLY use main cover image (thumbnails), not content images
  const imageList = useMemo(() => {
    const cover = getTourThumbnailUrl(tour?.tourImgPath);
    return cover ? [cover] : [DEFAULT_TOUR_IMAGE];
  }, [tour?.tourImgPath]);

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
          {(() => {
            const loopData =
              imageList.length > 1
                ? [imageList[imageList.length - 1], ...imageList, imageList[0]]
                : imageList;
            return (
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: "100%" }}
                nestedScrollEnabled
                decelerationRate="fast"
                snapToInterval={heroWidth}
                snapToAlignment="start"
                bounces={false}
                contentOffset={{
                  x: imageList.length > 1 ? heroWidth : 0,
                  y: 0,
                }}
                onLayout={() => {
                  if (imageList.length > 1) {
                    imageScrollRef.current?.scrollTo({
                      x: heroWidth,
                      animated: false,
                    });
                  }
                }}
                onMomentumScrollEnd={(e) => {
                  try {
                    const x = e.nativeEvent.contentOffset.x || 0;
                    const idx = Math.max(0, Math.round(x / heroWidth));
                    if (imageList.length > 1) {
                      const lastIndex = loopData.length - 1;
                      if (idx === 0) {
                        imageScrollRef.current?.scrollTo({
                          x: heroWidth * (lastIndex - 1),
                          animated: false,
                        });
                        setCurrentImageIndex(loopData.length - 3);
                        return;
                      }
                      if (idx === lastIndex) {
                        imageScrollRef.current?.scrollTo({
                          x: heroWidth,
                          animated: false,
                        });
                        setCurrentImageIndex(0);
                        return;
                      }
                      setCurrentImageIndex(idx - 1);
                    } else {
                      setCurrentImageIndex(0);
                    }
                  } catch {}
                }}
              >
                {loopData.map((uri, idx) => (
                  <Image
                    key={`${uri}-${idx}`}
                    source={{ uri }}
                    style={[styles.heroImage, { width: heroWidth }]}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ))}
              </ScrollView>
            );
          })()}
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
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

          <TouchableOpacity
            style={styles.voucherRow}
            onPress={() => setShowVoucherModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.voucherRowContent}>
              <View style={styles.voucherRowLeft}>
                <Ionicons name="ticket" size={24} color="#FF6B6B" />
                <View style={styles.voucherRowTextContainer}>
                  <Text style={styles.voucherRowTitle}>
                    {t("tour.detail.applicableVouchers", {
                      defaultValue: "Voucher áp dụng",
                    })}
                  </Text>
                  {voucherLoading ? (
                    <Text style={styles.voucherRowSubtitle}>
                      {t("tour.detail.loadingVouchers", {
                        defaultValue: "Đang tải...",
                      })}
                    </Text>
                  ) : availableVouchers.length > 0 ? (
                    <Text style={styles.voucherRowSubtitle}>
                      {availableVouchers.length}{" "}
                      {t("tour.detail.vouchersAvailable", {
                        defaultValue: "voucher khả dụng",
                      })}
                    </Text>
                  ) : (
                    <Text style={styles.voucherRowSubtitle}>
                      {t("tour.detail.viewVouchers", {
                        defaultValue: "Xem voucher",
                      })}
                    </Text>
                  )}
                </View>
              </View>
              {voucherLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#999" />
              )}
            </View>
          </TouchableOpacity>

          {tour.contents && tour.contents.length > 0 && (
            <>
              {tour.contents.map((content, idx) => {
                const renderHtmlDescription = (html?: string) => {
                  if (!html || typeof html !== "string") return null;

                  try {
                    console.log(
                      `[TourDetail] renderHtmlDescription - Content ${idx}:`,
                      {
                        htmlLength: html.length,
                        htmlPreview: html.substring(0, 500),
                      }
                    );

                    // Tách danh sách ảnh từ toàn bộ HTML
                    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
                    const images: string[] = [];
                    let workingHtml = html;
                    let imgMatch: RegExpExecArray | null;
                    let imgCount = 0;

                    while ((imgMatch = imgRegex.exec(html))) {
                      const rawSrc = imgMatch[1];
                      console.log(
                        `[TourDetail] Found image ${imgCount} in content ${idx}:`,
                        {
                          rawSrc,
                          fullMatch: imgMatch[0],
                        }
                      );
                      const resolved = normalizeHtmlImageSrc(rawSrc);
                      console.log(
                        `[TourDetail] Resolved image ${imgCount} in content ${idx}:`,
                        {
                          rawSrc,
                          resolved,
                        }
                      );
                      if (resolved) images.push(resolved);
                      imgCount++;
                    }

                    console.log(
                      `[TourDetail] Total images found in content ${idx}:`,
                      {
                        count: images.length,
                        images,
                      }
                    );

                    // Loại bỏ thẻ <img> khỏi phần text
                    workingHtml = workingHtml.replace(
                      /<img[^>]*src=["'][^"']+["'][^>]*>/gi,
                      ""
                    );

                    // Giữ xuống dòng từ các block tag
                    workingHtml = workingHtml
                      .replace(/<\/p>/gi, "\n\n")
                      .replace(/<br\s*\/?>/gi, "\n")
                      .replace(/<\/li>/gi, "\n")
                      .replace(/<\/div>/gi, "\n");

                    // Chia nhỏ text theo thẻ <strong> để biết đoạn nào in đậm
                    type Seg = { text: string; bold: boolean };
                    const segments: Seg[] = [];
                    const strongRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/gi;
                    let lastIndex = 0;
                    let m: RegExpExecArray | null;

                    const pushPlain = (raw: string, bold: boolean) => {
                      if (!raw) return;
                      let txt = raw
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+\n/g, "\n")
                        .replace(/\n\s+/g, "\n")
                        .replace(/\s{2,}/g, " ")
                        .replace(/\n{3,}/g, "\n\n")
                        .trim();
                      if (!txt) return;
                      segments.push({ text: txt, bold });
                    };

                    while ((m = strongRegex.exec(workingHtml))) {
                      const before = workingHtml.slice(lastIndex, m.index);
                      pushPlain(before, false);
                      const strongText = m[1] || "";
                      pushPlain(strongText, true);
                      lastIndex = strongRegex.lastIndex;
                    }

                    const rest = workingHtml.slice(lastIndex);
                    pushPlain(rest, false);

                    return (
                      <View style={{ gap: 10 }}>
                        {segments.length > 0 && (
                          <Text style={styles.contentDescription}>
                            {segments.map((seg, i) => (
                              <Text
                                key={`${seg.bold ? "b" : "n"}-${i}`}
                                style={seg.bold ? { fontWeight: "700" } : null}
                              >
                                {seg.text}
                              </Text>
                            ))}
                          </Text>
                        )}
                        {images.map((uri, i) => (
                          <Image
                            key={`${uri}-${i}`}
                            source={{ uri }}
                            style={{
                              width: "100%",
                              height: 220,
                              borderRadius: 8,
                              marginTop: 8,
                              backgroundColor: "#f8f9fa",
                            }}
                            resizeMode="contain"
                          />
                        ))}
                      </View>
                    );
                  } catch {
                    const fallback = html
                      .replace(/<[^>]+>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim();
                    return (
                      <Text style={styles.contentDescription}>{fallback}</Text>
                    );
                  }
                };

                return (
                  <View
                    key={idx}
                    style={[styles.sectionBlock, styles.outerCard]}
                  >
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
                        {renderHtmlDescription(content.tourContentDescription)}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <BookingButton onPress={handleBooking} />

          <RateTour
            tourId={tour?.id || 0}
            onRateSubmitted={(rate) => {}}
            hasBookedTour={hasBookedTour}
            checkingBooking={checkingBooking}
          />

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* Voucher Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("tour.detail.applicableVouchers", {
                  defaultValue: "Voucher áp dụng",
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setShowVoucherModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={26} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {voucherLoading ? (
                <View style={styles.voucherLoadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.voucherLoadingText}>
                    {t("tour.detail.loadingVouchers", {
                      defaultValue: "Đang tải voucher...",
                    })}
                  </Text>
                </View>
              ) : voucherError ? (
                <View style={styles.voucherEmptyContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="#ff6b6b"
                  />
                  <Text style={styles.voucherErrorText}>{voucherError}</Text>
                </View>
              ) : availableVouchers.length > 0 ? (
                availableVouchers.map((voucher) => {
                  const discountText = formatVoucherDiscount(voucher);
                  const expiryText = formatVoucherExpiry(voucher.endDate);
                  const key = voucher.id > 0 ? `${voucher.id}` : voucher.code;
                  return (
                    <View key={key} style={styles.voucherOptionCard}>
                      <View style={styles.voucherOptionContent}>
                        <View style={styles.voucherOptionLeft}>
                          <View style={styles.voucherOptionIcon}>
                            <Ionicons name="ticket" size={20} color="#FF6B6B" />
                          </View>
                          <View style={styles.voucherOptionInfo}>
                            <Text style={styles.voucherOptionCode}>
                              {voucher.code}
                            </Text>
                            {voucher.name && voucher.name !== voucher.code && (
                              <Text style={styles.voucherOptionName}>
                                {voucher.name}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.voucherOptionDetails}>
                        <View style={styles.voucherOptionDetailRow}>
                          <Text style={styles.voucherOptionDetailLabel}>
                            {t("tour.confirm.discount")}:
                          </Text>
                          <Text style={styles.voucherOptionDetailValue}>
                            {discountText}
                          </Text>
                        </View>
                        {voucher.minOrderValue > 0 && (
                          <View style={styles.voucherOptionDetailRow}>
                            <Text style={styles.voucherOptionDetailLabel}>
                              {t("tour.detail.minOrder", {
                                defaultValue: "Đơn tối thiểu",
                              })}
                              :
                            </Text>
                            <Text style={styles.voucherOptionDetailValue}>
                              {Number(
                                voucher.minOrderValue || 0
                              ).toLocaleString()}{" "}
                              Đ
                            </Text>
                          </View>
                        )}
                        {expiryText && (
                          <View style={styles.voucherOptionDetailRow}>
                            <Text style={styles.voucherOptionDetailLabel}>
                              {t("tour.detail.validTo", {
                                defaultValue: "Hiệu lực đến",
                              })}
                              :
                            </Text>
                            <Text style={styles.voucherOptionDetailValue}>
                              {expiryText}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.voucherEmptyContainer}>
                  <Ionicons name="ticket-outline" size={48} color="#ccc" />
                  <Text style={styles.voucherEmptyText}>
                    {t("tour.detail.noVoucherAvailable", {
                      defaultValue: "Chưa có voucher phù hợp.",
                    })}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButtonFull}
                onPress={() => setShowVoucherModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {t("common.close") || "Đóng"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}
