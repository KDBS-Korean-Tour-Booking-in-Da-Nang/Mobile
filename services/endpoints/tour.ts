import api from "../../services/api";

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
  createBooking: (payload: any) => api.post("/api/booking", payload),
  getBookingById: (bookingId: number) =>
    api.get(`/api/booking/id/${bookingId}`),
  getBookingsByEmail: (email: string) => api.get(`/api/booking/email/${email}`),
  getBookingsByTourId: (tourId: number) =>
    api.get(`/api/booking/tour/${tourId}`),
  getBookingSummaryByEmail: (email: string) =>
    api.get(`/api/booking/summary/email/${email}`),
  calculateBookingTotal: (bookingId: number) =>
    api.get(`/api/booking/id/${bookingId}/total`),
  createBookingPayment: (payload: any) =>
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
