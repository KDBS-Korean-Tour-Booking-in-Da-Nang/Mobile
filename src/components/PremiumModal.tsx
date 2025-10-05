import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { colors } from "../constants/theme";
import { usePremium } from "../contexts/premiumContext";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
  premiumExpiry?: string;
  onPurchase?: (plan: "1month" | "3months") => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
  visible,
  onClose,
  isPremium,
  premiumExpiry,
  onPurchase,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { createPayment } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"1month" | "3months">(
    "1month"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (value?: string): string => {
    if (!value) return "";
    try {
      let input = String(value).trim();

      if (/^\d{11,}$/.test(input)) {
        const d = new Date(Number(input));
        if (!isNaN(d.getTime())) return toDDMMYYYY(d);
      }

      const re =
        /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/;
      const m = input.match(re);
      if (m) {
        const [, y, mo, d, h, mi, s, frac = "0"] = m;
        const ms = Number(frac.slice(0, 3).padEnd(3, "0"));
        const date = new Date(
          Number(y),
          Number(mo) - 1,
          Number(d),
          Number(h),
          Number(mi),
          Number(s),
          ms
        );
        if (!isNaN(date.getTime())) return toDDMMYYYY(date);
      }

      let iso = input.replace(" ", "T");
      if (iso.includes(".")) iso = iso.replace(/\.(\d{3})\d+$/, ".$1");
      if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(iso)) iso = iso + "Z";
      const date = new Date(iso);
      if (isNaN(date.getTime())) return "";
      return toDDMMYYYY(date);
    } catch {
      return "";
    }
  };

  const toDDMMYYYY = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getDisplayExpiry = (raw?: string): string => {
    const formatted = formatDate(raw);
    if (formatted) return formatted;
    if (!raw) return "";
    const datePartMatch = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
    if (datePartMatch) {
      const [y, m, d] = datePartMatch[1].split("-");
      return `${d}/${m}/${y}`;
    }
    return String(raw);
  };

  const handlePurchase = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const durationInMonths = selectedPlan === "1month" ? 1 : 3;
      const planName = selectedPlan === "1month" ? "1 tháng" : "3 tháng";
      const amount = selectedPlan === "1month" ? "100000" : "250000";

     

      const paymentResponse = await createPayment(durationInMonths);

     
      if (paymentResponse.success && paymentResponse.payUrl) {
      
        router.push({
          pathname: "/payment" as any,
          params: {
            type: "premium",
            plan: selectedPlan,
            planName: planName,
            amount: amount,
            description: `Premium ${planName}`,
            payUrl: paymentResponse.payUrl,
            orderId: paymentResponse.orderId,
            durationInMonths: durationInMonths.toString(),
          },
        });

        onClose();
      } else {
  
        Alert.alert(
          t("premium.errorTitle"),
          paymentResponse.message || t("premium.paymentFailed")
        );
      }
    } catch (error: any) {

      let errorMessage = t("premium.paymentFailed");

      if (error?.response?.status === 400) {
        const responseData = error.response?.data;
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.includes("EMAIL_NOT_EXISTED")) {
          errorMessage = "User not found. Please check your account.";
        } else if (responseData?.includes("INVALID_PREMIUM_DURATION")) {
          errorMessage =
            "Invalid premium duration. Please select 1 or 3 months.";
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Please login to continue with premium upgrade.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(t("premium.errorTitle"), errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const premiumBenefits = [
    t("premium.benefits.unlimitedTours"),
    t("premium.benefits.prioritySupport"),
    t("premium.benefits.exclusiveContent"),
    t("premium.benefits.noAds"),
    t("premium.benefits.advancedFeatures"),
  ];

  if (isPremium) {
    // Modal for existing premium users
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("premium.title")}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.premiumStatus}>
              <Ionicons name="diamond" size={48} color="#FFD700" />
              <Text style={styles.statusTitle}>
                {t("premium.activeStatus")}
              </Text>
              <Text style={styles.statusSubtitle}>
                {t("premium.validUntil")}:{" "}
                {getDisplayExpiry(premiumExpiry) || "dd/mm/yyyy"}
              </Text>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                {t("premium.yourBenefits")}
              </Text>
              {premiumBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButtonBottom}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Modal for non-premium users
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("premium.title")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>
              {t("premium.benefitsTitle")}
            </Text>
            {premiumBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>{t("premium.choosePlan")}</Text>
            <View style={styles.plansRow}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "1month" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("1month")}
              >
                <Text style={styles.planDuration}>
                  {t("premium.plan1Month")}
                </Text>
                <Text style={styles.planPrice}>100,000 vnđ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "3months" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("3months")}
              >
                <Text style={styles.planDuration}>
                  {t("premium.plan3Months")}
                </Text>
                <Text style={styles.planPrice}>250,000 vnđ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.purchaseButton,
              isProcessing && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            <Text style={styles.purchaseButtonText}>
              {isProcessing ? t("premium.processing") : t("premium.purchase")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  premiumStatus: {
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF8F00",
    marginTop: 12,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  plansContainer: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
  },
  planCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    alignItems: "center",
  },
  planCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  planDuration: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  purchaseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  purchaseButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButtonBottom: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PremiumModal;
