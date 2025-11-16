import api from "../../services/api";

export const transactionEndpoints = {
  getByUserEmail: (email: string) =>
    api.get(`/api/transactions/${encodeURIComponent(email)}`),
  changeTransactionStatus: (orderId: string, status: string) =>
    api.put(`/api/transactions/change-status`, {
      orderId: orderId,
      status: status,
    }),
};

export default transactionEndpoints;
