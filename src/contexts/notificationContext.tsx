import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../services/api";
import {
  NotificationResponse,
  getNotifications,
} from "../../services/endpoints/notifications";

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

function toHttpBase(httpBase?: string): string | undefined {
  if (!httpBase) return undefined;
  try {
    const u = new URL(httpBase);
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [currentToast, setCurrentToast] = useState<NotificationResponse | null>(
    null
  );
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);
  const callbacksRef = useRef<
    Set<(notification: NotificationResponse) => void>
  >(new Set());

  const httpBase = useMemo(() => toHttpBase(API_BASE), []);

  // Function to register/unregister callbacks
  const registerCallback = (
    callback: (notification: NotificationResponse) => void
  ) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  };

  // Setup WebSocket connection
  useEffect(() => {
    const setupClient = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userData = await AsyncStorage.getItem("userData");
        const user = userData ? JSON.parse(userData) : {};
        const email =
          user?.email || user?.userEmail || user?.emailAddress || user?.mail;

        if (!httpBase || !token || !email) {
          return;
        }

        const client = new Client({
          brokerURL: undefined,
          webSocketFactory: () => new SockJS(`${httpBase}/ws`),
          reconnectDelay: 3000,
          debug: () => {},
          connectHeaders: {
            Authorization: `Bearer ${token}`,
            "User-Email": email,
          },
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: () => {
            setConnected(true);
            // Subscribe to notifications topic
            const subscription = client.subscribe(
              "/user/queue/notifications",
              (msg: IMessage) => {
                try {
                  const notification: NotificationResponse = JSON.parse(
                    msg.body
                  );
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
                } catch {
                  // Silently handle parsing errors
                }
              }
            );
            subscriptionRef.current = subscription;
          },
          onStompError: () => {
            setConnected(false);
          },
          onWebSocketClose: () => {
            setConnected(false);
          },
          onWebSocketError: () => {
            setConnected(false);
          },
        });
        clientRef.current = client;
        client.activate();
      } catch {
        // Silently handle setup errors
      }
    };

    setupClient();
    return () => {
      setConnected(false);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [httpBase]);

  // Load initial notifications
  const refreshNotifications = useCallback(async () => {
    try {
      const response = await getNotifications({
        page: 0,
        size: 20,
        sort: "createdAt,desc",
      });
      setNotifications(response.notifications.content);
      setUnreadCount(response.unreadCount);
    } catch {
      // Silently handle errors
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const { markNotificationAsRead } = await import(
        "../../services/endpoints/notifications"
      );
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently handle errors
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { markAllNotificationsAsRead } = await import(
        "../../services/endpoints/notifications"
      );
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently handle errors
    }
  }, []);

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
