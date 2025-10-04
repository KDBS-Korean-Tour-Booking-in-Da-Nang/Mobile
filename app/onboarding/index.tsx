import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "../../src/navigation";
import { spacing } from "../../src/constants/theme";
import { markOnboardingCompleted } from "../../src/utils/onboardingUtils";

type Slide = {
  key: string;
  title: string;
  description: string;
  image: any;
};

const { width } = Dimensions.get("window");
const ONBOARD_BG = "#1A8EEA"; // updated per request

export default function Onboarding() {
  const { navigate } = useNavigation();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null as any);

  // Replace these with your actual assets under assets/images
  const slides: Slide[] = useMemo(
    () => [
      {
        key: "one",
        title: "Plan Your Trip",
        description:
          "Create your dream trip with ease. Choose a destination, find the perfect place to stay, and create an itinerary that suits your preferences.",
        image: require("../../assets/images/onboard1.png"),
      },
      {
        key: "two",
        title: "Get the Best Deal",
        description:
          "Save time and money by finding the best travel deals. We provide a range of exclusive promotions and discounts to make your trip more affordable.",
        image: require("../../assets/images/onboard2.png"),
      },
      {
        key: "three",
        title: "Explore Local Attractions",
        description:
          "Discover the beauty of local places you may never have visited. Experience local life and enjoy authentic experiences in each destination.",
        image: require("../../assets/images/onboard3.png"),
      },
    ],
    []
  );

  const goNext = () => {
    const next = index + 1;
    if (next < slides.length) {
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      handleGetStarted();
    }
  };

  const handleMomentumEnd = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const handleGetStarted = async () => {
    try {
      await markOnboardingCompleted();

      navigate("/auth/login/userLogin");
    } catch (error) {
      navigate("/auth/login/userLogin");
    }
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.illustrationBox}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
      <View style={[styles.card, item.key === "three" && styles.cardTight]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text
          style={[
            styles.description,
            item.key === "three" && styles.descriptionTight,
          ]}
        >
          {item.description}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={goNext}>
          <Text style={styles.primaryButtonText}>
            {index === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(it) => it.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ONBOARD_BG },
  slide: { flex: 1 },
  illustrationBox: { flex: 2, alignItems: "center", justifyContent: "center" },
  image: { width: width * 0.65, height: width * 0.65 },
  card: {
    flex: 1.4,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  cardTight: {
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 36,
    letterSpacing: 0.2,
  },
  description: {
    textAlign: "center",
    color: "#000",
    fontSize: 16,
    lineHeight: 24,
    marginHorizontal: spacing.xl,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  },
  descriptionTight: {
    marginHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: "#111",
    marginTop: spacing.xl,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "#d1d5db",
  },
  dotActive: { backgroundColor: ONBOARD_BG, width: 16 },
});
