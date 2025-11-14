export interface TourResponse {
  id: number;
  companyId?: number;
  tourName: string;
  tourDescription: string;
  tourImgPath: string;
  tourDuration: string;
  tourDeparturePoint: string;
  tourVehicle: string;
  tourType: string;
  tourSchedule: string;
  amount: number;
  adultPrice: number;
  childrenPrice: number;
  babyPrice: number;
  tourStatus: TourStatus;
  createdAt: string;
  contents: TourContentResponse[];
  tourDeadline?: number; // Số ngày tối thiểu từ ngày hiện tại đến ngày có thể đặt tour
  tourExpirationDate?: string; // Hạn cuối có thể đặt tour (format: YYYY-MM-DD)
}

export interface TourContentResponse {
  tourContentTitle: string;
  tourContentDescription: string;
  images?: string[];
  dayColor?: string;
  titleAlignment?: string;
}

export interface TourRequest {
  companyEmail: string;
  tourName: string;
  tourDescription?: string;
  tourDuration?: string;
  tourDeparturePoint?: string;
  tourVehicle?: string;
  tourType?: string;
  tourSchedule?: string;
  amount?: number;
  adultPrice?: number;
  childrenPrice?: number;
  babyPrice?: number;
  contents?: TourContentRequest[];
}

export interface TourContentRequest {
  tourContentTitle: string;
  tourContentDescription: string;
  images?: string[];
}

export enum TourStatus {
  NOT_APPROVED = "NOT_APPROVED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export interface GuestInfo {
  fullName: string;
  birthDate?: string;
  gender: string;
  nationality: string;
  idNumber: string;
}

export interface BookingRequest {
  tourId: number;
  userEmail: string;
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
  bookingGuestRequests: BookingGuestRequest[];
}

export interface BookingGuestRequest {
  fullName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  nationality: string;
  bookingGuestType: string;
}

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

export interface BookingPaymentRequest {
  bookingId: number;
  userEmail: string;
}

export interface BookingSummaryResponse {
  bookingId: number;
  tourId?: number;
  tourName: string;
  departureDate: string;
  totalGuests: number;
  totalAmount?: number;
  status?: string;
  createdAt: string;
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
