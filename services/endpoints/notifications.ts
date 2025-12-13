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
    | "BOOKING_UPDATED_BY_USER"
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
  params?: GetNotificationsParams,
  userEmail?: string
): Promise<NotificationSummaryResponse> {
  const queryParams: any = {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
    sort: params?.sort ?? "createdAt,desc",
  };
  
  // Only include isRead param if it's explicitly set (not undefined)
  // This ensures "all" tab gets all notifications (read + unread)
  if (params?.isRead !== undefined) {
    queryParams.isRead = params.isRead;
  }
  
  const headers: any = {};
  if (userEmail) {
    headers["User-Email"] = userEmail;
  }
  
  const response = await api.get<NotificationSummaryResponse>(
    "/api/notifications",
    {
      params: queryParams,
      headers,
    }
  );
  return response.data;
}

export async function markNotificationAsRead(
  notificationId: number,
  userEmail?: string
): Promise<void> {
  const headers: any = {};
  if (userEmail) {
    headers["User-Email"] = userEmail;
  }
  await api.patch(`/api/notifications/${notificationId}/read`, undefined, {
    headers,
  });
}

export async function getUnreadCount(userEmail?: string): Promise<number> {
  const headers: any = {};
  if (userEmail) {
    headers["User-Email"] = userEmail;
  }
  const response = await api.get<number>("/api/notifications/unread-count", {
    headers,
  });
  return response.data;
}

export async function deleteNotification(
  notificationId: number,
  userEmail?: string
): Promise<void> {
  const headers: any = {};
  if (userEmail) {
    headers["User-Email"] = userEmail;
  }
  await api.delete(`/api/notifications/${notificationId}`, {
    headers,
  });
}
