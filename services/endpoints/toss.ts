import api from "../../services/api";

export const tossEndpoints = {
  // Confirm via query params (POST with params, no body)
  confirmWithQuery: (
    paymentKey: string,
    orderId: string,
    amount: number | string
  ) =>
    api.post("/api/toss/confirm", null, {
      params: {
        paymentKey,
        orderId,
        amount,
      },
    }),

  // Alternative: hit backend success endpoint directly (GET with params)
  successWithQuery: (
    paymentKey: string,
    orderId: string,
    amount: number | string
  ) =>
    api.get("/api/toss/success", {
      params: {
        paymentKey,
        orderId,
        amount,
      },
    }),
};

export default tossEndpoints;
