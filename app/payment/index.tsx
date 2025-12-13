import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { API_BASE } from "../../services/api";
import { tourEndpoints } from "../../services/endpoints/tour";
import { transactionEndpoints } from "../../services/endpoints/transactions";

interface TossPaymentParams {
  bookingId?: string;
  userEmail?: string;
  voucherCode?: string;
  bookingStatus?: string; 
  amount?: string;
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
  const actualPaymentAmountRef = React.useRef<number | null>(null);

  const {
    bookingId = "",
    userEmail = "",
    voucherCode = "",
    bookingStatus = "",
    amount = "",
  } = params;

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

      // Determine if this is a deposit payment based on booking status
      // PENDING_DEPOSIT_PAYMENT = deposit payment (isDeposit = true)
      // PENDING_BALANCE_PAYMENT = balance payment (isDeposit = false)
      // PENDING_PAYMENT = full payment (isDeposit = true or false, doesn't matter)
      const normalizedStatus = String(bookingStatus || "").toUpperCase();
      const isDeposit =
        normalizedStatus === "PENDING_DEPOSIT_PAYMENT" ||
        normalizedStatus === "PENDING_PAYMENT";

      const requestPayload = {
        bookingId: parseInt(bookingId) || 0,
        userEmail: userEmail,
        deposit: isDeposit,
        voucherCode: voucherCode || undefined,
      };

      const response = await tourEndpoints.createBookingPayment(requestPayload);

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

        const txId =
          data.transactionId || data.transaction_id || data.id || null;
        transactionIdRef.current = txId ? Number(txId) : null;

        let amountValue: string = "0";
        let savedAmount: number | null = null;
        
        if (data.amount != null) {
          // Ưu tiên: dùng số tiền từ backend (đã được tính đúng)
          const backendAmount = typeof data.amount === "number" 
            ? data.amount 
            : Number(data.amount);
          if (!isNaN(backendAmount) && backendAmount > 0) {
            savedAmount = Math.round(backendAmount);
            amountValue = String(savedAmount);
            actualPaymentAmountRef.current = savedAmount;
          }
        }
        
