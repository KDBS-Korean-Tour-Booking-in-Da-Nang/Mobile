import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MailComposer from "expo-mail-composer";
import { transactionEndpoints } from "../../services/endpoints/transactions";
import { tourEndpoints } from "../../services/endpoints/tour";
import { usePremium } from "../../src/contexts/premiumContext";

interface TransactionResultParams {
  orderId: string;
  responseCode: string;
  paymentMethod: string;
  bookingId?: string;
  type?: "booking" | "premium";
  plan?: "1month" | "3months";
  durationInMonths?: string;
}

interface TransactionDetails {
  id: number;
  transactionId: string;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  orderInfo: string;
  bankCode: string;
  payType: string;
  responseTime: string;
  resultCode: number;
  message: string;
  createdTime: string;
}

export default function TransactionResult() {
  const { completeUpgrade, refreshStatus } = usePremium();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [transaction, setTransaction] = useState<TransactionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<{
    expiryDate?: string;
    premiumType?: string;
  } | null>(null);

  const {
    orderId,
    responseCode,
    paymentMethod,
    bookingId,
    type = "booking",
  } = params as unknown as TransactionResultParams;

  const isSuccess = responseCode === "00";
  const isFailed = responseCode && responseCode !== "00";
  const emailAttemptedRef = useRef(false);

  const fetchTransactionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionEndpoints.getVnpayTransaction(orderId);
      setTransaction(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t("payment.result.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    if (orderId) {
      fetchTransactionDetails();
    } else {
      setLoading(false);
    }
  }, [orderId, fetchTransactionDetails]);

  useEffect(() => {
    const handleSuccess = async () => {
      if (!isSuccess || emailAttemptedRef.current) return;
      emailAttemptedRef.current = true;

      if (type === "premium" && orderId) {
        try {
          const upgradeResult = await completeUpgrade(orderId);

          if (upgradeResult.success) {
            setPremiumStatus({
              expiryDate: upgradeResult.expiryDate,
              premiumType: upgradeResult.premiumType,
            });
          }
        } catch (error) {
          try {
            await refreshStatus();
          } catch {}
        }
        return;
      }

      if (bookingId) {
        try {
          await tourEndpoints.sendBookingEmail(Number(bookingId));
          return;
        } catch (e) {
        }

        try {
          const available = await MailComposer.isAvailableAsync();
          if (!available) {
            return;
          }
          const subject = `${t("payment.result.details")} - #${bookingId}`;
          const body = `${t("payment.result.successMessage")}\n${t(
            "payment.result.orderId"
          )}: ${orderId || "-"}`;
          await MailComposer.composeAsync({ subject, body });
        } catch (e) {
        }
      }

      try {
        const userDataRaw = await AsyncStorage.getItem("userData");
        const user = userDataRaw ? JSON.parse(userDataRaw) : null;
        const email = (user?.email || user?.userEmail || "").toLowerCase();
        if (email) {
          const keys = await AsyncStorage.getAllKeys();
          const prefix = `pendingBooking:${email}:`;
          const toRemove = keys.filter((k) => k.startsWith(prefix));
          if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
        }
      } catch {}
    };

    handleSuccess();
  }, [isSuccess, bookingId, orderId, type, t, completeUpgrade, refreshStatus]);

  const getStatusIcon = () => {
    if (isSuccess) {
      return <Ionicons name="checkmark-circle" size={80} color="#34C759" />;
    } else if (isFailed) {
      return <Ionicons name="close-circle" size={80} color="#FF3B30" />;
    }
    return <Ionicons name="time" size={80} color="#FF9500" />;
  };

  const getStatusText = () => {
    if (isSuccess) {
      return t("payment.result.success");
    } else if (isFailed) {
      return t("payment.result.failed");
    }
    return t("payment.result.pending");
  };

  const getStatusColor = () => {
    if (isSuccess) return "#34C759";
    if (isFailed) return "#FF3B30";
    return "#FF9500";
  };

  const handleGoHome = () => {
    router.replace("/home");
  };

  const handleViewBooking = () => {
    router.push("/tour/historyBooking");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("payment.result.loading")}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          <Text style={styles.statusSubtext}>
            {isSuccess
              ? type === "premium"
                ? premiumStatus?.premiumType === "PREMIUM"
                  ? `Premium upgrade successful! Valid until: ${
                      premiumStatus.expiryDate || "N/A"
                    }`
                  : t("payment.result.premiumSuccessMessage")
                : t("payment.result.successMessage")
              : isFailed
              ? t("payment.result.failedMessage")
              : t("payment.result.pendingMessage")}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>{t("payment.result.details")}</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {t("payment.result.orderId")}
            </Text>
            <Text style={styles.detailValue}>{orderId}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {t("payment.result.bookingId")}
            </Text>
            <Text style={styles.detailValue}>
              {bookingId || t("common.na")}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {t("payment.result.paymentMethod")}
            </Text>
            <Text style={styles.detailValue}>
              {paymentMethod === "vnpay" ? "VNPay" : paymentMethod}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {t("payment.result.responseCode")}
            </Text>
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {responseCode}
            </Text>
          </View>

          {transaction && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  {t("payment.result.amount")}
                </Text>
                <Text style={styles.detailValue}>
                  {transaction.amount?.toLocaleString()} VND
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  {t("payment.result.status")}
                </Text>
                <Text style={[styles.detailValue, { color: getStatusColor() }]}>
                  {transaction.status}
                </Text>
              </View>

              {transaction.bankCode && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t("payment.result.bankCode")}
                  </Text>
                  <Text style={styles.detailValue}>{transaction.bankCode}</Text>
                </View>
              )}

              {transaction.responseTime && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {t("payment.result.responseTime")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {transaction.responseTime}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {isSuccess &&
            type === "premium" &&
            premiumStatus?.premiumType === "PREMIUM" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoHome}
              >
                <Ionicons name="diamond" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  Enjoy Premium Features
                </Text>
              </TouchableOpacity>
            )}

          {isSuccess && bookingId && type === "booking" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewBooking}
            >
              <Ionicons name="receipt" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t("payment.result.viewBooking")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Ionicons name="home" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>
              {t("payment.result.goHome")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 24,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    flex: 1,
    textAlign: "right",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#FF3B30",
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#34C759",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
