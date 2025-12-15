export interface ApplyVoucherRequest {
  bookingId: number;
  voucherCode: string;
}

export interface AllVoucherRequest {
  tourId: number;
  adultsCount: number;
  childrenCount: number;
  babiesCount: number;
}

