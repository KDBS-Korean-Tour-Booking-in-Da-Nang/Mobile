import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE, WS_BASE } from "../services/api";

export type IncomingChatMessage = {
  from: string;
  to: string;
  content: string;
  timestamp?: string;
};

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
  if (wsBase) {
    try {
      const url = new URL(wsBase);
      if (url.protocol === "ws:") {
        url.protocol = "http:";
      } else if (url.protocol === "wss:") {
        url.protocol = "https:";
      }
      return url.toString().replace(/\/$/, "");
    } catch {
      return wsBase.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://").replace(/\/$/, "");
    }
  }
  return apiBase ? toHttpBase(apiBase) : undefined;
}

export function useStompChat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<IncomingChatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);

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
            client.subscribe("/user/queue/messages", (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body);
                setMessages((prev) => [...prev, payload]);
              } catch {}
            });
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
      } catch {}
    };

    setupClient();
    return () => {
      setConnected(false);
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [wsUrl]);

  const send = useCallback(
    async (toName: string, content: string) => {
      const client = clientRef.current;
      if (!client || !connected) {
        return;
      }

      const userData = await AsyncStorage.getItem("userData");
      const parsed = userData ? JSON.parse(userData) : {};
      const fromUsername =
        (parsed?.username as string) || (parsed?.name as string) || "";

      if (!fromUsername) {
        return;
      }

      const body = JSON.stringify({
        senderName: fromUsername,
        receiverName: toName,
        content,
      });

      try {
        client.publish({ destination: "/app/chat.send", body });
      } catch {}
    },
    [connected]
  );

  return { connected, messages, send };
}

export default useStompChat;
