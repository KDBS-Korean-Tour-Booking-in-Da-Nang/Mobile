import api from "../../services/api";

export type TranslateRequest = {
  text: string;
};

export const geminiEndpoints = {
  translate: (payload: TranslateRequest) =>
    api.post<string>("/api/gemini/translate", payload),
};

export default geminiEndpoints;


