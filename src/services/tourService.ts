import api from "./api";
import {
  TourResponse,
  TourRequest,
  BookingRequest,
  BookingResponse,
  BookingPaymentRequest,
  BookingSummaryResponse,
  VNPayPaymentResponse,
} from "../types/tour";

export const tourService = {
  // Get all tours
  getAllTours: async (): Promise<TourResponse[]> => {
    const response = await api.get("/api/tour");
    return response.data;
  },

  // Get tour by ID
  getTourById: async (id: number): Promise<TourResponse> => {
    const response = await api.get(`/api/tour/${id}`);
    return response.data;
  },

  // Create tour (for companies)
  createTour: async (
    tourData: TourRequest,
    tourImage: any
  ): Promise<TourResponse> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(tourData));
    formData.append("tourImage", tourImage);

    const response = await api.post("/api/tour/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update tour (for companies)
  updateTour: async (
    id: number,
    tourData: TourRequest,
    tourImage?: any
  ): Promise<TourResponse> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(tourData));
    if (tourImage) {
      formData.append("tourImg", tourImage);
    }

    const response = await api.put(`/api/tour/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete tour (for companies)
  deleteTour: async (id: number): Promise<void> => {
    await api.delete(`/api/tour/${id}`);
  },

  // Upload tour content image
  uploadContentImage: async (file: any): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/tour/content-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Search tours
  searchTours: async (params: {
    keyword?: string;
    tourType?: string;
    minPrice?: number;
    maxPrice?: number;
    departurePoint?: string;
    page?: number;
    size?: number;
  }): Promise<{
    content: TourResponse[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> => {
    const response = await api.get("/api/tour/search", { params });
    return response.data;
  },

  // Booking APIs
  createBooking: async (
    bookingData: BookingRequest
  ): Promise<BookingResponse> => {
    const response = await api.post("/api/booking", bookingData);
    return response.data;
  },

  getBookingById: async (bookingId: number): Promise<BookingResponse> => {
    const response = await api.get(`/api/booking/id/${bookingId}`);
    return response.data;
  },

  getBookingsByEmail: async (email: string): Promise<BookingResponse[]> => {
    const response = await api.get(`/api/booking/email/${email}`);
    return response.data;
  },

  getBookingsByTourId: async (tourId: number): Promise<BookingResponse[]> => {
    const response = await api.get(`/api/booking/tour/${tourId}`);
    return response.data;
  },

  getBookingSummaryByEmail: async (
    email: string
  ): Promise<BookingSummaryResponse[]> => {
    const response = await api.get(`/api/booking/summary/email/${email}`);
    return response.data;
  },

  calculateBookingTotal: async (
    bookingId: number
  ): Promise<{ totalAmount: number }> => {
    const response = await api.get(`/api/booking/id/${bookingId}/total`);
    return response.data;
  },

  createBookingPayment: async (
    paymentData: BookingPaymentRequest
  ): Promise<VNPayPaymentResponse> => {
    const response = await api.post("/api/booking/payment", paymentData);
    return response.data;
  },

  sendBookingEmail: async (
    bookingId: number
  ): Promise<{ success: string; message: string }> => {
    const response = await api.post(`/api/booking/id/${bookingId}/send-email`);
    return response.data;
  },
};

export default tourService;
