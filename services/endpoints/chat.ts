import api from "../api";
import { Conversation } from "../../src/types/response/chat.response";
import { ChatMessage } from "../../src/types/request/chat.request";

export type { Conversation, ChatMessage };

export function getConversation(user1: string, user2: string) {
  return api.get(
    `/api/chat/conversation/${encodeURIComponent(user1)}/${encodeURIComponent(
      user2
    )}`
  );
}

export function getAllConversations(userId: number) {
  return api.get(`/api/chat/all/${userId}`);
}

export function sendMessage(body: ChatMessage) {
  return api.post("/app/chat.send", body);
}

const chatEndpoints = { getConversation, getAllConversations, sendMessage };
export default chatEndpoints;
