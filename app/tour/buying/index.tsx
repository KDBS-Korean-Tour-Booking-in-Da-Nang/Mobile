import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BookingButton from "../../../components/BookingButton";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { tourEndpoints } from "../../../services/endpoints/tour";
import { voucherEndpoints } from "../../../services/endpoints/voucher";
import { useAuthContext } from "../../../src/contexts/authContext";
import { TourResponse } from "../../../src/types/response/tour.response";
import {
  ApplyVoucherResponse,
  VoucherDiscountType,
  VoucherResponse,
  VoucherStatus,
} from "../../../src/types/response/voucher.response";
import { formatPriceKRW } from "../../../src/utils/currency";
import { getTourThumbnailUrl } from "../../../src/utils/media";
import styles from "./styles";

export default function BuyingTour() {
  const { goBack, navigate } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const tourId = params.id ? Number(params.id) : 1;

  const [tour, setTour] = React.useState<TourResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creatingBooking, setCreatingBooking] = React.useState(false);
  const heroWidth = React.useMemo(
    () => Dimensions.get("window").width - 24,
    []
  );
  const imageScrollRef = React.useRef<ScrollView | null>(null);

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
      } catch {
        Alert.alert(t("common.error"), t("tour.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, t]);

  React.useEffect(() => {
    const loadRatings = async () => {
      if (!tourId || isNaN(tourId) || tourId <= 0) {
        setAverageRating(null);
        return;
      }
      try {
        const ratingsResponse = await tourEndpoints.getTourRatings(tourId);
        const ratings = Array.isArray(ratingsResponse.data) ? ratingsResponse.data : [];
        
        if (ratings.length === 0) {
          setAverageRating(null);
          return;
        }

        const totalStars = ratings.reduce((sum: number, rating: any) => {
          const star = Number(rating.star) || 0;
          return sum + star;
        }, 0);

        const average = totalStars / ratings.length;
        setAverageRating(Math.round(average * 10) / 10); // Round to 1 decimal place
      } catch {
        setAverageRating(null);
      }
    };

    loadRatings();
  }, [tourId]);

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
    departureDate: "",
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

  const [voucher, setVoucher] = React.useState<VoucherResponse | null>(null);
  const [selectedVoucherPreview, setSelectedVoucherPreview] = React.useState<ApplyVoucherResponse | null>(null);
  const [showVoucherModal, setShowVoucherModal] = React.useState(false);
  const [availableVouchers, setAvailableVouchers] = React.useState<
    VoucherResponse[]
  >([]);
  const [previewVoucherResponses, setPreviewVoucherResponses] = React.useState<ApplyVoucherResponse[]>([]);
  const [selectedVoucherId, setSelectedVoucherId] = React.useState<
    number | null
  >(null);
  const [loadingVouchers, setLoadingVouchers] = React.useState(false);
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [showVoucherAndPrice, setShowVoucherAndPrice] = React.useState(false);
  const [loadingContinue, setLoadingContinue] = React.useState(false);
  const [averageRating, setAverageRating] = React.useState<number | null>(null);

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
        departureDate: formData.departureDate,
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

  const originalTotal = calculateTotal();

  const computedDiscount = React.useMemo(() => {
    if (selectedVoucherPreview?.discountAmount !== undefined) {
      return Number(selectedVoucherPreview.discountAmount) || 0;
    }
    if (!voucher) return 0;
    const base = originalTotal || 0;
    if (base <= 0) return 0;
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      return Math.floor((base * Number(voucher.discountValue || 0)) / 100);
    }
    return Number(voucher.discountValue || 0);
  }, [selectedVoucherPreview, voucher, originalTotal]);

  const discountAmount = React.useMemo(() => {
    if (selectedVoucherPreview?.discountAmount !== undefined) {
      return Number(selectedVoucherPreview.discountAmount) || 0;
    }
    return Math.min(Math.max(computedDiscount, 0), Math.max(originalTotal, 0));
  }, [selectedVoucherPreview, computedDiscount, originalTotal]);

  const finalTotal = React.useMemo(() => {
    if (selectedVoucherPreview?.finalTotal !== undefined) {
      return Number(selectedVoucherPreview.finalTotal) || 0;
    }
    return Math.max(originalTotal - discountAmount, 0);
  }, [selectedVoucherPreview, originalTotal, discountAmount]);

  const formatPrice = (price: number) => {
    return formatPriceKRW(price);
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

  const getMinimumDepartureDate = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDays =
      tour?.tourDeadline && tour.tourDeadline > 0
        ? tour.tourDeadline + 1
        : 1;
    const advancedDays =
      tour?.minAdvancedDays && tour.minAdvancedDays > 0
        ? tour.minAdvancedDays
        : 0;
    const daysFromToday = Math.max(deadlineDays, advancedDays, 1);

      const minDate = new Date(today);
    minDate.setDate(today.getDate() + daysFromToday);
      return minDate;
  };

  const getMaximumDepartureDate = (): Date | undefined => {
    if (!tour?.tourExpirationDate) return undefined;

    try {
      const expirationDate = new Date(tour.tourExpirationDate);
      expirationDate.setHours(23, 59, 59, 999);
      return expirationDate;
    } catch {
      return undefined;
    }
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
    if (!formData.departureDate || formData.departureDate.trim().length < 2) {
      Alert.alert(
        t("common.error"),
        t("tour.booking.errors.departureDateRequired")
      );
      return false;
    }

    const departureDateObj = parseDob(formData.departureDate);
    if (!departureDateObj) {
      Alert.alert(
        t("common.error"),
        t("tour.booking.errors.departureDateInvalid")
      );
      return false;
    }

    const normalizeDateForComparison = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const departureDateNormalized =
      normalizeDateForComparison(departureDateObj);
    const minDate = getMinimumDepartureDate();
    const minDateNormalized = normalizeDateForComparison(minDate);
    const maxDate = getMaximumDepartureDate();
    const maxDateNormalized = maxDate
      ? normalizeDateForComparison(maxDate)
      : null;

    const minDaysRequired = Math.max(
      tour?.tourDeadline && tour.tourDeadline > 0
        ? tour.tourDeadline + 1
        : 1,
      tour?.minAdvancedDays && tour.minAdvancedDays > 0
        ? tour.minAdvancedDays
        : 0,
      1
    );

    if (departureDateNormalized < minDateNormalized) {
      const minDateStr = `${String(minDate.getDate()).padStart(
        2,
        "0"
      )}/${String(minDate.getMonth() + 1).padStart(
        2,
        "0"
      )}/${minDate.getFullYear()}`;
      Alert.alert(
        t("common.error"),
        t("tour.booking.errors.departureDateMinError", {
          date: minDateStr,
          days: minDaysRequired,
        })
      );
      return false;
    }

    if (maxDateNormalized && departureDateNormalized > maxDateNormalized) {
      const maxDateStr = tour?.tourExpirationDate
        ? new Date(tour.tourExpirationDate).toLocaleDateString("vi-VN")
        : maxDate
        ? maxDate.toLocaleDateString("vi-VN")
        : "";
      Alert.alert(
        t("common.error"),
        t("tour.booking.errors.departureDateMaxError", { date: maxDateStr })
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

  const handleContinue = async () => {
    if (!tour || !user?.email) {
      Alert.alert(t("common.error"), t("tour.booking.errors.loginRequired"));
      return;
    }

    if (!validateBeforeBooking()) {
      return;
    }

    try {
      setLoadingContinue(true);

      try {
        const previewResponse = await voucherEndpoints.previewAllAvailable({
          tourId: tour.id,
          adultsCount: adultCount,
          childrenCount: childrenCount,
          babiesCount: babyCount,
        });

        const previewData = Array.isArray(previewResponse.data) 
          ? previewResponse.data 
          : [];
        setPreviewVoucherResponses(previewData);

        setShowVoucherAndPrice(true);
      } catch (previewError: any) {
        const previewErrorMessage =
          previewError?.response?.data?.message ||
          previewError?.response?.data?.error ||
          previewError?.message;

        setPreviewVoucherResponses([]);
        setShowVoucherAndPrice(true);
        Alert.alert(
          t("common.warning") || "Warning",
          previewErrorMessage ||
            "Could not load voucher preview. You can still continue."
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("tour.booking.errors.loadFailed") ||
        "Không thể tải voucher. Vui lòng thử lại.";
      Alert.alert(t("common.error"), message);
    } finally {
      setLoadingContinue(false);
    }
  };

  const createBookingWithVoucher = async (selectedVoucherCode?: string) => {
    if (!tour || !user?.email) {
      Alert.alert(t("common.error"), t("tour.booking.errors.loginRequired"));
      return;
    }

    try {
      setCreatingBooking(true);

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
      departureDate: formData.departureDate || "",
      note: formData.note || "",
    };

    const normalizeDateString = (value: any) => {
      if (!value) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const match = trimmed.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})$/);
        if (match) {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const dd = String(date.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }
      } catch {}
      return null;
    };

    const ensureDepartureDate = () => {
      const normalized = normalizeDateString(
        formData.departureDate || bookingData.departureDate
      );
      if (normalized) return normalized;
        const minDate = getMinimumDepartureDate();
        const yyyy = minDate.getFullYear();
        const mm = String(minDate.getMonth() + 1).padStart(2, "0");
        const dd = String(minDate.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const mapGuests = (
      count: number,
      getGuest: (index: number) => any,
      getDob: (index: number) => any,
      type: "ADULT" | "CHILD" | "BABY"
    ) => {
      const list: any[] = [];
      for (let i = 0; i < count; i++) {
        const guest = getGuest(i) || {};
        const dobValue = getDob(i) || guest.birthDate;
        const normalizedDob = normalizeDateString(dobValue);
        if (!normalizedDob) {
          continue;
        }
        list.push({
          fullName: guest.fullName?.trim() || "Guest",
          birthDate: normalizedDob,
          gender: (guest.gender || "OTHER").toUpperCase(),
          idNumber: guest.idNumber || "",
          nationality: guest.nationality || "Korea",
          bookingGuestType: type,
        });
      }
      return list;
    };

    const guestPayload = [
      ...mapGuests(
        adultCount,
        (idx) => adultInfo[idx],
        (idx) => adultDob[idx],
        "ADULT"
      ),
      ...mapGuests(
        childrenCount,
        (idx) => childrenInfo[idx],
        (idx) => childrenDob[idx],
        "CHILD"
      ),
      ...mapGuests(
        babyCount,
        (idx) => babyInfo[idx],
        (idx) => babyDob[idx],
        "BABY"
      ),
    ];

    if (guestPayload.length === 0) {
      Alert.alert(t("common.error"), "At least one guest is required");
      return;
    }

    const sanitizePhone = (value: string) => value.replace(/\D/g, "");
    const contactPhone = sanitizePhone(formData.phoneNumber || "");

    const bookingRequest = {
      tourId: tour.id,
      userEmail: (user.email || "").trim().toLowerCase(),
      contactName:
        bookingData.customerName && bookingData.customerName.trim() !== ""
          ? bookingData.customerName
          : "Guest User",
      contactAddress: bookingData.customerAddress || "",
      contactPhone: contactPhone || "0123456789",
      contactEmail:
        bookingData.customerEmail && bookingData.customerEmail.trim() !== ""
          ? bookingData.customerEmail.trim()
          : String(user.email || "").trim(),
      pickupPoint: bookingData.pickUpPoint || "",
      note: bookingData.note || "",
      departureDate: ensureDepartureDate(),
      adultsCount: adultCount,
      childrenCount,
      babiesCount: babyCount,
      bookingGuestRequests: guestPayload,

        voucherCode: selectedVoucherCode ? selectedVoucherCode.trim() : undefined,
    };

      const response = (await tourEndpoints.createBooking(bookingRequest)).data;
      if (!response?.bookingId) {
        throw new Error("Missing bookingId from response");
      }
      const bookingId = response.bookingId;

      const userEmailKey = (user.email || "").trim().toLowerCase();
      const tourKey = String(tour.id ?? "na");
      const pendingKey = `pendingBooking:${userEmailKey}:${tourKey}`;
      try {
        await AsyncStorage.setItem(
          pendingKey,
          JSON.stringify({ bookingId, ts: Date.now() })
        );
      } catch {}

      const confirmUrl = `/tour/confirm?tourId=${
        tour.id
      }&bookingId=${bookingId}&bookingData=${encodeURIComponent(
        JSON.stringify(bookingData)
      )}&selectedVoucherCode=${encodeURIComponent(
        selectedVoucherCode || ""
      )}&voucherData=${encodeURIComponent(
        voucher ? JSON.stringify(voucher) : ""
      )}`;

      navigate(confirmUrl);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("tour.booking.errors.createFailed") ||
        "Không thể tạo booking. Vui lòng thử lại.";
      Alert.alert(t("common.error"), message);
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleBooking = async () => {

    await createBookingWithVoucher(voucher?.code);
  };

  React.useEffect(() => {
    const loadVouchers = async () => {
      if (!tour?.id) {
        setAvailableVouchers([]);
        return;
      }
      try {
        setLoadingVouchers(true);
        setVoucherError(null);

        const response = await voucherEndpoints.getByTourId(tour.id);
        const data = Array.isArray(response.data) ? response.data : [];
        const normalized = data
          .map((raw: any) => {
            try {
              const toNumber = (val: any) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return Number.isNaN(num) ? 0 : num;
              };
              const normalizedType =
                String(raw.discountType || "").toUpperCase() === "PERCENT"
                  ? VoucherDiscountType.PERCENT
                  : VoucherDiscountType.FIXED;
              return {
                voucherId: Number(raw.voucherId ?? raw.id ?? 0),
                companyId: Number(raw.companyId ?? 0),
                code: raw.voucherCode || raw.code || "",
                name: raw.name || raw.voucherName || "",
                discountType: normalizedType,
                discountValue: toNumber(raw.discountValue),
                minOrderValue: toNumber(raw.minOrderValue),
                totalQuantity: toNumber(raw.totalQuantity),
                remainingQuantity: toNumber(raw.remainingQuantity),
                startDate: raw.startDate || "",
                endDate: raw.endDate || "",
                status: raw.status ?? VoucherStatus.ACTIVE,
                createdAt: raw.createdAt || "",
                updatedAt: raw.updatedAt || "",
                tourId: raw.tourId ? Number(raw.tourId) : undefined,
                companyUsername: raw.companyUsername ?? undefined,
                tourName: raw.tourName ?? undefined,
                tourIds: Array.isArray(raw.tourIds)
                  ? raw.tourIds
                      .map((id: any) => Number(id))
                      .filter((n: number) => !Number.isNaN(n))
                  : undefined,
              } as VoucherResponse;
            } catch {
              return null;
            }
          })
          .filter((v): v is VoucherResponse => !!v && !!v.code);

        setAvailableVouchers(normalized);
      } catch {
        setVoucherError(t("tour.confirm.voucherLoadFailed"));
        setAvailableVouchers([]);
        setSelectedVoucherId(null);
        setVoucher(null);
      } finally {
        setLoadingVouchers(false);
      }
    };

    loadVouchers();
  }, [t, tour?.id]);

  const imageList = React.useMemo(() => {
    const cover = getTourThumbnailUrl(tour?.tourImgPath);
    return cover
      ? [cover]
      : [
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
        ];
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
          <TouchableOpacity style={styles.retryButton} onPress={() => goBack()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout isNavVisible={isNavVisible}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          removeClippedSubviews
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <View style={styles.imageWrapper}>
            {(() => {
              const loopData =
                imageList.length > 1
                  ? [
                      imageList[imageList.length - 1],
                      ...imageList,
                      imageList[0],
                    ]
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
                          return;
                        }
                        if (idx === lastIndex) {
                          imageScrollRef.current?.scrollTo({
                            x: heroWidth,
                            animated: false,
                          });
                          return;
                        }
                      }
                    } catch {}
                  }}
                >
                  {loopData.map((uri, idx) => (
                    <Image
                      key={`${uri}-${idx}`}
                      source={{ uri }}
                      style={[styles.heroImage, { width: heroWidth }]}
                      resizeMode="cover"
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
                      {averageRating !== null ? averageRating.toFixed(1) : "0.0"}
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
            {usePersonalInfo && (
              <Text style={styles.toggleHint}>
                {t("tour.booking.guestUsePersonalInfoNote")}
              </Text>
            )}

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
              <Text style={styles.label}>
                {t("tour.booking.departureDate")}{" "}
                {!formData.departureDate?.trim() && (
                  <Text style={{ color: "#FF3B30" }}> *</Text>
                )}
              </Text>
              <DateField
                value={formData.departureDate}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, departureDate: val }))
                }
                minimumDate={getMinimumDepartureDate()}
                maximumDate={getMaximumDepartureDate()}
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
            {}
            {}

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

                    {}
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
                                      nationality: "Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Korea</Text>
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
                                      nationality: "Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Korea</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {}
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

                    {}
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

                    {}
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
                                      nationality: "Korea",
                                    },
                                  }));
                                  setShowNationalityPicker(null);
                                }}
                              >
                                <Text style={styles.dropdownText}>Korea</Text>
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

            {}
            {!showVoucherAndPrice && (
              <View style={{ marginTop: 24, marginBottom: 24 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: loadingContinue ? "#ccc" : "#007AFF",
                    borderRadius: 20,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginHorizontal: 80,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={handleContinue}
                  disabled={loadingContinue}
                >
                  {loadingContinue ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#fff",
                      }}
                    >
                      {t("common.continue") || "Tiếp tục"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {}
            {showVoucherAndPrice && (
              <>
                <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t("tour.confirm.voucher")}
                </Text>
                <TouchableOpacity
                  style={styles.selectVoucherButton}
                  onPress={() => setShowVoucherModal(true)}
                >
                  <Text style={styles.selectVoucherButtonText}>
                    {t("tour.confirm.selectVoucher")}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {voucher ? (
                <View style={styles.voucherCard}>
                  <View style={styles.voucherHeader}>
                    <View style={styles.voucherIcon}>
                      <Ionicons name="ticket" size={14} color="#007AFF" />
                    </View>
                    <Text style={styles.voucherCode}>
                      {voucher.code.toUpperCase()}
                    </Text>
                    <Text style={styles.voucherDetailValue}>
                      {voucher.discountType === VoucherDiscountType.PERCENT
                        ? `${voucher.discountValue}%`
                        : formatPriceKRW(voucher.discountValue)}
                    </Text>
                    <TouchableOpacity
                          onPress={() => {
                            setVoucher(null);
                            setSelectedVoucherPreview(null);
                            setSelectedVoucherId(null);
                          }}
                      style={styles.removeVoucherButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                  {voucher.name && (
                    <Text style={styles.voucherName}>{voucher.name}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.noVoucherCard}>
                  <Text style={styles.noVoucherText}>
                    {voucherError || t("tour.confirm.noVoucher")}
                  </Text>
                </View>
              )}
            </View>

            {}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("tour.confirm.priceSummary")}
              </Text>

              <View style={styles.priceCard}>
                <View style={styles.priceItems}>
                  <View style={styles.priceItem}>
                    <View style={styles.priceItemLeft}>
                      <Text style={styles.priceItemLabel}>
                        {adultCount} {t("tour.booking.adultCount")}
                      </Text>
                      <Text style={styles.priceItemUnit}>
                        {formatPriceKRW(tour.adultPrice || 0)} /person
                      </Text>
                    </View>
                    <Text style={styles.priceItemValue}>
                      {formatPriceKRW(adultCount * (tour.adultPrice || 0))}
                    </Text>
                  </View>

                  {childrenCount > 0 && (
                    <View style={styles.priceItem}>
                      <View style={styles.priceItemLeft}>
                        <Text style={styles.priceItemLabel}>
                          {childrenCount} {t("tour.booking.childrenCount")}
                        </Text>
                        <Text style={styles.priceItemUnit}>
                          {formatPriceKRW(tour.childrenPrice || 0)} /person
                        </Text>
                      </View>
                      <Text style={styles.priceItemValue}>
                        {formatPriceKRW(
                          childrenCount * (tour.childrenPrice || 0)
                        )}
                      </Text>
                    </View>
                  )}

                  {babyCount > 0 && (
                    <View style={styles.priceItem}>
                      <View style={styles.priceItemLeft}>
                        <Text style={styles.priceItemLabel}>
                          {babyCount} {t("tour.booking.babyCount")}
                        </Text>
                        <Text style={styles.priceItemUnit}>
                          {formatPriceKRW(tour.babyPrice || 0)} /person
                        </Text>
                      </View>
                      <Text style={styles.priceItemValue}>
                        {formatPriceKRW(babyCount * (tour.babyPrice || 0))}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.priceDivider} />

                {discountAmount > 0 && (
                  <>
                    <View style={styles.priceItem}>
                      <View style={styles.priceItemLeft}>
                        <Text
                          style={[styles.priceItemLabel, { color: "#FF3B30" }]}
                        >
                      {t("tour.confirm.discount")}
                    </Text>
                      </View>
                      <Text style={[styles.priceItemValue, { color: "#FF3B30" }]}>
                      -{formatPriceKRW(discountAmount)}
                    </Text>
                  </View>
                    <View style={styles.priceDivider} />
                  </>
                )}

                {}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>
                    {t("tour.confirm.total")}
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(finalTotal)}
                  </Text>
                </View>

                {}
                {(() => {
                  const depositPercent = selectedVoucherPreview?.depositPercentage 
                    ? Number(selectedVoucherPreview.depositPercentage) * 100 
                    : tour.depositPercentage;
                  const depositAmount = selectedVoucherPreview?.finalDepositAmount !== undefined
                    ? Number(selectedVoucherPreview.finalDepositAmount)
                    : depositPercent && depositPercent > 0 && depositPercent < 100
                    ? Math.round(finalTotal * (depositPercent / 100))
                    : null;

                  if (depositAmount !== null && depositAmount > 0 && depositPercent && depositPercent < 100) {
                    return (
                    <>
                      <View style={styles.priceDivider} />
                      <View style={styles.depositInfoSection}>
                        <View style={styles.depositInfoRow}>
                          <Text style={styles.depositInfoLabel}>
                            {t("tour.booking.depositRequired") ||
                              "Tiền cọc cần thanh toán"}
                          </Text>
                          <Text style={styles.depositInfoValue}>
                              {formatPriceKRW(depositAmount)}
                          </Text>
                        </View>
                        <Text style={styles.depositInfoNote}>
                            {depositPercent
                              ? `${Math.round(depositPercent)}% deposit payment required`
                            : t("tour.booking.depositRequired")}
                        </Text>
                      </View>
                    </>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>

            {}
            <BookingButton onPress={handleBooking} disabled={creatingBooking || !showVoucherAndPrice} />
              </>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </View>
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
                {t("tour.confirm.availableVouchers")}
                </Text>
                <TouchableOpacity
                onPress={() => {
                  setShowVoucherModal(false);
                  setSelectedVoucherId(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

            <ScrollView style={styles.modalScrollView}>
              {loadingVouchers ? (
                <View style={styles.voucherLoadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.voucherLoadingText}>
                    {t("tour.confirm.loadingVouchers")}
                    </Text>
                </View>
              ) : previewVoucherResponses.length > 0 ? (
                previewVoucherResponses.map((pv) => {

                  const v = availableVouchers.find(
                    (av) => av.code === pv.voucherCode || av.voucherId === pv.voucherId
                  ) || {
                    voucherId: pv.voucherId || 0,
                    code: pv.voucherCode || "",
                    name: "",
                    discountType: pv.discountType || VoucherDiscountType.FIXED,
                    discountValue: pv.discountValue || 0,
                  };

                  return (
                    <TouchableOpacity
                      key={pv.voucherId || pv.voucherCode || `voucher-${Math.random()}`}
                      style={[
                        styles.voucherOptionCard,
                        selectedVoucherId === v.voucherId &&
                          styles.voucherOptionCardSelected,
                      ]}
                      onPress={() => setSelectedVoucherId(v.voucherId)}
                    >
                      <View style={styles.voucherOptionRow}>
                        <View style={styles.radioButtonContainer}>
                          <View
                            style={[
                              styles.radioButton,
                              selectedVoucherId === v.voucherId &&
                                styles.radioButtonSelected,
                            ]}
                          >
                            {selectedVoucherId === v.voucherId && (
                              <View style={styles.radioButtonInner} />
                            )}
                          </View>
                        </View>
                        <View style={styles.voucherOptionIcon}>
                          <Ionicons name="ticket-outline" size={20} color="#8BC5FF" />
                        </View>
                        <Text style={styles.voucherOptionCode}>
                          {(pv.voucherCode || v.code || "").toUpperCase()}
                        </Text>
                        <Text style={styles.voucherOptionDetailValue}>
                          {pv.discountType === VoucherDiscountType.PERCENT
                            ? `${pv.discountValue}%`
                            : formatPriceKRW(pv.discountValue || 0)}
                        </Text>
                      </View>
                      {(pv.voucherCode || v.name) && (
                        <Text style={styles.voucherOptionName}>
                          {v.name || pv.voucherCode || ""}
                        </Text>
                      )}
                      {pv.discountAmount !== undefined && (
                        <Text style={[styles.voucherOptionName, { fontSize: 12, color: "#666", marginTop: 4 }]}>
                          Discount: {formatPriceKRW(pv.discountAmount)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : availableVouchers.length > 0 ? (
                availableVouchers.map((v) => (
                    <TouchableOpacity
                    key={v.voucherId}
                    style={[
                      styles.voucherOptionCard,
                      selectedVoucherId === v.voucherId &&
                        styles.voucherOptionCardSelected,
                    ]}
                    onPress={() => setSelectedVoucherId(v.voucherId)}
                  >
                    <View style={styles.voucherOptionRow}>
                      <View style={styles.radioButtonContainer}>
                        <View
                          style={[
                            styles.radioButton,
                            selectedVoucherId === v.voucherId &&
                              styles.radioButtonSelected,
                          ]}
                        >
                          {selectedVoucherId === v.voucherId && (
                            <View style={styles.radioButtonInner} />
                  )}
                </View>
                      </View>
                    <View style={styles.voucherOptionIcon}>
                      <Ionicons name="ticket-outline" size={20} color="#8BC5FF" />
                      </View>
                      <Text style={styles.voucherOptionCode}>
                        {v.code.toUpperCase()}
                      </Text>
                      <Text style={styles.voucherOptionDetailValue}>
                        {v.discountType === VoucherDiscountType.PERCENT
                          ? `${v.discountValue}%`
                          : formatPriceKRW(v.discountValue)}
                  </Text>
                </View>
                    {v.name && (
                      <Text style={styles.voucherOptionName}>{v.name}</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.voucherEmptyContainer}>
                  <Ionicons name="ticket-outline" size={48} color="#ccc" />
                  <Text style={styles.voucherEmptyText}>
                    {voucherError || t("tour.confirm.noVoucherAvailable")}
                  </Text>
            </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowVoucherModal(false);
                  setSelectedVoucherId(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t("tour.confirm.close")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  creatingBooking && styles.modalConfirmButtonDisabled,
                ]}
                onPress={async () => {
                  if (selectedVoucherId) {
                    const selectedVoucher = availableVouchers.find(
                      (v) => v.voucherId === selectedVoucherId
                    );
                    if (selectedVoucher) {
                      setVoucher(selectedVoucher);

                      const previewResponse = previewVoucherResponses.find(
                        (pv) => pv.voucherCode === selectedVoucher.code || pv.voucherId === selectedVoucher.voucherId
                      );
                      if (previewResponse) {
                        setSelectedVoucherPreview(previewResponse);
                      } else {

                        setSelectedVoucherPreview(null);
                      }
                      
                      setShowVoucherModal(false);
                      setSelectedVoucherId(null);


                    }
                  } else {

                    setShowVoucherModal(false);
                    setSelectedVoucherId(null);
                  }
                }}
                disabled={false}
              >
                {creatingBooking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                <Text style={styles.modalConfirmButtonText}>
                    {selectedVoucherId ? t("tour.confirm.select") : (t("tour.confirm.skip") || "Skip")}
                </Text>
                )}
              </TouchableOpacity>
          </View>
      </View>
        </View>
      </Modal>
    </MainLayout>
  );
}

type DobFieldProps = { value?: string; onChange: (value: string) => void };

type DateFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    const minDate = minimumDate || new Date();
    let initialDate = minDate;

    if (value) {
      try {
        const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const dd = Number(m[1]);
          const mm = Number(m[2]);
          const yyyy = Number(m[3]);
          const d = new Date(yyyy, mm - 1, dd);
          if (!isNaN(d.getTime())) initialDate = d;
        } else {
          const d2 = new Date(value);
          if (!isNaN(d2.getTime())) initialDate = d2;
        }
      } catch {}
    }

    if (initialDate < minDate) {
      initialDate = minDate;
    }

    if (maximumDate && initialDate > maximumDate) {
      initialDate = maximumDate;
    }

    return initialDate;
  });

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDateChange = (event: any, selected?: Date) => {
    try {
      if (Platform.OS === "ios") {
        if (event?.type === "dismissed") {
          setShowPicker(false);
          return;
        }
        if (selected) {
          const minDate = minimumDate || new Date();
          const maxDate = maximumDate;

          const normalizeDate = (date: Date) => {
            const normalized = new Date(date);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
          };

          const selectedNormalized = normalizeDate(selected);
          const minDateNormalized = normalizeDate(minDate);
          const maxDateNormalized = maxDate ? normalizeDate(maxDate) : null;

          if (selectedNormalized < minDateNormalized) {
            return;
          }

          if (maxDateNormalized && selectedNormalized > maxDateNormalized) {
            return;
          }

          setSelectedDate(selected);
          onChange(formatDate(selected));
          setTimeout(() => {
            setShowPicker(false);
          }, 300);
        }
        return;
      }
      if (selected) {
        const minDate = minimumDate || new Date();
        const maxDate = maximumDate;

        const normalizeDate = (date: Date) => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };

        const selectedNormalized = normalizeDate(selected);
        const minDateNormalized = normalizeDate(minDate);
        const maxDateNormalized = maxDate ? normalizeDate(maxDate) : null;

        if (selectedNormalized < minDateNormalized) {
          return;
        }

        if (maxDateNormalized && selectedNormalized > maxDateNormalized) {
          return;
        }

        setSelectedDate(selected);
        onChange(formatDate(selected));
      }
      setShowPicker(false);
    } catch {
      setShowPicker(false);
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
        <Text style={[styles.dobText, !value && { color: "#9ca3af" }]}>
          {value || t("tour.booking.selectDate")}
        </Text>
      </Pressable>

      {showPicker && Platform.OS !== "ios" && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate || new Date()}
          maximumDate={maximumDate || undefined}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
          presentationStyle="overFullScreen"
        >
          <Pressable
            style={styles.iosDateOverlay}
            onPress={() => setShowPicker(false)}
          >
            <Pressable
              style={styles.iosDateCard}
              onPress={(e) => e.stopPropagation()}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.iosDateTitle}>
                {t("tour.booking.departureDate")}
              </Text>
              {value && (
                <Text style={styles.iosDateSelected}>
                  {formatDate(selectedDate)}
                </Text>
              )}
              <View style={styles.iosDatePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="compact"
                  onChange={(event, selected) => {
                    if (selected) {
                      setSelectedDate(selected);
                    }
                    if (event?.type === "dismissed") {
                      setShowPicker(false);
                    }
                  }}
                  minimumDate={minimumDate || new Date()}
                  maximumDate={maximumDate || undefined}
                  style={styles.iosDatePicker}
                />
              </View>
              <View style={styles.iosDateActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginRight: 8 }]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.modalCancelButtonText}>
                    {t("common.cancel") || "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    onChange(formatDate(selectedDate));
                    setTimeout(() => {
                      setShowPicker(false);
                    }, 200);
                  }}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {t("common.done") || "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

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
    try {
      if (Platform.OS === "ios") {
        if (event?.type === "dismissed") {
          setShowPicker(false);
          return;
        }
        if (selected) {
          setSelectedDate(selected);
          onChange(formatDate(selected));
          setTimeout(() => {
            setShowPicker(false);
          }, 300);
        }
        return;
      }
      if (selected) {
        setSelectedDate(selected);
        onChange(formatDate(selected));
      }
      setShowPicker(false);
    } catch {
      setShowPicker(false);
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
        <Text style={[styles.dobText, !value && { color: "#9ca3af" }]}>
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
          presentationStyle="overFullScreen"
        >
          <Pressable
            style={styles.iosDateOverlay}
            onPress={() => setShowPicker(false)}
          >
            <Pressable
              style={styles.iosDateCard}
              onPress={(e) => e.stopPropagation()}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.iosDateTitle}>
                {t("tour.booking.dateOfBirth")}
              </Text>
              {value && (
                <Text style={styles.iosDateSelected}>
                  {formatDate(selectedDate)}
                </Text>
              )}
              <View style={styles.iosDatePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="compact"
                  onChange={(event, selected) => {
                    if (selected) {
                      setSelectedDate(selected);
                    }
                    if (event?.type === "dismissed") {
                      setShowPicker(false);
                    }
                  }}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              </View>
              <View style={styles.iosDateActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginRight: 8 }]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.modalCancelButtonText}>
                    {t("common.cancel") || "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    onChange(formatDate(selectedDate));
                    setTimeout(() => {
                      setShowPicker(false);
                    }, 200);
                  }}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {t("common.done") || "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
};
