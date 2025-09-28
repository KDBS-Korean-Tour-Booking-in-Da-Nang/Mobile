import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const premiumService = {
  // Create premium payment using Form-Data for VNPay integration
  createPremiumPayment: async (
    durationInMonths: number
  ): Promise<{
    success: boolean;
    payUrl?: string;
    orderId?: string;
    message?: string;
  }> => {
    // Get user email from AsyncStorage
    const userData = await AsyncStorage.getItem("userData");
    const user = userData ? JSON.parse(userData) : null;

    if (!user?.email) {
      throw new Error("User not logged in");
    }

    // Create FormData for VNPay API
    const formData = new FormData();
    formData.append("durationInMonths", durationInMonths.toString());
    formData.append("userEmail", user.email);

    console.log("=== PREMIUM PAYMENT REQUEST (VNPay) ===");
    console.log("URL:", "/api/premium/payment");
    console.log("FormData:", {
      durationInMonths: durationInMonths,
      userEmail: user.email,
    });
    console.log("User email:", user.email);

    // Check if user has auth token
    const authToken = await AsyncStorage.getItem("authToken");
    console.log("Auth token exists:", !!authToken);

    if (!authToken) {
      throw new Error("Authentication required for premium payment");
    }

    try {
      const response = await api.post("/api/premium/payment", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("=== SUCCESS RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.log("=== ERROR RESPONSE ===");
      console.log("Status:", error?.response?.status);
      console.log("Data:", error?.response?.data);
      console.log("Message:", error?.message);

      // Handle authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }

      // If the main API fails, try the fallback VNPay method
      if (
        (error?.response?.status === 400 || error?.response?.status === 404) &&
        user?.email
      ) {
        console.log("=== TRYING VNPAY FALLBACK ===");
        const userEmail = user.email; // Type narrowing
        return await premiumService.createPremiumPaymentViaVNPay(
          durationInMonths,
          userEmail
        );
      }

      throw error;
    }
  },

  // Fallback method using VNPay API
  createPremiumPaymentViaVNPay: async (
    durationInMonths: number,
    userEmail: string
  ): Promise<{
    success: boolean;
    payUrl?: string;
    orderId?: string;
    message?: string;
  }> => {
    const amount = durationInMonths === 1 ? 100000 : 250000;
    const planName = durationInMonths === 1 ? "1 tháng" : "3 tháng";
    const orderInfo = `Premium ${planName} - ${userEmail}`;

    const requestData = {
      amount: amount,
      userEmail: userEmail,
      orderInfo: orderInfo,
      isMobile: true,
      type: "premium",
      plan: durationInMonths === 1 ? "1month" : "3months",
    };

    console.log("=== VNPAY FALLBACK REQUEST ===");
    console.log("URL:", "/api/vnpay/create");
    console.log("Data:", JSON.stringify(requestData, null, 2));

    const response = await api.post("/api/vnpay/create", requestData);
    return response.data;
  },

  // Check premium status
  checkPremiumStatus: async (): Promise<{
    isPremium: boolean;
    expiryDate?: string;
  }> => {
    try {
      // Check backend premium status
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get("/api/premium/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("=== PREMIUM STATUS RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));
      return (
        response.data.result || {
          isPremium: false,
          expiryDate: undefined,
        }
      );
    } catch (error: any) {
      console.log("=== PREMIUM STATUS ERROR ===");
      console.log("Status:", error?.response?.status);
      console.log("Data:", error?.response?.data);
      console.log("Message:", error?.message);
      throw error;
    }
  },

  // Check payment status
  checkPaymentStatus: async (
    orderId: string
  ): Promise<{
    status: string;
    isPaid: boolean;
    message?: string;
  }> => {
    console.log("=== CHECKING PAYMENT STATUS ===");
    console.log("Order ID:", orderId);

    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get(`/api/premium/payment/status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("=== PAYMENT STATUS RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));
      return (
        response.data.result || {
          status: "unknown",
          isPaid: false,
          message: "No payment status found",
        }
      );
    } catch (error: any) {
      console.log("=== PAYMENT STATUS ERROR ===");
      console.log("Status:", error?.response?.status);
      console.log("Data:", error?.response?.data);
      console.log("Message:", error?.message);
      throw error;
    }
  },

  // Complete premium upgrade after successful payment
  completePremiumUpgrade: async (
    orderId: string
  ): Promise<{
    success: boolean;
    message?: string;
    isPremium?: boolean;
    expiryDate?: string;
  }> => {
    console.log("=== COMPLETING PREMIUM UPGRADE ===");
    console.log("Order ID:", orderId);

    try {
      // First check payment status
      const paymentStatus = await premiumService.checkPaymentStatus(orderId);
      console.log("Payment Status:", paymentStatus);

      // Check if payment is successful based on status
      const isPaymentSuccessful =
        paymentStatus.status === "SUCCESS" || paymentStatus.isPaid;

      if (isPaymentSuccessful) {
        // Wait a bit for backend to process the payment
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Backend should automatically update premium status after successful payment
        // Just check premium status after a delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const premiumStatus = await premiumService.checkPremiumStatus();
        console.log("Final Premium Status:", premiumStatus);

        return {
          success: true,
          message: "Premium upgrade completed successfully",
          isPremium: premiumStatus?.isPremium || false,
          expiryDate: premiumStatus?.expiryDate,
        };
      } else {
        return {
          success: false,
          message: paymentStatus.message || "Payment not completed",
        };
      }
    } catch (error: any) {
      console.log("=== PREMIUM UPGRADE ERROR ===");
      console.log("Error:", error);
      return {
        success: false,
        message: error?.message || "Failed to complete premium upgrade",
      };
    }
  },

  // Force refresh premium status (useful after payment)
  refreshPremiumStatus: async (): Promise<{
    isPremium: boolean;
    expiryDate?: string;
  }> => {
    console.log("=== REFRESHING PREMIUM STATUS ===");
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get("/api/premium/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("=== REFRESHED PREMIUM STATUS ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));
      return (
        response.data.result || {
          isPremium: false,
          expiryDate: undefined,
        }
      );
    } catch (error: any) {
      console.log("=== REFRESH PREMIUM STATUS ERROR ===");
      console.log("Error:", error);
      throw error;
    }
  },

  // Force update premium status from payment (if backend supports it)
  updatePremiumFromPayment: async (
    orderId: string
  ): Promise<{
    success: boolean;
    message?: string;
    isPremium?: boolean;
    expiryDate?: string;
  }> => {
    console.log("=== FORCE UPDATE PREMIUM FROM PAYMENT ===");
    console.log("Order ID:", orderId);

    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.post(
        `/api/premium/update-from-payment/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log("=== UPDATE PREMIUM FROM PAYMENT RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        message: "Premium status updated successfully",
        isPremium: response.data.result?.isPremium || false,
        expiryDate: response.data.result?.expiryDate,
      };
    } catch (error: any) {
      console.log("=== UPDATE PREMIUM FROM PAYMENT ERROR ===");
      console.log("Error:", error);
      return {
        success: false,
        message: error?.message || "Failed to update premium status",
      };
    }
  },

  // Manual refresh premium status with retry mechanism
  manualRefreshPremiumStatus: async (
    maxRetries: number = 3
  ): Promise<{
    isPremium: boolean;
    expiryDate?: string;
    success: boolean;
    message?: string;
  }> => {
    console.log("=== MANUAL REFRESH PREMIUM STATUS ===");

    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const premiumStatus = await premiumService.refreshPremiumStatus();
        console.log(`Manual refresh attempt ${retryCount + 1}:`, premiumStatus);

        if (premiumStatus.isPremium) {
          return {
            ...premiumStatus,
            success: true,
            message: "Premium status refreshed successfully",
          };
        }

        retryCount++;
        if (retryCount < maxRetries) {
          console.log(
            `Premium still not active, retrying in 2 seconds... (${retryCount}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(
          `Manual refresh error (attempt ${retryCount + 1}):`,
          error
        );
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    return {
      isPremium: false,
      success: false,
      message:
        "Premium status not updated after multiple attempts. Please contact support.",
    };
  },
};

export default premiumService;
