import api from "../../services/api";
import {
  BookingRequest,
  BookingPaymentRequest,
  ChangeBookingStatusRequest,
} from "../../src/types/request/booking.request";

export const tourEndpoints = {
  getAll: () => api.get("/api/tour"),
  getById: (id: number) => api.get(`/api/tour/${id}`),
  create: (formData: FormData) =>
    api.post("/api/tour/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, formData: FormData) =>
    api.put(`/api/tour/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/api/tour/${id}`),
  uploadContentImage: (formData: FormData) =>
    api.post("/api/tour/content-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  search: (params: Record<string, any>) =>
    api.get("/api/tour/search", { params }),
  createBooking: (payload: BookingRequest) => api.post("/api/booking", payload),
  getBookingById: (bookingId: number) =>
    api.get(`/api/booking/id/${bookingId}`),
  updateBooking: (bookingId: number, payload: BookingRequest) =>
    api.put(`/api/booking/${bookingId}`, payload),
  changeBookingStatus: (
    bookingId: number,
    payload: ChangeBookingStatusRequest
  ) => api.put(`/api/booking/change-status/${bookingId}`, payload),
  getBookingsByEmail: (email: string) =>
    api.get(`/api/booking/email/${encodeURIComponent(email)}`),
  getBookingsByTourId: (tourId: number) =>
    api.get(`/api/booking/tour/${tourId}`),
  getBookingSummaryByEmail: (email: string) =>
    api.get(`/api/booking/summary/email/${encodeURIComponent(email)}`),
  calculateBookingTotal: (bookingId: number) =>
    api.get(`/api/booking/id/${bookingId}/total`),
  createBookingPayment: (payload: BookingPaymentRequest) =>
    api.post("/api/booking/payment", payload),
  sendBookingEmail: (bookingId: number) =>
    api.post(`/api/booking/id/${bookingId}/send-email`),
  createTourRating: (formData: FormData) =>
    api.post("/api/tourRated", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getTourRatings: (tourId: number) => api.get(`/api/tourRated/tour/${tourId}`),
  updateTourRating: (ratingId: number, formData: FormData) =>
    api.put(`/api/tour/rated/${ratingId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteTourRating: (ratingId: number) =>
    api.delete(`/api/tour/rated/${ratingId}`),
};

export default tourEndpoints;
