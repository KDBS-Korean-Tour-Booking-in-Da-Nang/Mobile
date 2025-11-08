import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { tourEndpoints } from "../../services/endpoints/tour";

interface PaymentParams {
  bookingId?: string;
  userEmail?: string;
  payUrl?: string;
  orderId?: string;
}

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<Partial<PaymentParams>>();

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    bookingId = "",
    userEmail = "",
    payUrl: directPayUrl = "",
    orderId: directOrderId = "",
  } = params;

  const createPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await tourEndpoints.createBookingPayment({
        bookingId: parseInt(bookingId) || 0,
        userEmail: userEmail,
      });

      if (response.data.success && response.data.payUrl) {
        setPaymentUrl(response.data.payUrl);
      } else {
        setError(response.data.message || t("payment.createFailed"));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t("payment.createFailed"));
    } finally {
      setLoading(false);
    }
  }, [userEmail, bookingId, directPayUrl, directOrderId, t]);

  useEffect(() => {
    createPayment();
  }, [createPayment]);

  const handleWebViewRequest = (request: any): boolean => {
    const url = request.url;

    if (
      url.includes("/transaction-result") ||
      url.includes("transaction-result")
    ) {
      try {
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get("orderId");
        const responseCode = urlObj.searchParams.get("responseCode");
        const paymentMethod = urlObj.searchParams.get("paymentMethod");

        router.replace({
          pathname: "/transactionResult",
          params: {
            orderId: orderId || directOrderId || "",
            responseCode: responseCode || "",
            paymentMethod: paymentMethod || "vnpay",
            bookingId: bookingId,
          },
        });

        return false;
      } catch (err) {
        return true;
      }
    }

    return true;
  };

  const handleBack = () => {
    Alert.alert(t("common.confirm"), t("payment.cancelConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => router.back(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payment.title")}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("payment.creating")}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payment.title")}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>{t("payment.error")}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={createPayment}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!paymentUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payment.title")}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t("payment.noUrl")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("payment.title")}</Text>
      </View>

      <WebView
        source={{ uri: paymentUrl }}
        onShouldStartLoadWithRequest={handleWebViewRequest}
        style={styles.webview}
        startInLoadingState={true}
        originWhitelist={["*"]}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.webviewLoadingText}>
              {t("payment.loading")}
            </Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(t("payment.loadFailed"));
        }}
        onHttpError={(e) => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
