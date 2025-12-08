import api from "../../services/api";

export const transactionEndpoints = {
  getAll: () => api.get("/api/transactions"),
  getByUserId: (userId: number) => api.get(`/api/transactions/${userId}`),
  changeTransactionStatus: (orderId: string, status: string) =>
    api.put(`/api/transactions/change-status`, {
      orderId: orderId,
      status: status,
    }),
};

export default transactionEndpoints;
