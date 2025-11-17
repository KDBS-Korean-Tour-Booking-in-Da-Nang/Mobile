import api from "../../services/api";

export const tossEndpoints = {
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
