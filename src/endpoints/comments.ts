import api from "../services/api";

interface ApiComment {
  forumCommentId: number;
  content: string;
  imgPath?: string;
  createdAt: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
  postId: number;
  userEmail: string;
  username: string;
  userAvatar: string;
}

export interface CreateCommentRequest {
  postId: number;
  userEmail: string;
  content: string;
  image?: any;
}

function transformApiComment(
  apiComment: ApiComment,
  postId: number
): CommentResponse {
  return {
    id: apiComment.forumCommentId,
    content: apiComment.content,
    imageUrl: apiComment.imgPath,
    createdAt: apiComment.createdAt,
    postId,
    userEmail: "",
    username: "",
    userAvatar: "",
  };
}

export async function getCommentsForPost(
  postId: number
): Promise<CommentResponse[]> {
  const response = await api.get<ApiComment[]>(`/api/comments/post/${postId}`);
  return response.data.map((c) => transformApiComment(c, postId));
}

export async function createComment(
  data: CreateCommentRequest
): Promise<CommentResponse> {
  const formData = new FormData();
  formData.append("postId", data.postId.toString());
  formData.append("userEmail", data.userEmail);
  formData.append("content", data.content);
  if (data.image) {
    const uriParts = data.image.uri.split(".");
    const fileType = uriParts[uriParts.length - 1];
    formData.append("imgPath", {
      uri: data.image.uri,
      name: `comment.${fileType}`,
      type: `image/${fileType}`,
    } as any);
  }
  const response = await api.post<ApiComment>("/api/comments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return transformApiComment(response.data, data.postId);
}
