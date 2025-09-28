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
import { useAuthContext } from "../contexts/authContext";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";
import { tourService } from "../services/tourService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Animation for stars
  const starAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  // Load ratings from database when component mounts
  useEffect(() => {
    const loadRatings = async () => {
      try {
        const ratings = await tourService.getTourRatings(tourId);
        setRates(ratings);

        // Check if current user has already rated this tour
        if (user?.email) {
          // Check localStorage first for quick check
          const ratedToursKey = `ratedTours_${user.email}`;
          const ratedTours = await AsyncStorage.getItem(ratedToursKey);
          const ratedToursList = ratedTours ? JSON.parse(ratedTours) : [];

          if (ratedToursList.includes(tourId)) {
            setHasUserRated(true);

            // Get the rating ID from localStorage
            const ratingIdKey = `ratingId_${user.email}_${tourId}`;
            const savedRatingId = await AsyncStorage.getItem(ratingIdKey);

            if (savedRatingId) {
              // Try to find the rating by ID
              const userRate = ratings.find(
                (rate) => rate.id === parseInt(savedRatingId)
              );
              if (userRate) {
                setUserRating(userRate);
              } else {
                // Create a dummy rating for display
                setUserRating({
                  id: parseInt(savedRatingId),
                  star: 5,
                  comment: "Đã đánh giá",
                  createdAt: new Date().toISOString(),
                  userEmail: user.email,
                });
              }
            } else {
              // Fallback: try to find by userEmail
              const userRate = ratings.find(
                (rate) => rate.userEmail === user.email
              );
              if (userRate) {
                setUserRating(userRate);
              } else {
                // Create a dummy rating for display
                setUserRating({
                  id: 0,
                  star: 5,
                  comment: "Đã đánh giá",
                  createdAt: new Date().toISOString(),
                  userEmail: user.email,
                });
              }
            }
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
  }, [tourId, user?.email]);

  const handleStarPress = (starIndex: number) => {
    const newStars = starIndex + 1;
    setStars(newStars);

    // Animate stars
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
      // Create new rate
      const newRate = await tourService.createTourRating({
        tourId,
        content: content.trim(),
        stars,
      });

      const rateWithUser = { ...newRate, userEmail: user.email };

      setRates((prev) => [rateWithUser, ...prev]);
      setHasUserRated(true);
      setUserRating(rateWithUser);
      setContent("");
      setStars(0);

      if (user?.email) {
        const ratedToursKey = `ratedTours_${user.email}`;
        const ratedTours = await AsyncStorage.getItem(ratedToursKey);
        const ratedToursList = ratedTours ? JSON.parse(ratedTours) : [];
        if (!ratedToursList.includes(tourId)) {
          ratedToursList.push(tourId);
          await AsyncStorage.setItem(
            ratedToursKey,
            JSON.stringify(ratedToursList)
          );
        }

        // Also save the rating ID for this tour
        const ratingIdKey = `ratingId_${user.email}_${tourId}`;
        await AsyncStorage.setItem(ratingIdKey, newRate.id.toString());
      }

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
      // Handle specific error cases
      if (error?.response?.status === 400) {
        // User already rated this tour
        setHasUserRated(true);
        Alert.alert(t("tour.rate.errorTitle"), "Bạn đã đánh giá tour này rồi!");
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
    // Check if this is the current user's rating by comparing with userRating state
    const isCurrentUser = userRating && rate.id === userRating.id;
    const displayName = isCurrentUser
      ? user?.username || "Bạn"
      : "Người dùng khác";

    return (
      <View key={rate.id} style={styles.rateItem}>
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
      {/* Only show form if user hasn't rated yet */}
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

      {/* Show message if user has already rated */}
      {hasUserRated && userRating && (
        <View style={styles.alreadyRatedContainer}>
          <Text style={styles.alreadyRatedText}>
            Bạn đã đánh giá tour này với {userRating.star} sao
          </Text>
        </View>
      )}

      {/* Display Rates */}
      <View style={styles.ratesContainer}>
        <Text style={styles.ratesTitle}>{t("tour.rate.reviews")}</Text>
        {rates.length > 0 ? (
          rates.map(renderRateItem)
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
