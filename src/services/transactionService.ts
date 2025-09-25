import api from "./api";

export interface TransactionResponse {
  id: number;
  transactionId: string;
  orderId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | string;
  paymentMethod?: string;
  orderInfo?: string;
  bankCode?: string;
  payType?: string;
  responseTime?: string;
  resultCode?: number;
  message?: string;
  payUrl?: string;
  createdTime?: string;
  updatedTime?: string;
}

export const transactionService = {
  getByUserEmail: async (email: string): Promise<TransactionResponse[]> => {
    const res = await api.get(`/api/transactions/${encodeURIComponent(email)}`);
    return res.data;
  },
};

export default transactionService;
