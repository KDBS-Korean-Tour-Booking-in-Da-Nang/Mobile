import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { premiumEndpoints } from "../endpoints/premium";

type PremiumType = "PREMIUM" | "FREE" | undefined;

interface PremiumState {
  premiumType?: PremiumType;
  expiryDate?: string;
  loading: boolean;
  error?: string | null;
}

type PremiumAction =
  | {
      type: "SET_STATUS";
      payload: { premiumType?: PremiumType; expiryDate?: string };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: PremiumState = {
  premiumType: undefined,
  expiryDate: undefined,
  loading: false,
  error: null,
};

function premiumReducer(
  state: PremiumState,
  action: PremiumAction
): PremiumState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, ...action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface PremiumContextValue extends PremiumState {
  refreshStatus: () => Promise<void>;
  createPayment: (
    durationInMonths: number
  ) => Promise<{
    success: boolean;
    payUrl?: string;
    orderId?: string;
    message?: string;
  }>;
  completeUpgrade: (
    orderId: string
  ) => Promise<{
    success: boolean;
    message?: string;
    expiryDate?: string;
    premiumType?: string;
  }>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(
  undefined
);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(premiumReducer, initialState);

  const normalizeStatus = (raw: any) => {
    const premiumTypeRaw = raw?.premium_type || raw?.premiumType;
    const isPremiumBool =
      typeof raw?.isPremium === "boolean" ? raw.isPremium : undefined;
    const premiumType: PremiumType =
      premiumTypeRaw ||
      (isPremiumBool === true
        ? "PREMIUM"
        : isPremiumBool === false
        ? "FREE"
        : undefined);
    const expiryDate =
      raw?.premium_valid_until || raw?.premiumValidUntil || raw?.expiryDate;
    return { premiumType, expiryDate };
  };

  const refreshStatus = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await premiumEndpoints.getStatus();
      const raw = res?.data?.result || res?.data || {};
      const normalized = normalizeStatus(raw);
      dispatch({ type: "SET_STATUS", payload: normalized });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (e: any) {
      dispatch({
        type: "SET_ERROR",
        payload: e?.message || "Failed to load premium status",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createPayment = useCallback(async (durationInMonths: number) => {
    const userData = await AsyncStorage.getItem("userData");
    const user = userData ? JSON.parse(userData) : null;
    if (!user?.email) throw new Error("User not logged in");

    try {
      const res = await premiumEndpoints.createPayment({
        durationInMonths,
        userEmail: user.email,
      });
      return res.data as {
        success: boolean;
        payUrl?: string;
        orderId?: string;
        message?: string;
      };
    } catch (error: any) {
      if (
        (error?.response?.status === 400 || error?.response?.status === 404) &&
        user?.email
      ) {
        const amount = durationInMonths === 1 ? 100000 : 250000;
        const planName = durationInMonths === 1 ? "1 tháng" : "3 tháng";
        const orderInfo = `Premium ${planName} - ${user.email}`;
        const res2 = await premiumEndpoints.createPaymentViaVNPay({
          amount,
          userEmail: user.email,
          orderInfo,
          isMobile: true,
          type: "premium",
          plan: durationInMonths === 1 ? "1month" : "3months",
        });
        return res2.data as {
          success: boolean;
          payUrl?: string;
          orderId?: string;
          message?: string;
        };
      }
      throw error;
    }
  }, []);

  const completeUpgrade = useCallback(
    async (orderId: string) => {
      try {
        const statusRes = await premiumEndpoints.getPaymentStatus(orderId);
        const result = statusRes?.data?.result || statusRes?.data || {};
        const isPaymentSuccessful =
          result?.status === "SUCCESS" || result?.isPaid;
        if (!isPaymentSuccessful) {
          return {
            success: false,
            message: result?.message || "Payment not completed",
          };
        }
        await new Promise((r) => setTimeout(r, 2000));
        await new Promise((r) => setTimeout(r, 3000));
        await refreshStatus();
        return {
          success: true,
          message: "Premium upgrade completed successfully",
          expiryDate: state.expiryDate,
          premiumType: state.premiumType,
        };
      } catch (e: any) {
        return {
          success: false,
          message: e?.message || "Failed to complete premium upgrade",
        };
      }
    },
    [refreshStatus, state.expiryDate, state.premiumType]
  );

  const value = useMemo<PremiumContextValue>(
    () => ({
      premiumType: state.premiumType,
      expiryDate: state.expiryDate,
      loading: state.loading,
      error: state.error,
      refreshStatus,
      createPayment,
      completeUpgrade,
    }),
    [
      state.premiumType,
      state.expiryDate,
      state.loading,
      state.error,
      refreshStatus,
      createPayment,
      completeUpgrade,
    ]
  );

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};

export const usePremium = (): PremiumContextValue => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
};
