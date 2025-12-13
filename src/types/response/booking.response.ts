export interface BookingResponse {
  bookingId: number;
  tourId: number;
  tourName: string;
  contactName: string;
  contactAddress?: string;
  contactPhone: string;
  contactEmail?: string;
  pickupPoint?: string;
  note?: string;
  departureDate: string;
  adultsCount: number;
  childrenCount: number;
  babiesCount: number;
  totalGuests: number;
  createdAt: string;
  guests: GuestResponse[];
  bookingStatus?: BookingStatus | string;
  userConfirmedCompletion?: boolean;
  companyConfirmedCompletion?: boolean;
  totalAmount?: number; // Tổng tiền booking
  depositAmount?: number; // Tiền cọc cần thanh toán
  payedAmount?: number; // Tiền đã thanh toán
  refundAmount?: number; // Số tiền hoàn lại
  refundPercentage?: number; // % hoàn lại
  cancelDate?: string;
  voucherDiscountApplied?: number; // Số tiền discount từ voucher
  depositDiscountAmount?: number; // Final deposit amount after voucher discount
  totalDiscountAmount?: number; // Total amount after voucher discount
  voucherCode?: string; // Voucher code đã apply
  voucherId?: number; // Voucher ID đã apply
}

export interface GuestResponse {
  bookingGuestId: number;
  fullName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  nationality: string;
  bookingGuestType: string;
}

export interface BookingSummaryResponse {
  bookingId: number;
  tourId?: number;
  tourName: string;
  departureDate: string;
  totalGuests: number;
  totalAmount?: number;
  depositAmount?: number; // Tiền cọc
  payedAmount?: number; // Tiền đã trả
  status?: string;
  createdAt: string;
  userConfirmedCompletion?: boolean;
}

export enum BookingStatus {
  // Payment statuses
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING_DEPOSIT_PAYMENT = "PENDING_DEPOSIT_PAYMENT",
  PENDING_BALANCE_PAYMENT = "PENDING_BALANCE_PAYMENT",

  // Approval statuses
  WAITING_FOR_APPROVED = "WAITING_FOR_APPROVED",
  BOOKING_REJECTED = "BOOKING_REJECTED",

  // Update and processing statuses
  WAITING_FOR_UPDATE = "WAITING_FOR_UPDATE",
  BOOKING_FAILED = "BOOKING_FAILED",

  // Success statuses
  BOOKING_BALANCE_SUCCESS = "BOOKING_BALANCE_SUCCESS",
  BOOKING_SUCCESS_PENDING = "BOOKING_SUCCESS_PENDING",
  BOOKING_SUCCESS_WAIT_FOR_CONFIRMED = "BOOKING_SUCCESS_WAIT_FOR_CONFIRMED",
  BOOKING_SUCCESS = "BOOKING_SUCCESS",

  // Complaint and cancellation
  BOOKING_UNDER_COMPLAINT = "BOOKING_UNDER_COMPLAINT",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
}
