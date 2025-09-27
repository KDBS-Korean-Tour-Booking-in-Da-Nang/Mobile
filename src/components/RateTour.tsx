import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../contexts/authContext";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";

interface RateTourProps {
  tourId: number;
  onRateSubmitted?: (rate: {
    id: number;
    username: string;
    content: string;
    stars: number;
    createdAt: string;
  }) => void;
}

interface Rate {
  id: number;
  username: string;
  content: string;
  stars: number;
  createdAt: string;
}

const RateTour: React.FC<RateTourProps> = ({ tourId, onRateSubmitted }) => {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [stars, setStars] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState<number | null>(null);

  // Animation for stars
  const starAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

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

  const handleEditRate = (rate: Rate) => {
    setEditingRate(rate);
    setContent(rate.content);
    setStars(rate.stars);

    // Animate stars for editing
    starAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index < rate.stars ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleDeleteRate = (rateId: number) => {
    Alert.alert(t("tour.rate.errorTitle"), t("tour.rate.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          setRates((prev) => prev.filter((rate) => rate.id !== rateId));
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setContent("");
    setStars(0);

    // Reset star animations
    starAnimations.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 0,
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

    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual API
      const newRate: Rate = {
        id: Date.now(),
        username: user.username, // Use username only
        content: content.trim(),
        stars,
        createdAt: new Date().toISOString(),
      };

      if (editingRate) {
        // Update existing rate
        setRates((prev) =>
          prev.map((rate) => (rate.id === editingRate.id ? newRate : rate))
        );
        setEditingRate(null);
      } else {
        // Add new rate
        setRates((prev) => [newRate, ...prev]);
      }

      setContent("");
      setStars(0);

      // Reset star animations
      starAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });

      onRateSubmitted?.(newRate);
      Alert.alert(t("tour.rate.successTitle"), t("tour.rate.successMessage"));
    } catch {
      Alert.alert(t("tour.rate.errorTitle"), t("tour.rate.submitError"));
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

  const renderRateItem = (rate: Rate) => (
    <View key={rate.id} style={styles.rateItem}>
      <View style={styles.rateHeader}>
        <Text style={styles.rateUsername}>{rate.username}</Text>
        <View style={styles.rateActions}>
          <View style={styles.rateStars}>
            {Array.from({ length: 5 }, (_, index) => (
              <Ionicons
                key={index}
                name={index < rate.stars ? "star" : "star-outline"}
                size={16}
                color={index < rate.stars ? "#FFD700" : "#E0E0E0"}
              />
            ))}
          </View>
          <View style={styles.moreOptionsContainer}>
            <TouchableOpacity
              style={styles.moreOptionsButton}
              onPress={() =>
                setShowMoreOptions(showMoreOptions === rate.id ? null : rate.id)
              }
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            </TouchableOpacity>

            {showMoreOptions === rate.id && (
              <View style={styles.moreOptionsMenu}>
                <TouchableOpacity
                  style={styles.moreOptionsItem}
                  onPress={() => {
                    handleEditRate(rate);
                    setShowMoreOptions(null);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#007AFF" />
                  <Text style={styles.moreOptionsText}>{t("common.edit")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moreOptionsItem}
                  onPress={() => {
                    handleDeleteRate(rate.id);
                    setShowMoreOptions(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.moreOptionsText}>
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
      {rate.content && <Text style={styles.rateContent}>{rate.content}</Text>}
      <Text style={styles.rateDate}>
        {new Date(rate.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={() => setShowMoreOptions(null)}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>
              {editingRate ? t("tour.rate.editTitle") : t("tour.rate.title")}
            </Text>
            {editingRate && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
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

        {/* Display Rates */}
        <View style={styles.ratesContainer}>
          <Text style={styles.ratesTitle}>{t("tour.rate.reviews")}</Text>
          {rates.length > 0 ? (
            rates.map(renderRateItem)
          ) : (
            <Text style={styles.emptyRatesText}>
              {t("tour.rate.noReviews")}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
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
  cancelButton: {
    padding: 8,
  },
  rateActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rateButtons: {
    flexDirection: "row",
    gap: 8,
  },
  rateButton: {
    padding: 4,
  },
  emptyRatesText: {
    textAlign: "center",
    color: colors.text.secondary,
    fontStyle: "italic",
    marginTop: 16,
  },
  moreOptionsContainer: {
    position: "relative",
  },
  moreOptionsButton: {
    padding: 8,
  },
  moreOptionsMenu: {
    position: "absolute",
    top: 35,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  moreOptionsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  moreOptionsText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
});

export default RateTour;
