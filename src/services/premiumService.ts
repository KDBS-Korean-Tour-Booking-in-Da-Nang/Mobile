import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const premiumService = {
  createPremiumPayment: async (
    durationInMonths: number
  ): Promise<{
    success: boolean;
    payUrl?: string;
    orderId?: string;
    message?: string;
  }> => {
    const userData = await AsyncStorage.getItem("userData");
    const user = userData ? JSON.parse(userData) : null;

    if (!user?.email) {
      throw new Error("User not logged in");
    }

    const requestData = {
      durationInMonths: durationInMonths,
      userEmail: user.email,
    };

    const authToken = await AsyncStorage.getItem("authToken");
    console.log("Auth token exists:", !!authToken);

    if (!authToken) {
      throw new Error("Authentication required for premium payment");
    }

    try {
      const response = await api.post("/api/premium/payment", requestData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw new Error("Authentication failed. Please login again.");
      }

      if (
        (error?.response?.status === 400 || error?.response?.status === 404) &&
        user?.email
      ) {
        const userEmail = user.email;
        return await premiumService.createPremiumPaymentViaVNPay(
          durationInMonths,
          userEmail
        );
      }

      throw error;
    }
  },

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
    const response = await api.post("/api/vnpay/create", requestData);
    return response.data;
  },

  checkPremiumStatus: async (): Promise<{
    expiryDate?: string;
    premiumType?: string;
  }> => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get("/api/premium/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const raw = response.data.result || {};
      const premiumTypeRaw = raw.premium_type || raw.premiumType;
      const isPremiumBool =
        typeof raw.isPremium === "boolean" ? raw.isPremium : undefined;
      const premiumType =
        premiumTypeRaw ||
        (isPremiumBool === true
          ? "PREMIUM"
          : isPremiumBool === false
          ? "FREE"
          : undefined);
      const expiryDate =
        raw.premium_valid_until || raw.premiumValidUntil || raw.expiryDate;
      return {
        expiryDate,
        premiumType,
      };
    } catch (error: any) {
      throw error;
    }
  },

  checkPaymentStatus: async (
    orderId: string
  ): Promise<{
    status: string;
    isPaid: boolean;
    message?: string;
  }> => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get(`/api/premium/payment/status/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      return (
        response.data.result || {
          status: "unknown",
          isPaid: false,
          message: "No payment status found",
        }
      );
    } catch (error: any) {
      throw error;
    }
  },
  completePremiumUpgrade: async (
    orderId: string
  ): Promise<{
    success: boolean;
    message?: string;
    expiryDate?: string;
    premiumType?: string;
  }> => {
    try {
      const paymentStatus = await premiumService.checkPaymentStatus(orderId);
      const isPaymentSuccessful =
        paymentStatus.status === "SUCCESS" || paymentStatus.isPaid;

      if (isPaymentSuccessful) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const premiumStatus = await premiumService.checkPremiumStatus();
        console.log("Final Premium Status:", premiumStatus);

        return {
          success: true,
          message: "Premium upgrade completed successfully",
          expiryDate: premiumStatus?.expiryDate,
          premiumType: premiumStatus?.premiumType,
        };
      } else {
        return {
          success: false,
          message: paymentStatus.message || "Payment not completed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Failed to complete premium upgrade",
      };
    }
  },

  refreshPremiumStatus: async (): Promise<{
    expiryDate?: string;
    premiumType?: string;
  }> => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await api.get("/api/premium/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const raw = response.data.result || {};
      const premiumTypeRaw = raw.premium_type || raw.premiumType;
      const isPremiumBool =
        typeof raw.isPremium === "boolean" ? raw.isPremium : undefined;
      const premiumType =
        premiumTypeRaw ||
        (isPremiumBool === true
          ? "PREMIUM"
          : isPremiumBool === false
          ? "FREE"
          : undefined);
      const expiryDate =
        raw.premium_valid_until || raw.premiumValidUntil || raw.expiryDate;
      return {
        expiryDate,
        premiumType,
      };
    } catch (error: any) {
      throw error;
    }
  },

  updatePremiumFromPayment: async (
    orderId: string
  ): Promise<{
    success: boolean;
    message?: string;
    expiryDate?: string;
    premiumType?: string;
  }> => {
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

      return {
        success: true,
        message: "Premium status updated successfully",
        expiryDate: response.data.result?.expiryDate,
        premiumType:
          response.data.result?.premium_type ||
          response.data.result?.premiumType,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Failed to update premium status",
      };
    }
  },
};

export default premiumService;
