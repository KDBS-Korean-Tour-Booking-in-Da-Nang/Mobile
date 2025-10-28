import api from "../../services/api";

export interface AddReactionRequest {
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
}

export async function addReaction(
  userEmail: string,
  data: AddReactionRequest
): Promise<void> {
  await api.post("/api/reactions/add", data, {
    headers: { "User-Email": userEmail },
  });
}

export async function clearReaction(
  userEmail: string,
  targetType: "POST" | "COMMENT",
  targetId: number
): Promise<void> {
  await api.post(`/api/reactions/${targetType}/${targetId}`, null, {
    headers: { "User-Email": userEmail },
  });
}

export async function getReactionSummary(
  targetType: "POST" | "COMMENT",
  targetId: number
) {
  const response = await api.get<any>(
    `/api/reactions/${targetType}/${targetId}/summary`
  );
  return response.data;
}
