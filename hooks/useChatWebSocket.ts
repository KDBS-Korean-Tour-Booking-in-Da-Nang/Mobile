import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE, WS_BASE } from "../services/api";
import { ChatMessageRequest } from "../src/types/request/chat.request";
import { ChatMessageResponse } from "../src/types/response/chat.response";

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

export function useChatWebSocket(currentUserId: number) {
  const [connected, setConnected] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState<ChatMessageResponse[]>([]);
  const clientRef = useRef<Client | null>(null);
  const messageHandlersRef = useRef<Map<number, (message: ChatMessageResponse) => void>>(new Map());

  const wsUrl = useMemo(() => getWebSocketUrl(WS_BASE, API_BASE), []);

  useEffect(() => {
    const setupClient = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");

        if (!wsUrl) {
          console.log("ERROR: WebSocket URL is undefined!");
          return;
        }

        const client = new Client({
          brokerURL: undefined,
          webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
          reconnectDelay: 3000,
          debug: () => {},
          connectHeaders: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: () => {
            setConnected(true);
            client.subscribe(`/user/${currentUserId}/queue/messages`, (msg: IMessage) => {
              try {
                const payload: ChatMessageRequest = JSON.parse(msg.body);
                const messageResponse: ChatMessageResponse = {
                  messageId: Date.now(),
                  senderId: payload.senderId,
                  receiverId: payload.receiverId,
                  content: payload.content,
                  timestamp: new Date().toISOString(),
                };
                setIncomingMessages((prev) => [...prev, messageResponse]);
                
                const conversationKey = payload.senderId === currentUserId 
                  ? payload.receiverId 
                  : payload.senderId;
                const handler = messageHandlersRef.current.get(conversationKey);
                if (handler) {
                  handler(messageResponse);
                }
              } catch (error) {
                console.error("Error parsing WebSocket message:", error);
              }
            });
          },
          onStompError: (frame) => {
            console.error("STOMP error:", frame);
            setConnected(false);
          },
          onWebSocketClose: (event) => {
            setConnected(false);
          },
          onWebSocketError: (error) => {
            console.error("WebSocket error:", error);
            setConnected(false);
          },
        });
        clientRef.current = client;
        client.activate();
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
      }
    };

    if (currentUserId) {
      setupClient();
    }

    return () => {
      setConnected(false);
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [wsUrl, currentUserId]);

  const sendMessage = useCallback(
    async (receiverId: number, content: string) => {
      const client = clientRef.current;
      if (!client || !connected) {
        console.warn("WebSocket not connected, cannot send message");
        return false;
      }

      const message: ChatMessageRequest = {
        senderId: currentUserId,
        receiverId: receiverId,
        content: content,
      };

      try {
        client.publish({
          destination: "/app/chat.send",
          body: JSON.stringify(message),
        });
        return true;
      } catch (error) {
        console.error("Error sending message via WebSocket:", error);
        return false;
      }
    },
    [connected, currentUserId]
  );

  const subscribeToConversation = useCallback(
    (otherUserId: number, handler: (message: ChatMessageResponse) => void) => {
      messageHandlersRef.current.set(otherUserId, handler);
      return () => {
        messageHandlersRef.current.delete(otherUserId);
      };
    },
    []
  );

  return { 
    connected, 
    incomingMessages, 
    sendMessage, 
    subscribeToConversation 
  };
}

export default useChatWebSocket;

