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
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MainLayout from "../../../src/components/MainLayout";
import { useNavigation } from "../../../src/navigation";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../../src/contexts/authContext";
import BookingButton from "../../../src/components/BookingButton";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../../src/endpoints/tour";
import { TourResponse } from "../../../src/types/tour";
import styles from "./styles";

export default function BuyingTour() {
  const { goBack, navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1;

  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [booking] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const lastScrollUpdateTs = React.useRef(0);
  const scrollThreshold = 50;

  const [showGenderPicker, setShowGenderPicker] = React.useState<string | null>(
    null
  );
  const [showNationalityPicker, setShowNationalityPicker] = React.useState<
    string | null
  >(null);

  const closeDropdowns = () => {
    setShowGenderPicker(null);
    setShowNationalityPicker(null);
  };

  React.useEffect(() => {
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

  const handleScroll = React.useCallback(
    (event: any) => {
      const now = Date.now();
      if (now - lastScrollUpdateTs.current < 120) return;
      lastScrollUpdateTs.current = now;

      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
      if (scrollDifference > scrollThreshold) {
        const shouldShow = currentScrollY <= lastScrollY.current;
        if (shouldShow !== isNavVisible) setIsNavVisible(shouldShow);
        lastScrollY.current = currentScrollY;
      }
    },
    [isNavVisible]
  );
  const [adultCount, setAdultCount] = React.useState<number>(1);
  const [childrenCount, setChildrenCount] = React.useState<number>(0);
  const [babyCount, setBabyCount] = React.useState<number>(0);
  const [adultDob, setAdultDob] = React.useState<Record<number, string>>({});
  const [childrenDob, setChildrenDob] = React.useState<Record<number, string>>(
    {}
  );
  const [babyDob, setBabyDob] = React.useState<Record<number, string>>({});

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

  const [usePersonalInfo, setUsePersonalInfo] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState({
    fullName: "",
    address: "",
    phoneNumber: "",
    email: "",
    pickUpPoint: "",
    note: "",
  });
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [adultDobError, setAdultDobError] = React.useState<
    Record<number, string | null>
  >({});
  const [childrenDobError, setChildrenDobError] = React.useState<
    Record<number, string | null>
  >({});
  const [babyDobError, setBabyDobError] = React.useState<
    Record<number, string | null>
  >({});

  const increment = React.useCallback((type: "adult" | "children" | "baby") => {
    if (type === "adult") setAdultCount((c) => c + 1);
    if (type === "children") setChildrenCount((c) => c + 1);
    if (type === "baby") setBabyCount((c) => c + 1);
  }, []);
  const decrement = React.useCallback((type: "adult" | "children" | "baby") => {
    if (type === "adult") setAdultCount((c) => Math.max(1, c - 1));
    if (type === "children") setChildrenCount((c) => Math.max(0, c - 1));
    if (type === "baby") setBabyCount((c) => Math.max(0, c - 1));
  }, []);

  const handleTogglePersonalInfo = () => {
    const newValue = !usePersonalInfo;
    setUsePersonalInfo(newValue);

    if (newValue && user) {
      setFormData({
        fullName: user.username || "",
        address: "",
        phoneNumber: user.phone || "",
        email: user.email || "",
        pickUpPoint: formData.pickUpPoint,
        note: formData.note,
      });
    }
  };

  const needsUpdate = (field: string) => {
    if (!usePersonalInfo || !user) return false;

    switch (field) {
      case "fullName":
        return !user.username;
      case "address":
        return true;
      case "phoneNumber":
        return !user.phone;
      case "email":
        return false;
      default:
        return false;
    }
  };

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

  const parseDob = (dob?: string): Date | null => {
    if (!dob) return null;
    const m = String(dob).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const [yyyy, mm, dd] = dob.split("-").map((v) => Number(v));
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(dob);
    return isNaN(d.getTime()) ? null : d;
  };

  const calcAgeYears = (dobStr?: string): number | null => {
    const d = parseDob(dobStr);
    if (!d) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  };

  const validateBeforeBooking = (): boolean => {
    if (adultCount < 1) {
      Alert.alert(t("common.error"), t("tour.booking.errors.adultMin"));
      return false;
    }
    if (!formData.address || formData.address.trim().length < 2) {
      Alert.alert(t("common.error"), t("tour.booking.errors.fullNameRequired"));
      return false;
    }
    if (!formData.pickUpPoint || formData.pickUpPoint.trim().length < 2) {
      Alert.alert(
        t("common.error"),
        t("tour.booking.errors.pickUpPointRequired")
      );
      return false;
    }
    const nameOk = formData.fullName && formData.fullName.trim().length >= 2;
    const digitsOnlyPhone = (formData.phoneNumber || "").replace(/\D/g, "");
    const phoneOk = digitsOnlyPhone.length === 10;
    const emailOk = isValidEmail(formData.email || "");
    if (!nameOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.fullNameRequired"));
      return false;
    }
    if (!phoneOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.phoneTenDigits"));
      return false;
    }
    if (!emailOk) {
      Alert.alert(t("common.error"), t("tour.booking.errors.emailInvalid"));
      return false;
    }

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
      const dob = adultDob[i];
      const age = calcAgeYears(dob);
      if (!dob || age === null) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.adultDobInvalid", { index: i + 1 })
        );
        return false;
      }
      if (age < 18) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.adultAgeMin", { index: i + 1 })
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
      const dob = childrenDob[i];
      const age = calcAgeYears(dob);
      if (!dob || age === null) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.childDobInvalid", { index: i + 1 })
        );
        return false;
      }
      if (age < 2 || age >= 18) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.childAgeRange", { index: i + 1 })
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
      const dob = babyDob[i];
      const age = calcAgeYears(dob);
      if (!dob || age === null) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.babyDobInvalid", { index: i + 1 })
        );
        return false;
      }
      if (age >= 2) {
        Alert.alert(
          t("common.error"),
          t("tour.booking.errors.babyAgeMax", { index: i + 1 })
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

    const bookingData = {
      customerName: formData.fullName || "",
      customerPhone: formData.phoneNumber || "",
      customerEmail: formData.email || user.email,
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

    navigate(
      `/tour/confirm?tourId=${tour.id}&bookingData=${encodeURIComponent(
        JSON.stringify(bookingData)
      )}`
    );
  };

  const imageList = React.useMemo(() => {
    const contentImages = (tour?.contents || [])
      .flatMap((c: any) => (Array.isArray(c.images) ? c.images : []))
      .map((u: any) => (typeof u === "string" ? u.trim() : ""))
      .filter((u: any) => u && /^https?:\/\//i.test(u));
    const cover =
      tour?.tourImgPath && /^https?:\/\//i.test((tour.tourImgPath || "").trim())
        ? [tour!.tourImgPath.trim()]
        : [];
    const all = [...cover, ...contentImages];
    return all.length > 0
      ? all
      : [
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
        ];
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
          scrollEventThrottle={32}
          removeClippedSubviews
        >
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageList[currentImageIndex] }}
              style={styles.heroImage}
            />
            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
              <View style={styles.backCircle}>
                <Ionicons name="chevron-back" size={18} color="#000" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backBtn, { left: undefined, right: 12 }]}
              onPress={() =>
                setCurrentImageIndex((prev) =>
                  imageList.length ? (prev + 1) % imageList.length : 0
                )
              }
            >
              <View style={styles.backCircle}>
                <Ionicons name="chevron-forward" size={18} color="#000" />
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
            <View style={styles.metaBox}>
              <View style={styles.metaRowContent}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps} numberOfLines={2}>
                    {t("tour.meta.rating")}
                  </Text>
                  <View style={styles.metaValueRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text
                      style={styles.metaValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      4.5
                    </Text>
                  </View>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps} numberOfLines={2}>
                    {t("tour.meta.type")}
                  </Text>
                  <Text
                    style={styles.metaValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {tour.tourType || t("tour.types.openTrip")}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps} numberOfLines={2}>
                    {t("tour.meta.estimate")}
                  </Text>
                  <Text
                    style={styles.metaValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tour.tourDuration || "3D 2N"}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabelCaps} numberOfLines={2}>
                    {t("tour.meta.vehicle")}
                  </Text>
                  <Text
                    style={styles.metaValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
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
              <Text style={styles.label}>
                {t("tour.booking.address")}{" "}
                {!formData.address?.trim() && (
                  <Text style={{ color: "#FF3B30" }}> *</Text>
                )}
              </Text>
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
              <Text style={styles.label}>
                {t("tour.booking.phoneNumber")}{" "}
                {!(formData.phoneNumber || "").trim() && (
                  <Text style={{ color: "#FF3B30" }}> *</Text>
                )}
              </Text>
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
                onChangeText={(text) => {
                  const digits = (text || "").replace(/\D/g, "");
                  setFormData((prev) => ({ ...prev, phoneNumber: digits }));
                  if (digits.length === 0) {
                    setPhoneError(null);
                  } else if (digits.length !== 10) {
                    setPhoneError(t("tour.booking.errors.phoneTenDigits"));
                  } else {
                    setPhoneError(null);
                  }
                }}
                editable={!usePersonalInfo || needsUpdate("phoneNumber")}
              />
              {!!phoneError && (
                <Text style={{ color: "#FF3B30", marginTop: 6, fontSize: 12 }}>
                  {phoneError}
                </Text>
              )}
              {!(formData.phoneNumber || "").trim() && (
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
              <Text style={styles.label}>
                {t("tour.booking.pickUpPoint")}{" "}
                {!formData.pickUpPoint?.trim() && (
                  <Text style={{ color: "#FF3B30" }}> *</Text>
                )}
              </Text>
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
                          onChange={(val) => {
                            setAdultDob((prev) => ({ ...prev, [idx]: val }));
                            // live validate adult >= 18
                            const d = parseDob(val);
                            const age = calcAgeYears(val);
                            if (!d || age == null) {
                              setAdultDobError((prev) => ({
                                ...prev,
                                [idx]: t(
                                  "tour.booking.errors.adultDobInvalid",
                                  { index: idx + 1 }
                                ),
                              }));
                            } else if (age < 18) {
                              setAdultDobError((prev) => ({
                                ...prev,
                                [idx]: t("tour.booking.errors.adultAgeMin", {
                                  index: idx + 1,
                                }),
                              }));
                            } else {
                              setAdultDobError((prev) => ({
                                ...prev,
                                [idx]: null,
                              }));
                            }
                          }}
                        />
                        {!!adultDobError[idx] && (
                          <Text
                            style={{
                              color: "#FF3B30",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {adultDobError[idx]}
                          </Text>
                        )}
                      </View>
                    </View>

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
                          onChange={(val) => {
                            setChildrenDob((prev) => ({ ...prev, [idx]: val }));
                            const d = parseDob(val);
                            const age = calcAgeYears(val);
                            if (!d || age == null) {
                              setChildrenDobError((prev) => ({
                                ...prev,
                                [idx]: t(
                                  "tour.booking.errors.childDobInvalid",
                                  { index: idx + 1 }
                                ),
                              }));
                            } else if (age < 2 || age >= 18) {
                              setChildrenDobError((prev) => ({
                                ...prev,
                                [idx]: t("tour.booking.errors.childAgeRange", {
                                  index: idx + 1,
                                }),
                              }));
                            } else {
                              setChildrenDobError((prev) => ({
                                ...prev,
                                [idx]: null,
                              }));
                            }
                          }}
                        />
                        {!!childrenDobError[idx] && (
                          <Text
                            style={{
                              color: "#FF3B30",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {childrenDobError[idx]}
                          </Text>
                        )}
                      </View>
                    </View>

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
                          onChange={(val) => {
                            setBabyDob((prev) => ({ ...prev, [idx]: val }));
                            const d = parseDob(val);
                            const age = calcAgeYears(val);
                            if (!d || age == null) {
                              setBabyDobError((prev) => ({
                                ...prev,
                                [idx]: t("tour.booking.errors.babyDobInvalid", {
                                  index: idx + 1,
                                }),
                              }));
                            } else if (age >= 2) {
                              setBabyDobError((prev) => ({
                                ...prev,
                                [idx]: t("tour.booking.errors.babyAgeMax", {
                                  index: idx + 1,
                                }),
                              }));
                            } else {
                              setBabyDobError((prev) => ({
                                ...prev,
                                [idx]: null,
                              }));
                            }
                          }}
                        />
                        {!!babyDobError[idx] && (
                          <Text
                            style={{
                              color: "#FF3B30",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {babyDobError[idx]}
                          </Text>
                        )}
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

            <BookingButton onPress={handleBooking} disabled={booking} />

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </TouchableOpacity>
    </MainLayout>
  );
}

type DobFieldProps = { value?: string; onChange: (value: string) => void };

const DobField: React.FC<DobFieldProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    if (!value) return new Date();
    try {
      const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yyyy = Number(m[3]);
        const d = new Date(yyyy, mm - 1, dd);
        if (!isNaN(d.getTime())) return d;
      }
      const d2 = new Date(value);
      if (!isNaN(d2.getTime())) return d2;
    } catch {}
    return new Date();
  });

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === "ios") {
      if (selected) {
        setSelectedDate(selected);
        onChange(formatDate(selected));
      }
      return;
    }
    if (selected) {
      setSelectedDate(selected);
      onChange(formatDate(selected));
    }
    setShowPicker(false);
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
        >
          {value || t("tour.booking.dobShort")}
        </Text>
      </Pressable>

      {showPicker && Platform.OS !== "ios" && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.iosDateOverlay}>
            <View style={styles.iosDateCard}>
              <Text style={styles.iosDateTitle}>
                {t("tour.booking.dateOfBirth")}
              </Text>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={{ alignSelf: "stretch" }}
              />
              <View style={styles.iosDateActions}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onChange(formatDate(selectedDate));
                    setShowPicker(false);
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>{t("common.ok")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};
