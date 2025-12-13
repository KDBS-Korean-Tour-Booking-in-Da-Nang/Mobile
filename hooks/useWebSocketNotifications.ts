import { useEffect, useMemo, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE, WS_BASE } from "../services/api";
import { NotificationResponse } from "../services/endpoints/notifications";

function toHttpBase(httpBase?: string): string | undefined {
  if (!httpBase) return undefined;
  try {
    const u = new URL(httpBase);
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
}

function getWebSocketUrl(wsBase?: string, apiBase?: string): string | undefined {
  // If WS_BASE is provided, use it (convert ws:// to http:// for SockJS)
  if (wsBase) {
    try {
      const url = new URL(wsBase);
      // SockJS needs http/https, not ws/wss
      if (url.protocol === "ws:") {
        url.protocol = "http:";
      } else if (url.protocol === "wss:") {
        url.protocol = "https:";
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      // If URL parsing fails, try to convert ws:// to http:// manually
      return wsBase.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
    }
  }
  // Fallback to deriving from API_BASE
  return apiBase ? toHttpBase(apiBase) : undefined;
}

export function useWebSocketNotifications(
  onNewNotification?: (notification: NotificationResponse) => void
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const callbackRef = useRef(onNewNotification);
  const subscriptionRef = useRef<any>(null);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onNewNotification;
  }, [onNewNotification]);

  const wsUrl = useMemo(() => getWebSocketUrl(WS_BASE, API_BASE), []);

  useEffect(() => {
    const setupClient = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const userData = await AsyncStorage.getItem("userData");
        const user = userData ? JSON.parse(userData) : {};
        const email =
          user?.email || user?.userEmail || user?.emailAddress || user?.mail;

        if (!wsUrl) {
          return;
        }

        const client = new Client({
          brokerURL: undefined,
          webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
          reconnectDelay: 3000,
          debug: () => {},
          connectHeaders: {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(email && { "User-Email": email }),
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
                  if (callbackRef.current) {
                    callbackRef.current(notification);
                  }
                } catch {
                  // Silently handle parsing errors
                }
              }
            );
            subscriptionRef.current = subscription;
          },
          onStompError: (frame) => {
            setConnected(false);
          },
          onWebSocketClose: (event) => {
            setConnected(false);
          },
          onWebSocketError: (error) => {
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
  }, [wsUrl]);

  return { connected };
}

export default useWebSocketNotifications;
