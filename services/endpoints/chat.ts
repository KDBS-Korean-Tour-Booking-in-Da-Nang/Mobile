import api from "../api";

export type Conversation = {
  id?: string;
  user1: string;
  user2: string;
  lastMessage?: string;
  updatedAt?: string;
};

export type ChatMessage = {
  from: string;
  to: string;
  content: string;
  timestamp?: string;
};

export function getConversation(user1: string, user2: string) {
  return api.get(
    `/api/chat/conversation/${encodeURIComponent(user1)}/${encodeURIComponent(
      user2
    )}`
  );
}

export function getAllConversations(username: string) {
  return api.get(`/api/chat/all/${encodeURIComponent(username)}`);
}

export function sendMessage(body: ChatMessage) {
  return api.post("/app/chat.send", body);
}

const chatEndpoints = { getConversation, getAllConversations, sendMessage };
export default chatEndpoints;