        if (!savedAmount && amount && String(amount).trim().length > 0 && !isNaN(Number(amount)) && Number(amount) > 0) {
          savedAmount = Math.round(Number(amount));
          amountValue = String(savedAmount);
          actualPaymentAmountRef.current = savedAmount;
        }

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
        background-color: #F8F9FA;
      }
      .wrap { 
        max-width: 720px; 
        margin: 0 auto; 
        background: #fff;
        padding: 24px;
        border-radius: 28px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
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
        height: 56px;
        background: #B8D4E3;
        color: #fff;
        border: none;
        border-radius: 28px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(184, 212, 227, 0.3);
        letter-spacing: 0.3px;
      }
      #pay:hover {
        background: #A8C5D3;
        box-shadow: 0 4px 12px rgba(184, 212, 227, 0.4);
        transform: translateY(-1px);
      }
      #pay:active {
        background: #98B5C3;
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(184, 212, 227, 0.3);
      }
      #pay:disabled {
        background: #E0E0E0;
        color: #B0B0B0;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h2 style="margin-top: 0; margin-bottom: 20px; color: #4A5568; font-weight: 500; letter-spacing: -0.3px;">Thanh toán Toss</h2>
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
  }, [userEmail, bookingId, voucherCode, t, bookingStatus, amount]);

  useEffect(() => {
    createPayment();
  }, [createPayment]);

  const handleWebViewRequest = (request: any): boolean => {
    const url = request.url;

    // Success callback
    if (url.includes("transaction-result")) {
      try {
        const urlObj = new URL(url);
        const orderId = urlObj.searchParams.get("orderId");
        const paymentMethod = urlObj.searchParams.get("paymentMethod");
        const status = urlObj.searchParams.get("status");
        const amountParam = urlObj.searchParams.get("amount");
        
        let finalAmount = "";
        if (actualPaymentAmountRef.current !== null && actualPaymentAmountRef.current > 0) {
          finalAmount = String(Math.round(actualPaymentAmountRef.current));
        } else if (amount && String(amount).trim().length > 0 && !isNaN(Number(amount)) && Number(amount) > 0) {
          finalAmount = String(Math.round(Number(amount)));
        } else {
          if (amountParam && String(amountParam).trim().length > 0 && !isNaN(Number(amountParam)) && Number(amountParam) > 0) {
            finalAmount = String(Math.round(Number(amountParam)));
          }
        }

        router.replace({
          pathname: "/transactionResult" as any,
          params: {
            orderId: orderId || "",
            status: status || "",
            paymentMethod: paymentMethod || "TOSS",
            bookingId: bookingId,
            amount: finalAmount,
          },
        });

        return false;
      } catch {
        return true;
      }
    }

    // Fail / access-denied callbacks (e.g., change-status failUrl)
    if (
      url.includes("transactions/change-status") ||
      url.includes("status=FAILED") ||
      url.toLowerCase().includes("fail")
    ) {
      const currentOrderId = orderIdRef.current;
      const urlObj = new URL(url);
      const amountParam = urlObj.searchParams.get("amount");
      
      console.log("[PAYMENT] Fail callback - amount from URL:", {
        amountParam: amountParam || "(empty)",
        currentOrderId,
        actualPaymentAmountFromBackend: actualPaymentAmountRef.current,
      });
      // Luôn dùng số tiền từ backend response (đã được tính đúng với voucher và deposit)
      const finalAmount = actualPaymentAmountRef.current !== null && actualPaymentAmountRef.current > 0
        ? String(Math.round(actualPaymentAmountRef.current))
        : (amount && String(amount).trim().length > 0 && !isNaN(Number(amount)) && Number(amount) > 0)
        ? String(Math.round(Number(amount)))
        : "";

      router.replace({
        pathname: "/transactionResult" as any,
        params: {
          orderId: currentOrderId || "",
          status: "FAILED",
          paymentMethod: "TOSS",
          bookingId: bookingId,
          amount: finalAmount,
        },
      });
      return false;
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
            const parsedBookingId = parseInt(bookingId) || 0;
            const currentOrderId = orderIdRef.current;

            // Cố gắng update transaction status, nhưng không bắt buộc
            if (currentOrderId) {
              try {
                await transactionEndpoints.changeTransactionStatus(
                  currentOrderId,
                  "FAILED"
                );
              } catch (error: any) {
                // Bỏ qua lỗi interceptor hoặc API, không hiển thị lỗi cho user
                console.log("[PAYMENT] Could not update transaction status (user cancelled):", error?.message);
              }
            }

            // Cố gắng update booking status, nhưng không bắt buộc
            if (parsedBookingId) {
              try {
                await tourEndpoints.changeBookingStatus(parsedBookingId, {
                  status: "PENDING_DEPOSIT_PAYMENT",
                  message: "User cancelled payment",
                });
              } catch (error: any) {
                // Bỏ qua lỗi, không hiển thị lỗi cho user
                console.log("[PAYMENT] Could not update booking status (user cancelled):", error?.message);
              }
            }

            // Navigate về transactionResult với status CANCELLED thay vì FAILED
            // để phân biệt user tự cancel vs thanh toán thất bại
            router.replace({
              pathname: "/transactionResult" as any,
              params: {
                orderId: currentOrderId || "",
                status: "CANCELLED", // Dùng CANCELLED thay vì FAILED để phân biệt
                paymentMethod: "TOSS",
                bookingId: bookingId,
                amount: actualPaymentAmountRef.current !== null
                  ? String(actualPaymentAmountRef.current)
                  : amount || "",
              },
            });
          } catch (error: any) {
            // Nếu có lỗi, chỉ navigate back, không hiển thị lỗi
            console.log("[PAYMENT] Error handling back button:", error?.message);
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
    paddingBottom: 8,
    paddingTop: Platform.OS === "android" 
      ? (StatusBar.currentHeight || 0) + 8 
      : 50, // iOS safe area top padding
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    marginRight: 16,
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
    marginTop: 0, // Không cần margin top vì header đã có padding
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
