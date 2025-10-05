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
import { colors } from "../constants/theme";
import { tourEndpoints } from "../endpoints/tour";
import { useAuthContext } from "../contexts/authContext";

interface RateTourProps {
  tourId: number;
  onRateSubmitted?: (rate: {
    id: number;
    star: number;
    comment: string;
    createdAt: string;
  }) => void;
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

const RateTour: React.FC<RateTourProps> = ({ tourId, onRateSubmitted }) => {
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
            (rate) =>
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
                size={32}
                color={index < stars ? "#FFD700" : "#E0E0E0"}
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
                  size={16}
                  color={index < rate.star ? "#FFD700" : "#E0E0E0"}
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
      {!hasUserRated && (
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
    paddingHorizontal: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  starWrapper: {
    padding: 4,
  },
  star: {
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border.light,
  },
  submitButtonText: {
    color: colors.primary.contrast,
    fontSize: 16,
    fontWeight: "600",
  },
  ratesContainer: {
    marginTop: 16,
  },
  ratesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
  },
  rateItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rateUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  rateStars: {
    flexDirection: "row",
  },
  rateContent: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  rateDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rateActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyRatesText: {
    textAlign: "center",
    color: colors.text.secondary,
    fontStyle: "italic",
    marginTop: 16,
  },
  alreadyRatedContainer: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  alreadyRatedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
});

export default RateTour;
