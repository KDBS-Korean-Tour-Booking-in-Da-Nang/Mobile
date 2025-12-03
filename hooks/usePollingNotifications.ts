import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotifications,
  NotificationResponse,
} from "../services/endpoints/notifications";

interface UsePollingNotificationsOptions {
  onNewNotification?: (notification: NotificationResponse) => void;
  enabled?: boolean;
}

export function usePollingNotifications(
  options: UsePollingNotificationsOptions = {}
) {
  const { onNewNotification, enabled = true } = options;

  const lastNotificationIdsRef = useRef<Set<number>>(new Set());
  const isPollingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchNotifications = useCallback(async () => {
    if (!enabled || isPollingRef.current) {
      return;
    }

    try {
      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        return;
      }

      isPollingRef.current = true;
      const response = await getNotifications({
        page: 0,
        size: 20,
        sort: "createdAt,desc",
      });

      const currentNotificationIds = new Set(
        response.notifications.content.map((n) => n.notificationId)
      );

      const newNotifications = response.notifications.content.filter(
        (notification) =>
          !lastNotificationIdsRef.current.has(notification.notificationId)
      );

      lastNotificationIdsRef.current = currentNotificationIds;

      if (onNewNotification && newNotifications.length > 0) {
        newNotifications.reverse().forEach((notification) => {
          onNewNotification(notification);
        });
      }
    } catch {
    } finally {
      isPollingRef.current = false;
    }
  }, [enabled, onNewNotification]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        fetchNotifications();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);


  return {
    refetch: fetchNotifications,
  };
}

export default usePollingNotifications;
