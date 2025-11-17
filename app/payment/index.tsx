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
import { transactionEndpoints } from "../../services/endpoints/transactions";
import { API_BASE } from "../../services/api";

interface TossPaymentParams {
  bookingId?: string;
  userEmail?: string;
  voucherCode?: string;
}

export default function TossPaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<Partial<TossPaymentParams>>();

  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paymentCreatedRef = React.useRef(false);
  const orderIdRef = React.useRef<string | null>(null);
  const transactionIdRef = React.useRef<number | null>(null);

  const { bookingId = "", userEmail = "", voucherCode = "" } = params;

  const createPayment = useCallback(async () => {
    if (paymentCreatedRef.current) {
      return;
    }

    if (!bookingId) {
      setError("Booking ID is required");
      setLoading(false);
      return;
    }

    try {
      paymentCreatedRef.current = true;
      setLoading(true);
      setError(null);

      const response = await tourEndpoints.createBookingPayment({
        bookingId: parseInt(bookingId) || 0,
        userEmail: userEmail,
        voucherCode: voucherCode || undefined,
      });

      const data = response.data || {};
      if (
        data.success &&
        data.clientKey &&
        data.customerKey &&
        data.amount != null &&
        data.orderId &&
        data.successUrl &&
        data.failUrl
      ) {
        orderIdRef.current = data.orderId || null;
        
        const txId = data.transactionId || data.transaction_id || data.id || null;
        transactionIdRef.current = txId ? Number(txId) : null;
        
        if (transactionIdRef.current) {
          console.log("TransactionId from createBookingPayment response:", transactionIdRef.current);
        } else {
          console.log("No transactionId in createBookingPayment response, will try to get from orderId later");
        }
        if (orderIdRef.current) {
          console.log("OrderId saved:", orderIdRef.current);
        }

        const amountValue =
          typeof data.amount === "string" ? data.amount : String(data.amount);
        const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Toss Payment</title>
    <script src="https://js.tosspayments.com/v2/standard"></script>
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        margin: 0; 
        padding: 16px; 
        background-color: #f5f5f5;
      }
      .wrap { 
        max-width: 720px; 
        margin: 0 auto; 
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      #payment-method {
        margin-bottom: 16px;
      }
      #agreement {
        margin-top: 16px;
      }
      #pay {
        margin-top: 24px;
        width: 100%;
        height: 52px;
        background: #007AFF;
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      #pay:hover {
        background: #0051D5;
      }
      #pay:active {
        background: #0040A8;
      }
      #pay:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h2 style="margin-top: 0; margin-bottom: 20px; color: #333;">Thanh toán Toss</h2>
      <div id="payment-method"></div>
      <div id="agreement"></div>
      <button id="pay">Thanh toán</button>
    </div>
    <script>
      (async function() {
        try {
          const clientKey = ${JSON.stringify(data.clientKey)};
          const customerKey = ${JSON.stringify(data.customerKey)};
          const orderId = ${JSON.stringify(data.orderId)};
          const successUrl = ${JSON.stringify(data.successUrl)};
          const failUrl = ${JSON.stringify(data.failUrl)};
          var amountStr = ${JSON.stringify(amountValue)};
          var amountNum = Number(amountStr);

          const tp = TossPayments(clientKey);
          const widgets = tp.widgets({ customerKey: customerKey });

          await widgets.setAmount({ currency: "KRW", value: amountNum });

          await Promise.all([
            widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
            widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
          ]);

          document.getElementById("pay").addEventListener("click", async function() {
            const btn = this;
            btn.disabled = true;
            btn.textContent = "Đang xử lý...";
            try {
              await widgets.requestPayment({
                orderId: orderId,
                orderName: "Booking payment",
                successUrl: successUrl,
                failUrl: failUrl
              });
            } catch (e) {
              btn.disabled = false;
              btn.textContent = "Thanh toán";
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: e && e.message ? e.message : "requestPayment failed" }));
            }
          });
        } catch (err) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: (err && err.message) || "Init widget failed" }));
        }
      })();
    </script>
  </body>
</html>`;
        setPaymentHtml(html);
      } else {
        setError(data.message || t("payment.createFailed"));
      }
    } catch (err: any) {
      paymentCreatedRef.current = false;
      const errorMessage =
        err?.response?.data?.message || t("payment.createFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userEmail, bookingId, voucherCode, t]);

  useEffect(() => {
    createPayment();
  }, [createPayment]);

  const handleWebViewRequest = (request: any): boolean => {
    const url = request.url;
    if (url.includes("transaction-result")) {
      try {
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get("orderId");
        const paymentMethod = urlObj.searchParams.get("paymentMethod");
        const status = urlObj.searchParams.get("status");

        router.replace({
          pathname: "/transactionResult" as any,
          params: {
            orderId: orderId || "",
            status: status || "",
            paymentMethod: paymentMethod || "TOSS",
            bookingId: bookingId,
          },
        });

        return false;
      } catch {
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
        onPress: async () => {
          try {
            if (orderIdRef.current) {
              try {
                console.log("Updating transaction status for orderId:", orderIdRef.current, "to FAILED");
                const response = await transactionEndpoints.changeTransactionStatus(
                  orderIdRef.current,
                  "FAILED"
                );
                console.log("Transaction status updated successfully:", response?.data);
                console.log("Response status:", response?.status);
              } catch (error: any) {
                console.error("========== ERROR UPDATING TRANSACTION STATUS ==========");
                console.error("Error:", error);
                console.error("Error message:", error?.message);
                console.error("Error code:", error?.code);
                if (error?.response) {
                  console.error("Error response data:", JSON.stringify(error?.response?.data, null, 2));
                  console.error("Error response status:", error?.response?.status);
                  console.error("Error response headers:", error?.response?.headers);
                } else {
                  console.error("No response from server - possible network error");
                }
                console.error("Request URL:", error?.config?.url);
                console.error("Request method:", error?.config?.method);
                console.error("Request data:", error?.config?.data);
                console.error("OrderId used:", orderIdRef.current);
                console.error("========================================================");
              }
            } else {
              console.warn("No orderId found, cannot update transaction status");
            }

            if (bookingId) {
              try {
                await tourEndpoints.changeBookingStatus(
                  parseInt(bookingId) || 0,
                  {
                    status: "BOOKING_FAILED",
                    message: "User cancelled payment",
                  }
                );
              } catch (error: any) {
                console.error("Error updating booking status:", error);
                console.error("Error response:", error?.response?.data);
              }
            }

            router.replace({
              pathname: "/transactionResult" as any,
              params: {
                orderId: orderIdRef.current || "",
                status: "FAILED",
                paymentMethod: "TOSS",
                bookingId: bookingId,
              },
            });
          } catch {
            router.back();
          }
        },
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
          <Text style={styles.headerTitle}>Thanh toán Toss</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
          <Text style={styles.headerTitle}>Payment Toss</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Lỗi</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              paymentCreatedRef.current = false;
              createPayment();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!paymentHtml) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán Toss</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Không thể tải trang thanh toán</Text>
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
        <Text style={styles.headerTitle}>Thanh toán Toss</Text>
      </View>

      <WebView
        source={{ html: paymentHtml, baseUrl: API_BASE || "" }}
        onShouldStartLoadWithRequest={handleWebViewRequest}
        style={styles.webview}
        startInLoadingState={true}
        originWhitelist={["*"]}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.webviewLoadingText}>Đang tải...</Text>
          </View>
        )}
        onError={() => {
          setError("Không thể tải trang thanh toán");
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
