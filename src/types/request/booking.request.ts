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

export interface BookingPaymentRequest {
  bookingId: number;
  userEmail: string;
  deposit: boolean; // required by backend (primitive boolean)
  voucherCode?: string;
}

export interface ChangeBookingStatusRequest {
  status: string;
  message?: string;
}

