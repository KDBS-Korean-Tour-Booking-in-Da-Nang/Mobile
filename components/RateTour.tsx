import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../services/endpoints/tour";
import { useAuthContext } from "../src/contexts/authContext";

interface RateTourProps {
  tourId: number;
  onRateSubmitted?: (rate: {
    id: number;
    star: number;
    comment: string;
    createdAt: string;
  }) => void;
  hasBookedTour?: boolean;
  checkingBooking?: boolean;
}

interface Rate {
  id: number;
  star: number;
  comment: string;
  createdAt: string;
  userEmail?: string;
  userId?: number;
  username?: string;
}

const RateTour: React.FC<RateTourProps> = ({
  tourId,
  onRateSubmitted,
  hasBookedTour = false,
  checkingBooking = false,
}) => {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [stars, setStars] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [userRating, setUserRating] = useState<Rate | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const { getAllUsers, getUserLiteById } = useAuthContext();

  const starAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const ratings = (await tourEndpoints.getTourRatings(tourId)).data;
        const normalized = ratings.map((r: any) => ({
          ...r,
          userId:
            r?.userId ??
            r?.user_id ??
            r?.user?.id ??
            r?.user?.userId ??
            r?.user?.user_id,
          username: r?.username ?? r?.user?.username,
          userEmail: r?.userEmail ?? r?.user_email ?? r?.user?.email,
        }));
        setRates(normalized);
        const map: Record<string, string> = {};
        try {
          const allUsers = await getAllUsers();
          allUsers.forEach((u) => {
            if (u?.id != null && u?.username)
              map[String(u.id)] = u.username as string;
          });
        } catch {}
        setUserMap(map);
        if (user) {
          const userRate = normalized.find(
            (rate: Rate) =>
              (rate.userId != null &&
                (user as any)?.userId != null &&
                String(rate.userId) === String((user as any).userId)) ||
              rate.userEmail === (user as any)?.email
          );
          if (userRate) {
            setHasUserRated(true);
            setUserRating(userRate);
          } else {
            setHasUserRated(false);
            setUserRating(null);
          }
        } else {
          setHasUserRated(false);
          setUserRating(null);
        }
      } catch {}
    };

    loadRatings();
  }, [tourId, user]);

  useEffect(() => {
    const hydrateMissingNames = async () => {
      const missing = rates
        .filter(
          (r) => !r.username && r.userId != null && !userMap[String(r.userId)]
        )
        .slice(0, 5);
      if (missing.length === 0) return;
      const updates: Record<string, string> = {};
      await Promise.all(
        missing.map(async (r) => {
          const info = await getUserLiteById(Number(r.userId));
          if (info?.username) {
            updates[String(info.id)] = info.username;
          }
        })
      );
      if (Object.keys(updates).length > 0) {
        setUserMap((prev) => ({ ...prev, ...updates }));
      }
    };
    hydrateMissingNames();
  }, [rates, userMap]);

  const handleStarPress = (starIndex: number) => {
    const newStars = starIndex + 1;
    setStars(newStars);

    starAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index < newStars ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert(t("tour.rate.errorTitle"), t("tour.rate.starsRequired"));
      return;
    }

    if (!user?.email) {
      Alert.alert(t("tour.rate.errorTitle"), t("tour.rate.loginRequired"));
      return;
    }

    if (!hasBookedTour) {
      Alert.alert(
        t("tour.rate.errorTitle"),
        t("tour.rate.bookingRequired") ||
          "Bạn cần đặt tour trước khi có thể đánh giá"
      );
      return;
    }

    if (hasUserRated) {
      Alert.alert(t("tour.rate.errorTitle"), "Bạn đã đánh giá tour này rồi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tourId", String(tourId));
      formData.append("userEmail", user?.email || "");
      formData.append("star", String(stars));
      formData.append("comment", content.trim());
      const newRate = (await tourEndpoints.createTourRating(formData)).data;

      const rateWithUser = {
        ...newRate,
        userEmail: user.email,
        userId: (user as any)?.userId,
        username: (user as any)?.username || undefined,
      };

      setRates((prev) => [rateWithUser, ...prev]);
      setHasUserRated(true);
      setUserRating(rateWithUser);
      setContent("");
      setStars(0);

      starAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });

      onRateSubmitted?.(rateWithUser);
      Alert.alert(t("tour.rate.successTitle"), t("tour.rate.successMessage"));
    } catch (error: any) {
      const backendMsg = error?.response?.data?.message;
      if (error?.response?.status === 400 && backendMsg) {
        Alert.alert(t("tour.rate.errorTitle"), backendMsg);
      } else {
        Alert.alert(t("tour.rate.errorTitle"), t("tour.rate.submitError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, index) => (
          <TouchableOpacity
            key={index}
            style={styles.starWrapper}
            onPress={() => handleStarPress(index)}
          >
            <Animated.View
              style={[
                styles.star,
                {
                  transform: [
                    {
                      scale: starAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={index < stars ? "star" : "star-outline"}
                size={28}
                color={index < stars ? "#FFD89A" : "#E0E0E0"}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRateItem = (rate: Rate) => {
    const displayName =
      rate.username || userMap[String(rate.userId ?? "")] || "Người dùng";

    return (
      <View style={styles.rateItem}>
        <View style={styles.rateHeader}>
          <Text style={styles.rateUsername}>{displayName}</Text>
          <View style={styles.rateActions}>
            <View style={styles.rateStars}>
              {Array.from({ length: 5 }, (_, index) => (
                <Ionicons
                  key={index}
                  name={index < rate.star ? "star" : "star-outline"}
                  size={14}
                  color={index < rate.star ? "#FFD89A" : "#E0E0E0"}
                />
              ))}
            </View>
          </View>
        </View>
        {rate.comment && <Text style={styles.rateContent}>{rate.comment}</Text>}
        <Text style={styles.rateDate}>
          {new Date(rate.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {checkingBooking && (
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {t("tour.rate.checkingBooking") || "Đang kiểm tra..."}
          </Text>
        </View>
      )}
      {!checkingBooking && !hasBookedTour && (
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {t("tour.rate.bookingRequired") ||
              "Bạn cần đặt tour trước khi có thể đánh giá"}
          </Text>
          <Text style={styles.bookingRequiredText}>
            {t("tour.rate.bookingRequiredMessage") ||
              "Vui lòng đặt tour này để có thể chia sẻ đánh giá của bạn."}
          </Text>
        </View>
      )}
      {!checkingBooking && hasBookedTour && !hasUserRated && (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>{t("tour.rate.title")}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("tour.rate.name")}</Text>
            <TextInput
              style={styles.input}
              value={user?.username || ""}
              editable={false}
              placeholder={t("tour.rate.namePlaceholder")}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("tour.rate.content")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder={t("tour.rate.contentPlaceholder")}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("tour.rate.rating")}</Text>
            {renderStars()}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (stars === 0 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={stars === 0 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t("tour.rate.submitting") : t("tour.rate.submit")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {hasUserRated && userRating && (
        <View style={styles.alreadyRatedContainer}>
          <Text style={styles.alreadyRatedText}>
            {t("tour.rate.alreadyRated", {
              star: userRating.star,
            })}
          </Text>
        </View>
      )}

      <View style={styles.ratesContainer}>
        <Text style={styles.ratesTitle}>{t("tour.rate.reviews")}</Text>
        {rates.length > 0 ? (
          rates.map((rate: any) => (
            <View
              key={String(
                rate.id ??
                  `${rate.userId ?? rate.userEmail ?? "u"}_${rate.createdAt}`
              )}
            >
              {renderRateItem(rate)}
            </View>
          ))
        ) : (
          <Text style={styles.emptyRatesText}>{t("tour.rate.noReviews")}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D2D2D",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D2D2D",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  input: {
    borderWidth: 0,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#2D2D2D",
    backgroundColor: "#FFF9F5",
    letterSpacing: -0.3,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  starWrapper: {
    padding: 6,
  },
  star: {
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#B5EAD7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#2C3E50",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  ratesContainer: {
    marginTop: 20,
  },
  ratesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D2D2D",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  rateItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rateUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D2D2D",
    letterSpacing: -0.3,
  },
  rateStars: {
    flexDirection: "row",
    gap: 4,
  },
  rateContent: {
    fontSize: 15,
    color: "#2D2D2D",
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  rateDate: {
    fontSize: 13,
    color: "#B8B8B8",
    letterSpacing: -0.2,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  rateActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyRatesText: {
    textAlign: "center",
    color: "#B8B8B8",
    fontStyle: "italic",
    marginTop: 20,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  alreadyRatedContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
  },
  alreadyRatedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#81C784",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  bookingRequiredText: {
    fontSize: 15,
    color: "#B8B8B8",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.3,
  },
});

export default RateTour;
