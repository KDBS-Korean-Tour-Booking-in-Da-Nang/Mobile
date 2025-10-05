import api from "../services/api";

export const premiumEndpoints = {
  createPayment: (payload: { durationInMonths: number; userEmail: string }) =>
    api.post("/api/premium/payment", payload),

  createPaymentViaVNPay: (payload: {
    amount: number;
    userEmail: string;
    orderInfo: string;
    isMobile: boolean;
    type: string;
    plan: "1month" | "3months";
  }) => api.post("/api/vnpay/create", payload),

  getStatus: () => api.get("/api/premium/status"),

  getPaymentStatus: (orderId: string) =>
    api.get(`/api/premium/payment/status/${orderId}`),

  updateFromPayment: (orderId: string) =>
    api.post(`/api/premium/update-from-payment/${orderId}`, {}),
};

export default premiumEndpoints;
