import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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
import styles from "./style";

interface TransactionResultParams {
  orderId: string;
  status?: string;
  paymentMethod: string;
  bookingId?: string;
}

interface TransactionDetails {
  id: number;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdTime: string;
}

export default function TransactionResult() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [transaction, setTransaction] = useState<TransactionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { orderId, status, paymentMethod, bookingId } =
    params as unknown as TransactionResultParams;

  const [fetchedStatus, setFetchedStatus] = useState<string | null>(null);

  const finalStatus = status || fetchedStatus || "";
  const statusUpper = finalStatus?.toUpperCase() || "";

  const isSuccess = statusUpper === "SUCCESS";
  const isFailed = statusUpper === "FAILED";
  const isPending =
    statusUpper === "PENDING" || (!finalStatus && !isSuccess && !isFailed);

  const emailAttemptedRef = useRef(false);

  const fetchTransactionDetails = useCallback(async () => {
    try {
      setLoading(true);
      if (!orderId) {
        setLoading(false);
        return;
      }

      if (!status) {
        try {
          const response = await transactionEndpoints.getTransactionByOrderId(
            orderId
          );
          const transactionData = response.data;
          if (transactionData?.status) {
            setFetchedStatus(transactionData.status);
            setTransaction(transactionData);
          }
        } catch {}
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("payment.result.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [orderId, status, t]);

  useEffect(() => {
    if (orderId) {
      fetchTransactionDetails();
    } else {
      setLoading(false);
      if (!status) {
        setError(
          t("payment.result.fetchError") || "Unable to verify payment status"
        );
      }
    }
  }, [orderId, fetchTransactionDetails, status, t]);

  useEffect(() => {
    const handleSuccess = async () => {
      if (!isSuccess || emailAttemptedRef.current) return;
      emailAttemptedRef.current = true;

      if (bookingId) {
        try {
          await tourEndpoints.sendBookingEmail(Number(bookingId));
          return;
        } catch {}

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
        } catch {}
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
  }, [isSuccess, bookingId, orderId, t]);

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

  useEffect(() => {
    if (isPending && orderId && !loading && !finalStatus) {
      setError(
        "Payment status could not be determined. Please check your booking history."
      );
    }
  }, [isPending, orderId, loading, finalStatus]);

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
              ? t("payment.result.successMessage")
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
            <Text style={styles.detailValue}>{paymentMethod || "TOSS"}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("payment.result.status")}</Text>
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {finalStatus || t("common.na")}
            </Text>
          </View>

          {transaction && transaction.amount && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("payment.result.amount")}
              </Text>
              <Text style={styles.detailValue}>
                {transaction.amount.toLocaleString()} VND
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {isSuccess && bookingId && (
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
