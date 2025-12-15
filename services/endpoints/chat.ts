import api from "../api";
import { ChatMessageRequest } from "../../src/types/request/chat.request";
import { ChatMessageResponse } from "../../src/types/response/chat.response";

export type { ChatMessageRequest, ChatMessageResponse };

// Get conversation between two users
export function getConversation(user1: number, user2: number) {
  return api.get(`/api/chat/conversation/${user1}/${user2}`);
}

// Get all messages from a user (all conversations)
export function getAllMessagesFromUser(userId: number) {
  return api.get(`/api/chat/all/${userId}`);
}

// Send message via REST API
export function sendMessage(body: ChatMessageRequest) {
  return api.post("/api/chat/send", body);
}

const chatEndpoints = { 
  getConversation, 
  getAllMessagesFromUser, 
  sendMessage 
};

export default chatEndpoints;
