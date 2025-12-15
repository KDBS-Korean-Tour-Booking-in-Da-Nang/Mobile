import api from "../../services/api";

export type TranslateRequest = {
  text: string;
};

export type ChatRequest = {
  history: string[];
  message: string;
};

export const geminiEndpoints = {
  translate: (payload: TranslateRequest) =>
    api.post<string>("/api/gemini/translate", payload),
  chat: (payload: ChatRequest) =>
    api.post<string>("/api/gemini/chat", payload),
};

export default geminiEndpoints;


