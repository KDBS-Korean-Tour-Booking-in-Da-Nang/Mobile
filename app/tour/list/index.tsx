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
import forumEndpoints from "../../../services/endpoints/forum";
import { useAuthContext } from "../../../src/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getContentImageUrl,
  getTourThumbnailUrl,
} from "../../../src/utils/media";

export default function TourList() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthContext();

  const [tours, setTours] = useState<TourResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");

  const [shareOpen, setShareOpen] = useState(false);
  const [shareTour, setShareTour] = useState<TourResponse | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareContent, setShareContent] = useState("");
  const [shareHashtagInput, setShareHashtagInput] = useState("");
  const [shareHashtags, setShareHashtags] = useState<string[]>([]);
  const [shareSubmitting, setShareSubmitting] = useState(false);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  const [showGiftModal, setShowGiftModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalDontShow, setCloseModalDontShow] = useState(false);

  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const toursData = (await tourEndpoints.getAllPublic()).data;
      setTours(Array.isArray(toursData) ? toursData : []);
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
      const meta = {
        shareType: "TOUR",
        tourId: shareTour.id,
        cover,
        tourName: shareTour.tourName,
        tourDescription: shareTour.tourDescription,
      } as any;
      const marker = `[[META:${JSON.stringify(meta)}]]`;
      const contentToSend = `${shareContent.trim()}\n\n${marker}`;

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
      navigate("/forum");
    } catch {
      Alert.alert(t("forum.errorTitle"), t("tour.share.errors.shareFailed"));
    } finally {
      setShareSubmitting(false);
    }
  };

  const resolveTourCardImage = (t: any): string => {
    // Card cover: chỉ dùng tour_img_path (thumbnails)
    const cover = getTourThumbnailUrl(t?.tourImgPath);
    return (
      cover ||
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
      {/* Gift Modal */}
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
            <Ionicons name="close" size={16} color="#fff" />
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
              {t("tour.list.historyBooking")}
            </Text>
          </TouchableOpacity>
        </View>

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

        {/* Voucher highlights removed per request. Vouchers are shown only in /tour/voucherList */}

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
                        right: 8,
                        top: 8,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        borderRadius: 16,
                        width: 32,
                        height: 32,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={16}
                        color="#111"
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
                          color="#6c757d"
                        />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {tour.tourDeparturePoint}
                        </Text>
                      </View>
                      <View style={styles.durationContainer}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#6c757d"
                        />
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
              </View>
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

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={shareOpen}
        animationType="slide"
        onRequestClose={() => setShareOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#f8f9fa", marginTop: 60 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#e9ecef",
              borderBottomWidth: 1,
              borderBottomColor: "#dee2e6",
            }}
          >
            <TouchableOpacity onPress={() => setShareOpen(false)}>
              <Text style={{ color: "#007AFF", fontWeight: "600" }}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>
              {t("tour.share.modalTitle")}
            </Text>
            <TouchableOpacity onPress={submitShare} disabled={shareSubmitting}>
              <Text
                style={{
                  color: shareSubmitting ? "#ccc" : "#007AFF",
                  fontWeight: "600",
                }}
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
              style={{ flex: 1, padding: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
                >
                  {t("forum.title")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "#6c757d", marginRight: 8 }}
                  >
                    {t("tour.share.title")}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6c757d", marginRight: 32 }}
                  >
                    :
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderBottomWidth: 1,
                      borderBottomColor: "#6c757d",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      fontSize: 14,
                      color: "#000",
                    }}
                    placeholder={t("tour.share.titlePlaceholder")}
                    value={shareTitle}
                    onChangeText={setShareTitle}
                    maxLength={100}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
                >
                  {t("forum.content")}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    minHeight: 120,
                    fontSize: 14,
                    color: "#000",
                    textAlignVertical: "top",
                    borderWidth: 1,
                    borderColor: "#e9ecef",
                  }}
                  placeholder={t("tour.share.contentPlaceholder")}
                  value={shareContent}
                  onChangeText={setShareContent}
                  multiline
                  maxLength={1000}
                />
              </View>

              {shareTour && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#e9ecef",
                  }}
                >
                  <Image
                    source={{ uri: resolveTourCardImage(shareTour) }}
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>
                    {shareTour.tourName}
                  </Text>
                  <Text
                    style={{ color: "#555", marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {shareTour.tourDescription}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigate(`/tour/tourDetail?id=${shareTour.id}`)
                    }
                    style={{ marginTop: 8 }}
                  >
                    <Text
                      style={{ color: "#007AFF" }}
                    >{`/tour/tourDetail?id=${shareTour.id}`}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#000",
                    marginBottom: 12,
                  }}
                >
                  {t("forum.chooseHashtags")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, color: "#6c757d", marginRight: 8 }}
                  >
                    {t("forum.hashtag")}
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#6c757d", marginRight: 32 }}
                  >
                    :
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderBottomWidth: 1,
                      borderBottomColor: "#6c757d",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      fontSize: 14,
                      color: "#6c757d",
                    }}
                    placeholder={t("tour.share.hashtagPlaceholder")}
                    value={shareHashtagInput}
                    onChangeText={setShareHashtagInput}
                    onSubmitEditing={addShareHashtag}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    onPress={addShareHashtag}
                    style={{
                      marginLeft: 8,
                      backgroundColor: "#007AFF",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {t("tour.share.addHashtag")}
                    </Text>
                  </TouchableOpacity>
                </View>
                {shareHashtags.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    {shareHashtags.map((tag, idx) => (
                      <TouchableOpacity
                        key={`${tag}-${idx}`}
                        onPress={() => removeShareHashtag(idx)}
                        style={{
                          backgroundColor: "#a1d3ff",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#000",
                            fontWeight: "500",
                          }}
                        >
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
      </Modal>

      {/* Close Confirmation Modal */}
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
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.closeModalHeader}>
              <Ionicons name="help-circle" size={40} color="#007AFF" />
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
