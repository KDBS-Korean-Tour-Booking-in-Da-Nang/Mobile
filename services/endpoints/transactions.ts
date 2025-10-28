import api from "../../services/api";

export const transactionEndpoints = {
  getByUserEmail: (email: string) =>
    api.get(`/api/transactions/${encodeURIComponent(email)}`),
  getVnpayTransaction: (orderId: string) =>
    api.get(`/api/vnpay/transaction/${orderId}`),
};

export default transactionEndpoints;
