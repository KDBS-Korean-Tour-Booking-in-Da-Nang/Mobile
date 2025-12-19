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
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../../services/endpoints/tour";
import { TourResponse } from "../../../src/types/response/tour.response";
import styles from "./styles";
import { forumEndpoints } from "../../../services/endpoints/forum";
import { useAuthContext } from "../../../src/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTourThumbnailUrl } from "../../../src/utils/media";
import { formatPriceKRW } from "../../../src/utils/currency";

export default function TourList() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const [tours, setTours] = useState<TourResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [tourRatings, setTourRatings] = useState<Map<number, number>>(
    new Map()
  );

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  const [shareOpen, setShareOpen] = useState(false);
  const [shareTour, setShareTour] = useState<TourResponse | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareContent, setShareContent] = useState("");
  const [shareHashtagInput, setShareHashtagInput] = useState("");
  const [shareHashtags, setShareHashtags] = useState<string[]>([]);
  const [shareSubmitting, setShareSubmitting] = useState(false);

  const [showGiftModal, setShowGiftModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalDontShow, setCloseModalDontShow] = useState(false);

  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const toursData = (await tourEndpoints.getAllPublic()).data;
      const toursList = Array.isArray(toursData) ? toursData : [];
      setTours(toursList);

      // Load ratings for all tours
      const ratingsMap = new Map<number, number>();
      await Promise.all(
        toursList.map(async (tour) => {
          try {
            const ratingsResponse = await tourEndpoints.getTourRatings(tour.id);
            const ratings = Array.isArray(ratingsResponse.data)
              ? ratingsResponse.data
              : [];

            if (ratings.length > 0) {
              const totalStars = ratings.reduce((sum: number, rating: any) => {
                const star = Number(rating.star) || 0;
                return sum + star;
              }, 0);
              const average = totalStars / ratings.length;
              ratingsMap.set(tour.id, Math.round(average * 10) / 10);
            }
          } catch {
            // Ignore errors for individual tour ratings
          }
        })
      );
      setTourRatings(ratingsMap);
    } catch {
      Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTours();
    setRefreshing(false);
  }, [loadTours]);

  useEffect(() => {
    loadTours();
    checkGiftModalPreference();
  }, [loadTours]);

  const checkGiftModalPreference = async () => {
    setShowGiftModal(true);
    setDontShowAgain(false);
  };

  const handleGiftModalClose = async () => {
    if (dontShowAgain) {
      setShowGiftModal(false);
      return;
    }

    setShowCloseModal(true);
  };

  const handleCloseModalConfirm = async () => {
    try {
      if (closeModalDontShow) {
        setDontShowAgain(true);
      }
      setShowGiftModal(false);
      setShowCloseModal(false);
      setCloseModalDontShow(false);
    } catch {
      setShowGiftModal(false);
      setShowCloseModal(false);
      setCloseModalDontShow(false);
    }
  };

  const handleCloseModalCancel = () => {
    setShowCloseModal(false);
    setCloseModalDontShow(false);
  };

  const handleGiftModalPress = () => {
    navigate("/tour/voucherList" as any);
  };

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

  const handleTourPress = (tourId: number) => {
    navigate(`/tour/tourDetail?id=${tourId}`);
  };

  const openShareModal = (tour: TourResponse) => {
    setShareTour(tour);
    setShareTitle("");
    setShareContent("");
    setShareHashtagInput("");
    setShareHashtags([]);
    setShareOpen(true);
  };

  const addShareHashtag = () => {
    const raw = shareHashtagInput.trim();
    if (!raw) return;
    const tokens = raw
      .split(/[ ,]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return;
    setShareHashtags((prev) => {
      const existing = new Set(prev.map((t) => t.toLowerCase()));
      const merged = [...prev];
      tokens.forEach((t) => {
        if (!existing.has(t)) merged.push(t);
      });
      return merged;
    });
    setShareHashtagInput("");
  };

  const removeShareHashtag = (idx: number) => {
    setShareHashtags((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitShare = async () => {
    try {
      if (!shareTour) return;
      const token = await AsyncStorage.getItem("authToken");
      const email = user?.email;
      if (!token || !email) {
        Alert.alert(
          t("forum.errorTitle"),
          t("tour.share.errors.loginRequired")
        );
        return;
      }
      setShareSubmitting(true);
      const cover = resolveTourCardImage(shareTour);
      const images: any[] = cover ? [{ uri: cover }] : [];

      const tourLink = `https://kdbs.online/tour/detail?id=${shareTour.id}`;
      const contentParts: string[] = [];
      if (shareContent.trim()) {
        contentParts.push(shareContent.trim());
      }
      contentParts.push(tourLink);
      const contentToSend = contentParts.join("\n");

      const createPostFormData = (data: {
        title: string;
        content: string;
        userEmail?: string;
        hashtags?: string[];
        images?: any[];
      }): FormData => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("content", data.content);
        if (data.userEmail) {
          formData.append("userEmail", data.userEmail);
        }
        if (data.hashtags && data.hashtags.length > 0) {
          data.hashtags.forEach((hashtag) => {
            formData.append("hashtags", hashtag);
          });
        }
        if (data.images) {
          data.images.forEach((image: any, idx: number) => {
            const uri: string = image?.uri || image?.path || "";
            const clean = uri.split("?")[0];
            const ext = (
              clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg"
            ).toLowerCase();
            const mime =
              image?.type ||
              (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);
            const name = image?.name || `photo_${Date.now()}_${idx}.${ext}`;
            if (uri) {
              formData.append("images", { uri, name, type: mime } as any);
            }
          });
        }
        return formData;
      };

      const formData = createPostFormData({
        title: shareTitle.trim() || shareTour.tourName || "",
        content: contentToSend || "",
        hashtags: shareHashtags,
        images,
        userEmail: email,
      });
      await forumEndpoints.createPost(formData);
      setShareOpen(false);
      Alert.alert(
        t("forum.successTitle"),
        t("tour.share.success") || "Tour shared successfully!"
      );
      navigate("/forum");
    } catch {
      Alert.alert(t("forum.errorTitle"), t("tour.share.errors.shareFailed"));
    } finally {
      setShareSubmitting(false);
    }
  };

  const resolveTourCardImage = (t: any): string => {
    const cover = getTourThumbnailUrl(t?.tourImgPath);
    return cover;
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
      {}
      {showGiftModal && (
        <View style={styles.giftModalContainer}>
          <TouchableOpacity
            style={styles.giftModalButton}
            onPress={handleGiftModalPress}
            activeOpacity={0.8}
          >
            <View style={styles.giftModalContent}>
              <Ionicons name="gift" size={24} color="#fff" />
              <View style={styles.giftModalTextContainer}>
                <Text style={styles.giftModalTextTop}>
                  {t("tour.giftModal.clickNow") || "Nhấp ngay"}
                </Text>
                <Text style={styles.giftModalTextBottom}>
                  {t("tour.giftModal.hasReward") || "* có thưởng"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.giftModalCloseButton}
            onPress={handleGiftModalClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-outline" size={16} color="#7A8A99" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>
            {t("tour.list.title") || "Tours List"}
          </Text>
          <TouchableOpacity
            style={styles.purchasedButton}
            onPress={() => navigate("/tour/historyBooking")}
          >
            <Ionicons name="receipt-outline" size={16} color="#5A6C7D" />
            <Text style={styles.purchasedButtonText}>
              {t("tour.list.historyBooking")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#7A8A99" />
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
              <Ionicons name="close-circle-outline" size={18} color="#7A8A99" />
            </TouchableOpacity>
          ) : null}
        </View>

        {}

        <View style={styles.toursGrid}>
          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => (
              <View key={tour.id} style={styles.tourCard}>
                <TouchableOpacity onPress={() => handleTourPress(tour.id)}>
                  <View style={{ position: "relative" }}>
                    <Image
                      source={{ uri: resolveTourCardImage(tour) }}
                      style={styles.tourImage}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                    <TouchableOpacity
                      onPress={() => openShareModal(tour)}
                      activeOpacity={0.9}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        borderRadius: 20,
                        width: 36,
                        height: 36,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 8,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: "#E8EDF2",
                      }}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={16}
                        color="#7A8A99"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tourContent}>
                    <Text style={styles.tourTitle} numberOfLines={2}>
                      {tour.tourName}
                    </Text>
                    <View style={styles.tourMeta}>
                      <View style={styles.locationContainer}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#7A8A99"
                        />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {tour.tourDeparturePoint}
                        </Text>
                      </View>
                      <View style={styles.durationContainer}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#7A8A99"
                        />
                        <Text style={styles.durationText}>
                          {tour.tourDuration || "3N2D"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tourFooter}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {tourRatings.get(tour.id)?.toFixed(1) || "0.0"}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>
                          {tour.adultPrice
                            ? formatPriceKRW(tour.adultPrice)
                            : "N/A"}
                        </Text>
                        <Text style={styles.priceUnit}>/person</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="airplane-outline" size={64} color="#D5E3ED" />
              <Text style={styles.emptyTitle}>{t("tour.list.empty")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("tour.list.emptySubtitle")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {}
      <Modal
        visible={shareOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShareOpen(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <TouchableOpacity onPress={() => setShareOpen(false)}>
                <View style={styles.shareModalCloseButton}>
                  <Ionicons name="close-outline" size={20} color="#999" />
                </View>
              </TouchableOpacity>
              <Text style={styles.shareModalTitle}>
                {t("tour.share.modalTitle")}
              </Text>
              <TouchableOpacity
                onPress={submitShare}
                disabled={shareSubmitting}
                style={styles.shareModalActionButton}
              >
                <Text
                  style={
                    shareSubmitting
                      ? styles.shareModalActionTextDisabled
                      : styles.shareModalActionText
                  }
                >
                  {shareSubmitting ? t("tour.share.posting") : t("forum.post")}
                </Text>
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <ScrollView
                style={styles.shareModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.shareModalSection}>
                  <Text style={styles.shareModalSectionTitle}>
                    {t("forum.title")}
                  </Text>
                  <View style={styles.shareModalInputRow}>
                    <Text style={styles.shareModalLabel}>
                      {t("tour.share.title")}
                    </Text>
                    <Text style={styles.shareModalLabel}>:</Text>
                    <TextInput
                      style={styles.shareModalInput}
                      placeholder={t("tour.share.titlePlaceholder")}
                      value={shareTitle}
                      onChangeText={setShareTitle}
                      maxLength={100}
                      placeholderTextColor="#CCC"
                    />
                  </View>
                </View>

                <View style={styles.shareModalSection}>
                  <Text style={styles.shareModalSectionTitle}>
                    {t("forum.content")}
                  </Text>
                  <TextInput
                    style={styles.shareModalTextArea}
                    placeholder={t("tour.share.contentPlaceholder")}
                    value={shareContent}
                    onChangeText={setShareContent}
                    multiline
                    maxLength={1000}
                    placeholderTextColor="#CCC"
                  />
                </View>

                {shareTour && (
                  <View style={styles.shareModalTourCard}>
                    <Image
                      source={{ uri: resolveTourCardImage(shareTour) }}
                      style={styles.shareModalTourImage}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                    <Text style={styles.shareModalTourName}>
                      {shareTour.tourName}
                    </Text>
                    <Text
                      style={styles.shareModalTourDescription}
                      numberOfLines={2}
                    >
                      {shareTour.tourDescription}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        navigate(`/tour/tourDetail?id=${shareTour.id}`)
                      }
                      style={styles.shareModalTourLink}
                    >
                      <Text style={styles.shareModalTourLinkText}>
                        {`https://kdbs.online/tour/detail?id=${shareTour.id}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.shareModalSection}>
                  <Text style={styles.shareModalSectionTitle}>
                    {t("forum.chooseHashtags")}
                  </Text>
                  <View style={styles.shareModalHashtagContainer}>
                    <Text style={styles.shareModalLabel}>
                      {t("forum.hashtag")}
                    </Text>
                    <Text style={styles.shareModalLabel}>:</Text>
                    <TextInput
                      style={styles.shareModalHashtagInput}
                      placeholder={t("tour.share.hashtagPlaceholder")}
                      value={shareHashtagInput}
                      onChangeText={setShareHashtagInput}
                      onSubmitEditing={addShareHashtag}
                      returnKeyType="done"
                      blurOnSubmit={false}
                      placeholderTextColor="#CCC"
                    />
                    <TouchableOpacity
                      onPress={addShareHashtag}
                      style={styles.shareModalAddHashtagButton}
                    >
                      <Text style={styles.shareModalAddHashtagText}>
                        {t("tour.share.addHashtag")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {shareHashtags.length > 0 && (
                    <View style={styles.shareModalHashtagList}>
                      {shareHashtags.map((tag, idx) => (
                        <TouchableOpacity
                          key={`${tag}-${idx}`}
                          onPress={() => removeShareHashtag(idx)}
                          style={styles.shareModalHashtagTag}
                        >
                          <Text style={styles.shareModalHashtagText}>
                            #{tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showCloseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModalCancel}
      >
        <View style={styles.closeModalOverlay}>
          <View style={styles.closeModalContent}>
            <TouchableOpacity
              style={styles.closeModalXButton}
              onPress={handleCloseModalCancel}
            >
              <Ionicons name="close-outline" size={20} color="#7A8A99" />
            </TouchableOpacity>

            <View style={styles.closeModalHeader}>
              <Ionicons name="help-circle-outline" size={40} color="#B8D4E3" />
              <Text style={styles.closeModalTitle}>
                {t("tour.giftModal.dontShowTitle") || "Không hiển thị lại?"}
              </Text>
              <Text style={styles.closeModalMessage}>
                {t("tour.giftModal.dontShowMessage") ||
                  "Bạn có muốn ẩn thông báo này trong các lần sau không?"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeModalCheckbox}
              onPress={() => setCloseModalDontShow(!closeModalDontShow)}
            >
              <View
                style={[
                  styles.checkbox,
                  closeModalDontShow && styles.checkboxChecked,
                ]}
              >
                {closeModalDontShow && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                {t("tour.giftModal.dontShowAgain") || "Không hiển thị lại"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeModalSubmitButton}
              onPress={handleCloseModalConfirm}
            >
              <Text style={styles.closeModalSubmitText}>
                {t("common.confirm") || "Xác nhận"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}
