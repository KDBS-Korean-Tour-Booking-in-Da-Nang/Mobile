export interface VoucherResponse {
  voucherId: number;
  companyId: number;
  code: string;
  name: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderValue: number;
  totalQuantity: number;
  remainingQuantity: number;
  startDate: string;
  endDate: string;
  status: VoucherStatus;
  createdAt: string;
  updatedAt: string;
  tourId?: number;
  companyUsername?: string;
  tourName?: string;
  tourIds?: number[];
}

export enum VoucherDiscountType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export enum VoucherStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
}

