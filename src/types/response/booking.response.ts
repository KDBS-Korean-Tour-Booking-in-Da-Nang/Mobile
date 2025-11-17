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
  status?: string;
  createdAt: string;
}

export enum BookingStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  WAITING_FOR_APPROVED = "WAITING_FOR_APPROVED",
  WAITING_FOR_UPDATE = "WAITING_FOR_UPDATE",
  BOOKING_SUCCESS = "BOOKING_SUCCESS",
  BOOKING_REJECTED = "BOOKING_REJECTED",
  BOOKING_FAILED = "BOOKING_FAILED",
}

