import api from "../../services/api";

export interface ApplyVoucherPayload {
  bookingId: number;
  voucherCode: string;
}

export const voucherEndpoints = {
  getAll: () => api.get("/api/vouchers"),
  getByCompanyId: (companyId: number) =>
    api.get(`/api/vouchers/company/${companyId}`),
  previewAllAvailable: (bookingId: number) =>
    api.get(`/api/vouchers/preview-all/${bookingId}`),
  applyVoucher: (payload: ApplyVoucherPayload) =>
    api.post("/api/vouchers/apply", payload),
};

export default voucherEndpoints;
