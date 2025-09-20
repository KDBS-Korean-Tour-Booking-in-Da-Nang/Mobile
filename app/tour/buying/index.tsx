import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MainLayout from "../../../src/components/MainLayout";
import { useNavigation } from "../../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../../src/contexts/authContext";
import BookingButton from "../../../src/components/BookingButton";
import { useTranslation } from "react-i18next";
import { tourService } from "../../../src/services/tourService";
import { TourResponse } from "../../../src/types/tour";
import styles from "./styles";

export default function BuyingTour() {
  const { goBack, navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1;

  // Tour data
  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [booking] = React.useState(false);

  // Navigation scroll effects
  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollThreshold = 50;

  // Dropdown states
  const [showGenderPicker, setShowGenderPicker] = React.useState<string | null>(
    null
  );
  const [showNationalityPicker, setShowNationalityPicker] = React.useState<
    string | null
  >(null);

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowGenderPicker(null);
    setShowNationalityPicker(null);
  };

  // Load tour data
  React.useEffect(() => {
    const loadTour = async () => {
      try {
        setLoading(true);
        const tourData = await tourService.getTourById(tourId);
        setTour(tourData);
      } catch (error) {
        console.error("Error loading tour:", error);
        console.error(
          "Error details:",
          (error as any).response?.data || (error as any).message
        );
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t]);

  // Handle scroll for navigation effects - hide when scrolling down, show when scrolling up
  const handleScroll = React.useCallback((event: any) => {
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
  const [adultCount, setAdultCount] = React.useState<number>(1);
  const [childrenCount, setChildrenCount] = React.useState<number>(0);
  const [babyCount, setBabyCount] = React.useState<number>(0);
  const [adultDob, setAdultDob] = React.useState<Record<number, string>>({});
  const [childrenDob, setChildrenDob] = React.useState<Record<number, string>>(
    {}
  );
  const [babyDob, setBabyDob] = React.useState<Record<number, string>>({});

  // Guest information states
  const [adultInfo, setAdultInfo] = React.useState<
    Record<
      number,
      {
        fullName: string;
        birthDate?: string;
        gender: string;
        nationality: string;
        idNumber: string;
      }
    >
  >({});
  const [childrenInfo, setChildrenInfo] = React.useState<
    Record<
      number,
      {
        fullName: string;
        birthDate?: string;
        gender: string;
        nationality: string;
        idNumber: string;
      }
    >
  >({});
  const [babyInfo, setBabyInfo] = React.useState<
    Record<
      number,
      {
        fullName: string;
        birthDate?: string;
        gender: string;
        nationality: string;
        idNumber: string;
      }
    >
  >({});

  // Personal information toggle and form data
  const [usePersonalInfo, setUsePersonalInfo] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState({
    fullName: "",
    address: "",
    phoneNumber: "",
    email: "",
    pickUpPoint: "",
    note: "",
  });

  const increment = (type: "adult" | "children" | "baby") => {
    if (type === "adult") setAdultCount((c) => c + 1);
    if (type === "children") setChildrenCount((c) => c + 1);
    if (type === "baby") setBabyCount((c) => c + 1);
  };
  const decrement = (type: "adult" | "children" | "baby") => {
    if (type === "adult") setAdultCount((c) => Math.max(1, c - 1));
    if (type === "children") setChildrenCount((c) => Math.max(0, c - 1));
    if (type === "baby") setBabyCount((c) => Math.max(0, c - 1));
  };

  // Handle personal information toggle
  const handleTogglePersonalInfo = () => {
    const newValue = !usePersonalInfo;
    setUsePersonalInfo(newValue);

    if (newValue && user) {
      // Auto-fill with user data
      setFormData({
        fullName: user.username || "",
        address: "", // User might not have address in profile
        phoneNumber: user.phone || "",
        email: user.email || "",
        pickUpPoint: formData.pickUpPoint, // Keep existing value
        note: formData.note, // Keep existing value
      });
    }
  };

  // Check if field needs update
  const needsUpdate = (field: string) => {
    if (!usePersonalInfo || !user) return false;

    switch (field) {
      case "fullName":
        return !user.username;
      case "address":
        return true; // Address is not in user profile
      case "phoneNumber":
        return !user.phone;
      case "email":
        return false; // Email is always available
      default:
        return false;
    }
  };

  // Calculate total price using real tour data
  const calculateTotal = () => {
    if (!tour) return 0;
    const adultTotal = adultCount * (tour.adultPrice || 0);
    const childrenTotal = childrenCount * (tour.childrenPrice || 0);
    const babyTotal = babyCount * (tour.babyPrice || 0);
    return adultTotal + childrenTotal + babyTotal;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const isValidEmail = (value: string) =>
    /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  const isValidPhone = (value: string) =>
    /^(\+?\d{7,15})$/.test(value.replace(/\s|-/g, ""));

  const validateBeforeBooking = (): boolean => {
    if (adultCount < 1) {
      Alert.alert(t("common.error"), t("tour.booking.errors.adultMin"));
      return false;
    }
    const nameOk = formData.fullName && formData.fullName.trim().length >= 2;
    const phoneOk = isValidPhone(formData.phoneNumber || "");
    const emailOk = isValidEmail(formData.email || "");
    if (!nameOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.fullNameRequired"));
      return false;
    }
    if (!phoneOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.phoneInvalid"));
      return false;
    }
    if (!emailOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.emailInvalid"));
      return false;
    }

    // Validate guest information
    for (let i = 0; i < adultCount; i++) {
      const guest = adultInfo[i];
      if (!guest?.fullName || guest.fullName.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Adult ${i + 1}: ${t("tour.booking.errors.fullNameRequired")}`
        );
        return false;
      }
      if (!guest?.gender) {
        Alert.alert(
          t("common.error"),
          `Adult ${i + 1}: ${t("tour.booking.gender")} is required`
        );
        return false;
      }
      if (!guest?.nationality || guest.nationality.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Adult ${i + 1}: ${t("tour.booking.nationality")} is required`
        );
        return false;
      }
      if (!guest?.idNumber || guest.idNumber.trim().length < 5) {
        Alert.alert(
          t("common.error"),
          `Adult ${i + 1}: ${t("tour.booking.idNumber")} is required`
        );
        return false;
      }
    }

    for (let i = 0; i < childrenCount; i++) {
      const guest = childrenInfo[i];
      if (!guest?.fullName || guest.fullName.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Child ${i + 1}: ${t("tour.booking.errors.fullNameRequired")}`
        );
        return false;
      }
      if (!guest?.gender) {
        Alert.alert(
          t("common.error"),
          `Child ${i + 1}: ${t("tour.booking.gender")} is required`
        );
        return false;
      }
      if (!guest?.nationality || guest.nationality.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Child ${i + 1}: ${t("tour.booking.nationality")} is required`
        );
        return false;
      }
      if (!guest?.idNumber || guest.idNumber.trim().length < 5) {
        Alert.alert(
          t("common.error"),
          `Child ${i + 1}: ${t("tour.booking.idNumber")} is required`
        );
        return false;
      }
    }

    for (let i = 0; i < babyCount; i++) {
      const guest = babyInfo[i];
      if (!guest?.fullName || guest.fullName.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Baby ${i + 1}: ${t("tour.booking.errors.fullNameRequired")}`
        );
        return false;
      }
      if (!guest?.gender) {
        Alert.alert(
          t("common.error"),
          `Baby ${i + 1}: ${t("tour.booking.gender")} is required`
        );
        return false;
      }
      if (!guest?.nationality || guest.nationality.trim().length < 2) {
        Alert.alert(
          t("common.error"),
          `Baby ${i + 1}: ${t("tour.booking.nationality")} is required`
        );
        return false;
      }
      if (!guest?.idNumber || guest.idNumber.trim().length < 5) {
        Alert.alert(
          t("common.error"),
          `Baby ${i + 1}: ${t("tour.booking.idNumber")} is required`
        );
        return false;
      }
    }

    return true;
  };

  const handleBooking = async () => {
    if (!tour || !user?.email) {
      Alert.alert(t("common.error"), t("tour.booking.errors.loginRequired"));
      return;
    }

    if (!validateBeforeBooking()) {
      return;
    }

    // Prepare booking data for confirmation page
    const bookingData = {
      customerName: formData.fullName || "",
      customerPhone: formData.phoneNumber || "",
      customerEmail: user.email,
      customerAddress: formData.address || "",
      adultCount,
      childrenCount,
      babyCount,
      adultInfo: Object.values(adultInfo).map((guest, index) => ({
        ...guest,
        birthDate: adultDob[index] || new Date().toISOString().split("T")[0],
      })),
      childrenInfo: Object.values(childrenInfo).map((guest, index) => ({
        ...guest,
        birthDate: childrenDob[index] || new Date().toISOString().split("T")[0],
      })),
      babyInfo: Object.values(babyInfo).map((guest, index) => ({
        ...guest,
        birthDate: babyDob[index] || new Date().toISOString().split("T")[0],
      })),
      pickUpPoint: formData.pickUpPoint || "",
      note: formData.note || "",
    };

    // Navigate to confirmation page
    navigate(
      `/tour/confirm?tourId=${tour.id}&bookingData=${encodeURIComponent(
        JSON.stringify(bookingData)
      )}`
    );
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
          <TouchableOpacity style={styles.retryButton} onPress={() => goBack()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout isNavVisible={isNavVisible}>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={closeDropdowns}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Hero with overlay title/location */}
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
            {/* Meta grid (same as Tour) */}
            <View style={styles.metaBox}>
              <View style={styles.metaRowContent}>
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
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps}>
                    {t("tour.meta.type")}
                  </Text>
                  <Text style={styles.metaValue}>
                    {tour.tourType || t("tour.types.openTrip")}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps}>
                    {t("tour.meta.estimate")}
                  </Text>
                  <Text style={styles.metaValue}>
                    {tour.tourDuration || "3D 2N"}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
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

            {/* Description */}
            <Text style={styles.sectionTitle}>
              {t("tour.detail.description")}
            </Text>
            <Text style={styles.paragraph}>
              {tour.tourDescription || t("tour.content.description")}
            </Text>

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

            {/* Contact Information form */}
            <Text style={styles.formTitle}>
              {t("tour.booking.contactInfo")}
            </Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={handleTogglePersonalInfo}
            >
              <View
                style={[
                  styles.radioOuter,
                  usePersonalInfo && styles.radioChecked,
                ]}
              >
                {usePersonalInfo && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={styles.toggleText}>
                {t("tour.booking.usePersonalInfo")}
              </Text>
            </TouchableOpacity>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.fullName")}</Text>
              <TextInput
                style={[
                  styles.input,
                  usePersonalInfo &&
                    !needsUpdate("fullName") &&
                    styles.inputReadonly,
                ]}
                placeholder=""
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, fullName: text }))
                }
                editable={!usePersonalInfo || needsUpdate("fullName")}
              />
              {usePersonalInfo && needsUpdate("fullName") && (
                <Text style={styles.updateHint}>
                  {t("tour.booking.updateInfoHint")}
                </Text>
              )}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.address")}</Text>
              <TextInput
                style={[
                  styles.input,
                  usePersonalInfo &&
                    !needsUpdate("address") &&
                    styles.inputReadonly,
                ]}
                placeholder=""
                value={formData.address}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, address: text }))
                }
                editable={!usePersonalInfo || needsUpdate("address")}
              />
              {usePersonalInfo && needsUpdate("address") && (
                <Text style={styles.updateHint}>
                  {t("tour.booking.updateInfoHint")}
                </Text>
              )}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.phoneNumber")}</Text>
              <TextInput
                style={[
                  styles.input,
                  usePersonalInfo &&
                    !needsUpdate("phoneNumber") &&
                    styles.inputReadonly,
                ]}
                keyboardType="phone-pad"
                placeholder=""
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: text }))
                }
                editable={!usePersonalInfo || needsUpdate("phoneNumber")}
              />
              {usePersonalInfo && needsUpdate("phoneNumber") && (
                <Text style={styles.updateHint}>
                  {t("tour.booking.updateInfoHint")}
                </Text>
              )}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.email")}</Text>
              <TextInput
                style={[styles.input, usePersonalInfo && styles.inputReadonly]}
                keyboardType="email-address"
                placeholder=""
                value={formData.email}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, email: text }))
                }
                editable={!usePersonalInfo}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.pickUpPoint")}</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={formData.pickUpPoint}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, pickUpPoint: text }))
                }
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("tour.booking.note")}</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                multiline
                numberOfLines={5}
                value={formData.note}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, note: text }))
                }
              />
            </View>

            <View style={{ height: 14 }} />

            {/* Booking information */}
            <Text style={styles.formTitle}>
              {t("tour.booking.bookingInfo")}
            </Text>
            <Text style={styles.sectionSubLabel}>
              {t("tour.booking.departureDate")}
            </Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <View style={styles.datePill}>
                  <View style={[styles.caretCircle, styles.caretCircleRight]}>
                    <Text style={styles.caretInner}>v</Text>
                  </View>
                </View>
              </View>
              <View style={styles.dateCol}>
                <View style={styles.datePill}>
                  <View style={[styles.caretCircle, styles.caretCircleRight]}>
                    <Text style={styles.caretInner}>v</Text>
                  </View>
                </View>
              </View>
              <View style={styles.dateCol}>
                <View style={styles.datePill}>
                  <View style={[styles.caretCircle, styles.caretCircleRight]}>
                    <Text style={styles.caretInner}>v</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionSubLabel, { marginTop: 10 }]}>
              {t("tour.booking.totalGuests")}
            </Text>
            <View style={styles.counterRowWrapper}>
              <View style={styles.counterGroup}>
                <Text style={[styles.counterLabel, { color: "#3B5BDB" }]}>
                  {t("tour.booking.adult")}
                </Text>
                <View style={styles.counterPillBox}>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnLeft]}
                    onPress={() => decrement("adult")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterCenterValue}>{adultCount}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnRight]}
                    onPress={() => increment("adult")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.counterHint}>
                  {t("tour.booking.atLeastOneAdult")}
                </Text>
              </View>

              <View style={styles.counterGroup}>
                <Text style={[styles.counterLabel, { color: "#2F9E44" }]}>
                  {t("tour.booking.children")}
                </Text>
                <View style={styles.counterPillBox}>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnLeft]}
                    onPress={() => decrement("children")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterCenterValue}>{childrenCount}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnRight]}
                    onPress={() => increment("children")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.counterGroup}>
                <Text style={[styles.counterLabel, { color: "#087F5B" }]}>
                  {t("tour.booking.baby")}
                </Text>
                <View style={styles.counterPillBox}>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnLeft]}
                    onPress={() => decrement("baby")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterCenterValue}>{babyCount}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, styles.counterBtnRight]}
                    onPress={() => increment("baby")}
                    activeOpacity={1}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dynamic guest forms */}
            {adultCount > 0 && (
              <View style={styles.guestCard}>
                <Text style={[styles.guestCardTitle, { color: "#3B5BDB" }]}>
                  {t("tour.booking.adult")}
                </Text>
                {Array.from({ length: adultCount }).map((_, idx) => (
                  <View key={`adult-${idx}`} style={styles.guestForm}>
                    <Text style={styles.guestIndex}>{idx + 1}</Text>

                    {/* Full Name & Date of Birth Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.fullNameFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.fullname")}
                        </Text>
                        <TextInput
                          style={[styles.input, styles.halfInput]}
                          placeholder={t("tour.booking.fullname")}
                          value={adultInfo[idx]?.fullName || ""}
                          onChangeText={(text) =>
                            setAdultInfo((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], fullName: text },
                            }))
                          }
                        />
                      </View>
                      <View style={styles.dobFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.dateOfBirth")}
                        </Text>
                        <DobField
                          value={adultDob[idx]}
                          onChange={(val) =>
                            setAdultDob((prev) => ({ ...prev, [idx]: val }))
                          }
                        />
                      </View>
                    </View>

                    {/* Gender & Nationality Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.gender")}
                        </Text>
                        <View style={styles.genderRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowGenderPicker(
                                showGenderPicker === `adult-${idx}`
                                  ? null
                                  : `adult-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.genderText,
                                !adultInfo[idx]?.gender && { color: "#9ca3af" },
                              ]}
                            >
                              {adultInfo[idx]?.gender
                                ? t(`tour.booking.${adultInfo[idx].gender}`)
                                : t("tour.booking.selectGender")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showGenderPicker === `adult-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "male" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.male")}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "female" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.female")}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.nationality")}
                        </Text>
                        <View style={styles.nationalityRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowNationalityPicker(
                                showNationalityPicker === `adult-${idx}`
                                  ? null
                                  : `adult-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.nationalityText,
                                !adultInfo[idx]?.nationality && {
                                  color: "#9ca3af",
                                },
                              ]}
                            >
                              {adultInfo[idx]?.nationality ||
                                t("tour.booking.selectNationality")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showNationalityPicker === `adult-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Vietnam",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Vietnam</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "United Kingdom",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  United Kingdom
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  South Korea
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setAdultInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Other",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Other</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* ID Number */}
                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestLabel}>
                        {t("tour.booking.idNumber")}
                      </Text>
                      <TextInput
                        style={[styles.input, styles.guestInput]}
                        placeholder={t("tour.booking.idNumber")}
                        value={adultInfo[idx]?.idNumber || ""}
                        onChangeText={(text) =>
                          setAdultInfo((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], idNumber: text },
                          }))
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {childrenCount > 0 && (
              <View style={styles.guestCard}>
                <Text style={[styles.guestCardTitle, { color: "#2F9E44" }]}>
                  {t("tour.booking.children")}
                </Text>
                {Array.from({ length: childrenCount }).map((_, idx) => (
                  <View key={`child-${idx}`} style={styles.guestForm}>
                    <Text style={styles.guestIndex}>{idx + 1}</Text>

                    {/* Full Name & Date of Birth Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.fullNameFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.fullname")}
                        </Text>
                        <TextInput
                          style={[styles.input, styles.halfInput]}
                          placeholder={t("tour.booking.fullname")}
                          value={childrenInfo[idx]?.fullName || ""}
                          onChangeText={(text) =>
                            setChildrenInfo((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], fullName: text },
                            }))
                          }
                        />
                      </View>
                      <View style={styles.dobFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.dateOfBirth")}
                        </Text>
                        <DobField
                          value={childrenDob[idx]}
                          onChange={(val) =>
                            setChildrenDob((prev) => ({ ...prev, [idx]: val }))
                          }
                        />
                      </View>
                    </View>

                    {/* Gender & Nationality Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.gender")}
                        </Text>
                        <View style={styles.genderRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowGenderPicker(
                                showGenderPicker === `child-${idx}`
                                  ? null
                                  : `child-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.genderText,
                                !childrenInfo[idx]?.gender && {
                                  color: "#9ca3af",
                                },
                              ]}
                            >
                              {childrenInfo[idx]?.gender
                                ? t(`tour.booking.${childrenInfo[idx].gender}`)
                                : t("tour.booking.selectGender")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showGenderPicker === `child-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "male" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.male")}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "female" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.female")}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.nationality")}
                        </Text>
                        <View style={styles.nationalityRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowNationalityPicker(
                                showNationalityPicker === `child-${idx}`
                                  ? null
                                  : `child-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.nationalityText,
                                !childrenInfo[idx]?.nationality && {
                                  color: "#9ca3af",
                                },
                              ]}
                            >
                              {childrenInfo[idx]?.nationality ||
                                t("tour.booking.selectNationality")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showNationalityPicker === `child-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Vietnam",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Vietnam</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "United Kingdom",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  United Kingdom
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "South Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  South Korea
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setChildrenInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Other",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Other</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* ID Number */}
                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestLabel}>
                        {t("tour.booking.idNumber")}
                      </Text>
                      <TextInput
                        style={[styles.input, styles.guestInput]}
                        placeholder={t("tour.booking.idNumber")}
                        value={childrenInfo[idx]?.idNumber || ""}
                        onChangeText={(text) =>
                          setChildrenInfo((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], idNumber: text },
                          }))
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {babyCount > 0 && (
              <View style={styles.guestCard}>
                <Text style={[styles.guestCardTitle, { color: "#087F5B" }]}>
                  {t("tour.booking.baby")}
                </Text>
                {Array.from({ length: babyCount }).map((_, idx) => (
                  <View key={`baby-${idx}`} style={styles.guestForm}>
                    <Text style={styles.guestIndex}>{idx + 1}</Text>

                    {/* Full Name & Date of Birth Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.fullNameFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.fullname")}
                        </Text>
                        <TextInput
                          style={[styles.input, styles.halfInput]}
                          placeholder={t("tour.booking.fullname")}
                          value={babyInfo[idx]?.fullName || ""}
                          onChangeText={(text) =>
                            setBabyInfo((prev) => ({
                              ...prev,
                              [idx]: { ...prev[idx], fullName: text },
                            }))
                          }
                        />
                      </View>
                      <View style={styles.dobFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.dateOfBirth")}
                        </Text>
                        <DobField
                          value={babyDob[idx]}
                          onChange={(val) =>
                            setBabyDob((prev) => ({ ...prev, [idx]: val }))
                          }
                        />
                      </View>
                    </View>

                    {/* Gender & Nationality Row */}
                    <View style={styles.rowContainer}>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.gender")}
                        </Text>
                        <View style={styles.genderRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowGenderPicker(
                                showGenderPicker === `baby-${idx}`
                                  ? null
                                  : `baby-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.genderText,
                                !babyInfo[idx]?.gender && { color: "#9ca3af" },
                              ]}
                            >
                              {babyInfo[idx]?.gender
                                ? t(`tour.booking.${babyInfo[idx].gender}`)
                                : t("tour.booking.selectGender")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showGenderPicker === `baby-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "male" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.male")}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], gender: "female" },
                                  }));
                                  setShowGenderPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {t("tour.booking.female")}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.halfFieldGroup}>
                        <Text style={styles.guestLabel}>
                          {t("tour.booking.nationality")}
                        </Text>
                        <View style={styles.nationalityRow}>
                          <Pressable
                            style={[styles.input, styles.halfInput]}
                            onPress={() => {
                              closeDropdowns();
                              setShowNationalityPicker(
                                showNationalityPicker === `baby-${idx}`
                                  ? null
                                  : `baby-${idx}`
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.nationalityText,
                                !babyInfo[idx]?.nationality && {
                                  color: "#9ca3af",
                                },
                              ]}
                            >
                              {babyInfo[idx]?.nationality ||
                                t("tour.booking.selectNationality")}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color="#6b7280"
                              style={styles.dropdownIcon}
                            />
                          </Pressable>
                          {showNationalityPicker === `baby-${idx}` && (
                            <View style={styles.dropdownContainer}>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Vietnam",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Vietnam</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "United Kingdom",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  United Kingdom
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  South Korea
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setBabyInfo((prev) => ({
                                    ...prev,
                                    [idx]: {
                                      ...prev[idx],
                                      nationality: "Other",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Other</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* ID Number */}
                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestLabel}>
                        {t("tour.booking.idNumber")}
                      </Text>
                      <TextInput
                        style={[styles.input, styles.guestInput]}
                        placeholder={t("tour.booking.idNumber")}
                        value={babyInfo[idx]?.idNumber || ""}
                        onChangeText={(text) =>
                          setBabyInfo((prev) => ({
                            ...prev,
                            [idx]: { ...prev[idx], idNumber: text },
                          }))
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Total Section */}
            <View style={styles.totalSection}>
              <Text style={styles.totalTitle}>{t("tour.booking.total")}</Text>
              <View style={styles.totalBreakdown}>
                {adultCount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {t("tour.booking.adult")}
                    </Text>
                    <Text style={styles.totalCount}>x{adultCount}</Text>
                  </View>
                )}
                {childrenCount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {t("tour.booking.children")}
                    </Text>
                    <Text style={styles.totalCount}>x{childrenCount}</Text>
                  </View>
                )}
                {babyCount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {t("tour.booking.baby")}
                    </Text>
                    <Text style={styles.totalCount}>x{babyCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.totalPrice}>
                {formatPrice(calculateTotal())} VND
              </Text>
            </View>

            {/* Booking Button */}
            <BookingButton onPress={handleBooking} disabled={booking} />

            {/* Extra bottom space */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </TouchableOpacity>
    </MainLayout>
  );
}

type DobFieldProps = { value?: string; onChange: (value: string) => void };

const DobField: React.FC<DobFieldProps> = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    if (!value) return new Date();
    const [dd, mm, yyyy] = value.split("/");
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  });

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      onChange(formatDate(selectedDate));
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  return (
    <>
      <Pressable
        style={[styles.input, styles.dobInput]}
        onPress={showDatePicker}
      >
        <Text
          style={[styles.dobText, !value && { color: "#9ca3af" }]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {value || "dob"}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </>
  );
};
