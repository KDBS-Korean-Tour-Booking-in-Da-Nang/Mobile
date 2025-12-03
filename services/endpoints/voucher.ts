import api from "../../services/api";
import { ApplyVoucherRequest } from "../../src/types/request/voucher.request";

export const voucherEndpoints = {
  getAll: () => api.get("/api/vouchers"),
  getByCompanyId: (companyId: number) =>
    api.get(`/api/vouchers/company/${companyId}`),
  getByTourId: (tourId: number) => api.get(`/api/vouchers/${tourId}`),
  previewAllAvailable: (bookingId: number) =>
    api.get(`/api/vouchers/preview-all/${bookingId}`),
  applyVoucher: (payload: ApplyVoucherRequest) =>
    api.post("/api/vouchers/apply", payload),
};

export default voucherEndpoints;
