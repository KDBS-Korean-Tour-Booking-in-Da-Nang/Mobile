import api from "../api";

export interface ActorInfo {
  userId: number;
  username: string;
  avatar: string;
}

export interface NotificationResponse {
  notificationId: number;
  notificationType:
    | "LIKE_POST"
    | "LIKE_COMMENT"
    | "COMMENT_POST"
    | "REPLY_COMMENT"
    | "NEW_BOOKING"
    | "BOOKING_CONFIRMED"
    | "BOOKING_UPDATE_REQUEST"
    | "TOUR_APPROVED"
    | "NEW_RATING"
    | "BOOKING_REJECTED";
  title: string;
  message: string;
  targetId: number;
  targetType: string;
  isRead: boolean;
  createdAt: string;
  actor: ActorInfo;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface NotificationSummaryResponse {
  notifications: NotificationPage;
  unreadCount: number;
}

export interface GetNotificationsParams {
  isRead?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export async function getNotifications(
  params?: GetNotificationsParams
): Promise<NotificationSummaryResponse> {
  const response = await api.get<{ result: NotificationSummaryResponse }>(
    "/api/notifications",
    {
      params: {
        isRead: params?.isRead,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: params?.sort ?? "createdAt,desc",
      },
    }
  );
  return response.data.result;
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  await api.put(`/api/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put("/api/notifications/read-all");
}

export async function deleteNotification(
  notificationId: number
): Promise<void> {
  await api.delete(`/api/notifications/${notificationId}`);
}
