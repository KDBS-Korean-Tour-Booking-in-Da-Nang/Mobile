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
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Tour Rating APIs - using TourRatedController endpoints
  createTourRating: async (ratingData: {
    tourId: number;
    content: string;
    stars: number;
  }): Promise<{
    id: number;
    star: number;
    comment: string;
    createdAt: string;
  }> => {
    // Get user email and auth token from AsyncStorage
    const userData = await AsyncStorage.getItem("userData");
    const user = userData ? JSON.parse(userData) : null;
    const authToken = await AsyncStorage.getItem("authToken");

    const formData = new FormData();
    formData.append("tourId", ratingData.tourId.toString());
    formData.append("userEmail", user?.email || "");
    formData.append("star", ratingData.stars.toString());
    formData.append("comment", ratingData.content);

    const response = await api.post("/api/tourRated", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
    return response.data;
  },

  getTourRatings: async (
    tourId: number
  ): Promise<
    {
      id: number;
      star: number;
      comment: string;
      createdAt: string;
      userEmail?: string;
      userId?: number;
      username?: string;
    }[]
  > => {
    const authToken = await AsyncStorage.getItem("authToken");
    const response = await api.get(`/api/tourRated/tour/${tourId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return response.data;
  },

  updateTourRating: async (
    ratingId: number,
    ratingData: {
      content: string;
      stars: number;
    }
  ): Promise<{
    id: number;
    star: number;
    comment: string;
    createdAt: string;
  }> => {
    const formData = new FormData();
    formData.append("comment", ratingData.content);
    formData.append("star", ratingData.stars.toString());

    const response = await api.put(`/api/tour/rated/${ratingId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteTourRating: async (ratingId: number): Promise<void> => {
    await api.delete(`/api/tour/rated/${ratingId}`);
  },
};

export default tourService;
