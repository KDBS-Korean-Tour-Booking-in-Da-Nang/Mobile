import api from "./api";

// =================================
// INTERFACES
// =================================

export interface SavePostRequest {
  postId: number;
  note?: string;
}

export interface SavedPostResponse {
  savedPostId: number;
  postId: number;
  postTitle: string;
  postContent: string;
  postAuthor: string;
  postAuthorAvatar: string;
  postCreatedAt: string;
  note?: string;
  savedAt: string;
}

// =================================
// SERVICE CLASS
// =================================

class SavedPostService {
  // Save a post
  async savePost(data: SavePostRequest): Promise<SavedPostResponse> {
    try {
      const response = await api.post<any>("/api/saved-posts/save", data);
      return response.data.result;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to save post");
    }
  }

  // Unsave a post
  async unsavePost(postId: number): Promise<void> {
    try {
      await api.delete(`/api/saved-posts/unsave/${postId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to unsave post");
    }
  }

  // Get the current user's saved posts
  async getMySavedPosts(): Promise<SavedPostResponse[]> {
    try {
      const response = await api.get<any>("/api/saved-posts/my-saved");
      return response.data.result;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch saved posts"
      );
    }
  }

  // Check if a post is saved by the current user
  async checkIfPostIsSaved(postId: number): Promise<boolean> {
    try {
      const response = await api.get<any>(`/api/saved-posts/check/${postId}`);
      return response.data.result;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to check saved status"
      );
    }
  }

  // Get the number of users who saved a post
  async getSavedPostCount(postId: number): Promise<number> {
    try {
      const response = await api.get<any>(`/api/saved-posts/count/${postId}`);
      return response.data.result;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to get count");
    }
  }
}

export default new SavedPostService();
