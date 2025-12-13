export interface Conversation {
  id?: string;
  user1: string;
  user2: string;
  lastMessage?: string;
  updatedAt?: string;
}

export interface ChatMessageResponse {
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}