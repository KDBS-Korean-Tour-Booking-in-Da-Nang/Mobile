import api from "../../services/api";
import { SavePostRequest } from "../../src/types/request/savedPost.request";
import { SavedPostResponse } from "../../src/types/response/savedPost.response";

export type { SavePostRequest, SavedPostResponse };

export async function savePost(
  data: SavePostRequest,
  userEmail: string
): Promise<SavedPostResponse> {
  try {
    const response = await api.post<any>("/api/saved-posts/save", data, {
      headers: { "User-Email": userEmail },
    });
    return response.data.result;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to save post");
  }
}

export async function unsavePost(
  postId: number,
  userEmail: string
): Promise<void> {
  try {
    await api.delete(`/api/saved-posts/unsave/${postId}`, {
      headers: { "User-Email": userEmail },
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to unsave post");
  }
}

export async function getMySavedPosts(): Promise<SavedPostResponse[]> {
  try {
    const response = await api.get<any>("/api/saved-posts/my-saved");
    return response.data.result;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch saved posts"
    );
  }
}

export async function checkIfPostIsSaved(
  postId: number,
  userEmail: string
): Promise<boolean> {
  try {
    const response = await api.get<any>(`/api/saved-posts/check/${postId}`, {
      headers: { "User-Email": userEmail },
    });
    return response.data.result;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to check saved status"
    );
  }
}

export async function getSavedPostCount(postId: number): Promise<number> {
  try {
    const response = await api.get<any>(`/api/saved-posts/count/${postId}`);
    return response.data.result;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to get count");
  }
}
