import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MainLayout from "../../src/components/MainLayout";
import { useNavigation } from "../../src/navigation";
import { Ionicons } from "@expo/vector-icons";
import { typography } from "../../src/constants/theme";
import { useAuthContext } from "../../src/contexts/authContext";
import BookingButton from "../../src/components/BookingButton";
import { useTranslation } from "react-i18next";

export default function BuyingTour() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [adultCount, setAdultCount] = React.useState<number>(1);
  const [childrenCount, setChildrenCount] = React.useState<number>(0);
  const [babyCount, setBabyCount] = React.useState<number>(0);
  const [adultDob, setAdultDob] = React.useState<Record<number, string>>({});
  const [childrenDob, setChildrenDob] = React.useState<Record<number, string>>(
    {}
  );
  const [babyDob, setBabyDob] = React.useState<Record<number, string>>({});

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

  // Pricing data
  const [pricing] = React.useState({
    adult: 3200000,
    children: 1800000,
    baby: 900000,
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

  // Calculate total price
  const calculateTotal = () => {
    const adultTotal = adultCount * pricing.adult;
    const childrenTotal = childrenCount * pricing.children;
    const babyTotal = babyCount * pricing.baby;
    return adultTotal + childrenTotal + babyTotal;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero with overlay title/location */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
            }}
            style={styles.heroImage}
          />
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#000" />
            </View>
          </TouchableOpacity>
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayTitle}>Nui Phu Si</Text>
            <View style={styles.overlayRow}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.overlayLocation}>Da Nang</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Meta grid (same as Tour) */}
          <View style={styles.metaBox}>
            <View style={styles.metaRowContent}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>RATING</Text>
                <View style={styles.metaValueRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.metaValue}>4.5</Text>
                </View>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>TYPE</Text>
                <Text style={styles.metaValue}>Open Trip</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>ESTIMATE</Text>
                <Text style={styles.metaValue}>3D 2N</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCol}>
                <Text style={styles.metaLabelCaps}>VEHICLE</Text>
                <Text style={styles.metaValue}>Car</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.paragraph}>
            Mount Semeru or Mount Meru is a cone volcano in East Java,
            Indonesia. Mount Semeru is the highest mountain on the island of
            Java, with its peak Mahameru, 3,676 meters above sea level.
          </Text>

          {/* Contact Information form */}
          <Text style={styles.formTitle}>{t("tour.booking.contactInfo")}</Text>
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
          <Text style={styles.formTitle}>{t("tour.booking.bookingInfo")}</Text>
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
                <View key={`adult-${idx}`} style={styles.guestRow}>
                  <Text style={styles.guestIndex}>{idx + 1}</Text>
                  <TextInput
                    style={[styles.input, styles.guestInput]}
                    placeholder={t("tour.booking.fullname")}
                  />
                  <View style={styles.spacer} />
                  <DobField
                    value={adultDob[idx]}
                    onChange={(val) =>
                      setAdultDob((prev) => ({ ...prev, [idx]: val }))
                    }
                  />
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
                <View key={`child-${idx}`} style={styles.guestRow}>
                  <Text style={styles.guestIndex}>{idx + 1}</Text>
                  <TextInput
                    style={[styles.input, styles.guestInput]}
                    placeholder={t("tour.booking.fullname")}
                  />
                  <View style={styles.spacer} />
                  <DobField
                    value={childrenDob[idx]}
                    onChange={(val) =>
                      setChildrenDob((prev) => ({ ...prev, [idx]: val }))
                    }
                  />
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
                <View key={`baby-${idx}`} style={styles.guestRow}>
                  <Text style={styles.guestIndex}>{idx + 1}</Text>
                  <TextInput
                    style={[styles.input, styles.guestInput]}
                    placeholder={t("tour.booking.fullname")}
                  />
                  <View style={styles.spacer} />
                  <DobField
                    value={babyDob[idx]}
                    onChange={(val) =>
                      setBabyDob((prev) => ({ ...prev, [idx]: val }))
                    }
                  />
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
          <BookingButton onPress={() => console.log("Booking pressed")} />

          {/* Extra bottom space */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  imageWrapper: {
    position: "relative",
    margin: 12,
    marginTop: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: 260, borderRadius: 16 },
  backBtn: { position: "absolute", top: 12, left: 12 },
  backCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlay: { position: "absolute", left: 16, right: 16, bottom: 16 },
  overlayTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: "600",
    color: "#fff",
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  overlayLocation: { fontSize: typography.body2.fontSize, color: "#fff" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },

  metaBox: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#eee",
    paddingVertical: 12,
    marginBottom: 24,
  },
  metaRowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  metaCol: { flex: 1, paddingHorizontal: 8, alignItems: "center" },
  metaDivider: { width: 2, backgroundColor: "#e0e0e0", alignSelf: "stretch" },
  metaLabelCaps: {
    fontSize: typography.body2.fontSize,
    color: "#6c757d",
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: "700",
    textAlign: "center",
  },
  metaValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  paragraph: { fontSize: 13, lineHeight: 18, color: "#555", marginBottom: 24 },

  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  radioChecked: {
    backgroundColor: "#2F9E44",
    borderColor: "#2F9E44",
  },
  toggleText: { fontSize: 14, color: "#111", fontWeight: "600" },
  inputReadonly: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  updateHint: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
    fontStyle: "italic",
  },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 14, color: "#111", marginBottom: 8, fontWeight: "600" },
  input: {
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dadada",
    paddingHorizontal: 16,
  },
  noteInput: { height: 140, textAlignVertical: "top", borderRadius: 16 },
  sectionSubLabel: { fontSize: 14, color: "#111", marginBottom: 8 },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginLeft: -6,
  },
  dateCol: { flex: 1, alignItems: "center" },
  datePill: {
    width: "68%",
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#111",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  caretCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  caretCircleRight: { marginRight: -10 },
  caretInner: { fontWeight: "800", fontSize: 18 },
  counterRowWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  counterGroup: { alignItems: "center", flex: 1 },
  counterLabel: { fontSize: 18, fontWeight: "800", marginVertical: 6 },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  counterBtnLeft: { marginLeft: -10 },
  counterBtnRight: { marginRight: -10 },
  counterBtnText: { fontSize: 18, fontWeight: "700" },
  counterValue: {
    width: 28,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },

  counterHint: { fontSize: 11, color: "#6c757d", marginTop: 6 },
  counterPill: { position: "relative", width: "100%", paddingVertical: 12 },
  counterPillBox: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "70%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#111",
    borderRadius: 20,
    height: 34,
  },
  pillLineTop: {
    position: "absolute",
    left: 48,
    right: 48,
    top: 0,
    height: 1,
    backgroundColor: "#111",
    borderRadius: 2,
  },
  pillLineBottom: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 0,
    height: 1,
    backgroundColor: "#111",
    borderRadius: 2,
  },
  counterCenterValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    width: 28,
    textAlign: "center",
  },
  guestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  guestCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  guestIndex: {
    width: 20,
    textAlign: "center",
    fontWeight: "700",
    color: "#555",
    textAlignVertical: "center",
    lineHeight: 40,
  },
  spacer: { width: 8 },
  guestInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadada",
    paddingHorizontal: 10,
    marginRight: 8,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  dobInput: {
    width: 120,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadada",
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  dobText: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: "center",
    width: "100%",
    textAlign: "center",
    lineHeight: 36,
  },
  iosDateOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iosDateCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  iosDateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  iosDateActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  quickRow: { flexDirection: "row", justifyContent: "space-between" },
  quickBtn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quickText: { color: "#111", fontWeight: "600" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalButtonText: { fontWeight: "700" },

  // Total Section Styles
  totalSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  totalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 16,
  },
  totalBreakdown: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: "70%",
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    width: 60,
    textAlign: "left",
  },
  totalCount: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginLeft: 8,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    textAlign: "right",
  },
});
