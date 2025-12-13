import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  NotificationResponse,
  getNotifications,
  getUnreadCount,
} from "../../services/endpoints/notifications";
import { usePollingNotifications } from "../../hooks/usePollingNotifications";
import { useAuthContext } from "./authContext";

interface NotificationContextType {
  connected: boolean;
  unreadCount: number;
  notifications: NotificationResponse[];
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  registerCallback: (
    callback: (notification: NotificationResponse) => void
  ) => () => void;
  currentToast: NotificationResponse | null;
  setCurrentToast: (notification: NotificationResponse | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const userEmail = (user as any)?.email || (user as any)?.userEmail;
  const [connected] = useState(true); // Always "connected" when using polling
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [currentToast, setCurrentToast] = useState<NotificationResponse | null>(
    null
  );
  const callbacksRef = useRef<
    Set<(notification: NotificationResponse) => void>
  >(new Set());

  // Function to register/unregister callbacks
  const registerCallback = (
    callback: (notification: NotificationResponse) => void
  ) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  };

  // Handle new notification from polling
  const handleNewNotification = useCallback(
    (notification: NotificationResponse) => {
                  // Add to notifications list
                  setNotifications((prev) => {
                    const exists = prev.some(
                      (n) => n.notificationId === notification.notificationId
                    );
                    if (exists) {
                      return prev;
                    }
                    return [notification, ...prev];
                  });
                  // Update unread count
                  setUnreadCount((prev) => prev + 1);
                  // Show toast notification
                  setCurrentToast(notification);
                  // Notify all registered callbacks
                  callbacksRef.current.forEach((callback) => {
                    callback(notification);
                  });
    },
    []
  );

  // Use polling only for app state changes (when app comes to foreground)
  usePollingNotifications({
    onNewNotification: handleNewNotification,
    enabled: true,
  });

  // Load initial notifications and unread count
  // Only called manually when user opens notifications page
  const refreshNotifications = useCallback(async () => {
    if (!userEmail) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        getNotifications({
          page: 0,
          size: 20,
          sort: "createdAt,desc",
        }, userEmail),
        getUnreadCount(userEmail),
      ]);
      setNotifications(notificationsResponse.notifications.content);
      setUnreadCount(unreadCountResponse);
    } catch {
      // Silently handle errors (like web frontend)
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userEmail]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (!userEmail) return;
    try {
      const { markNotificationAsRead } = await import(
        "../../services/endpoints/notifications"
      );
      await markNotificationAsRead(notificationId, userEmail);
      // Optimistic update (like web frontend)
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently handle errors (like web frontend)
    }
  }, [userEmail]);

  const markAllAsRead = useCallback(async () => {
    if (!userEmail) return;
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;
    
    try {
      // Mark all notifications as read by updating each one (like web frontend)
      const { markNotificationAsRead } = await import(
        "../../services/endpoints/notifications"
      );
      await Promise.all(
        unreadNotifications.map((n) =>
          markNotificationAsRead(n.notificationId, userEmail)
        )
      );
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently handle errors (like web frontend)
    }
  }, [userEmail, notifications]);

  const value = useMemo(
    () => ({
      connected,
      unreadCount,
      notifications,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      registerCallback,
      currentToast,
      setCurrentToast,
    }),
    [
      connected,
      unreadCount,
      notifications,
      currentToast,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
};
