export interface TourResponse {
  id: number;
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

// Booking Types
export interface BookingRequest {
  tourId: number;
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
  guests: GuestRequest[];
}

export interface GuestRequest {
  fullName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  nationality: string;
  guestType: string;
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
  guestId: number;
  fullName: string;
  birthDate: string;
  gender: string;
  idNumber: string;
  nationality: string;
  guestType: string;
}

export interface BookingPaymentRequest {
  bookingId: number;
  userEmail: string;
}

export interface BookingSummaryResponse {
  bookingId: number;
  tourName: string;
  departureDate: string;
  totalGuests: number;
  createdAt: string;
}

// VNPay Payment Types
export interface VNPayPaymentResponse {
  orderId: string;
  success: boolean;
  orderInfo: string;
  payUrl: string;
  transactionId: string;
}
