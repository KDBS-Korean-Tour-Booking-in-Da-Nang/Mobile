import api from "./api";

// =================================
// INTERFACES
// =================================

// Request body for adding a reaction
export interface AddReactionRequest {
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
}

// Assuming the response for a reaction might be simple, like a success message
// or the created reaction object. The docs are not specific, so we'll assume no response body for now.

// =================================
// SERVICE CLASS
// =================================

class ReactionService {
  async addReaction(
    userEmail: string,
    data: AddReactionRequest
  ): Promise<void> {
    try {
      await api.post("/api/reactions/add", data, {
        headers: { "User-Email": userEmail },
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to add reaction"
      );
    }
  }

  async clearReaction(
    userEmail: string,
    targetType: "POST" | "COMMENT",
    targetId: number
  ): Promise<void> {
    try {
      // The documentation specifies POST for deletion, which is unconventional but we will follow it.
      await api.post(`/api/reactions/${targetType}/${targetId}`, null, {
        // Sending null as body
        headers: { "User-Email": userEmail },
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to clear reaction"
      );
    }
  }

  async getReactionSummary(targetType: "POST" | "COMMENT", targetId: number) {
    try {
      // The API doc is not clear on the response shape, so using `any`
      const response = await api.get<any>(
        `/api/reactions/${targetType}/${targetId}/summary`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch reaction summary"
      );
    }
  }
}

export default new ReactionService();
