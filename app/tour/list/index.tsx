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
import { TourResponse } from "../../../src/types/tour";
import styles from "./styles";
import { createPost } from "../../../services/endpoints/forum";
import { useAuthContext } from "../../../src/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const toursData = (await tourEndpoints.getAll()).data;
      setTours(Array.isArray(toursData) ? toursData : []);
    } catch (error) {
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
  }, [loadTours]);

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
      await createPost({
        title: shareTitle.trim() || shareTour.tourName || "",
        content: contentToSend || "",
        hashtags: shareHashtags,
        images,
        userEmail: email,
      });
      setShareOpen(false);
      navigate("/forum");
    } catch {
      Alert.alert(t("forum.errorTitle"), t("tour.share.errors.shareFailed"));
    } finally {
      setShareSubmitting(false);
    }
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

        <View style={styles.toursGrid}>
          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => (
              <View key={tour.id} style={styles.tourCard}>
                <TouchableOpacity onPress={() => handleTourPress(tour.id)}>
                  <Image
                    source={{ uri: resolveTourCardImage(tour) }}
                    style={styles.tourImage}
                    contentFit="cover"
                    cachePolicy="disk"
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
                <TouchableOpacity
                  onPress={() => openShareModal(tour)}
                  style={{
                    marginTop: 8,
                    backgroundColor: "#34C759",
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {t("tour.share.shareButton")}
                  </Text>
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
    </MainLayout>
  );
}
