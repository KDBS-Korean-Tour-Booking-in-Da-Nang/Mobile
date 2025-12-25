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
  tourDeadline?: number;
  tourExpirationDate?: string;
  depositPercentage?: number; // Phần trăm tiền cọc (0-100)
  minAdvancedDays?: number; // Số ngày tối thiểu phải đặt trước khi khởi hành
  minGuests?: number; // Số lượng khách tối thiểu
  maxGuests?: number; // Số lượng khách tối đa
}

export interface TourContentResponse {
  tourContentTitle: string;
  tourContentDescription: string;
  images?: string[];
  dayColor?: string;
  titleAlignment?: string;
}

export enum TourStatus {
  NOT_APPROVED = "NOT_APPROVED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}
