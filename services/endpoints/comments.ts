import api from "../../services/api";
import { CommentResponse } from "../../src/types/response/comment.response";
import { CreateCommentRequest } from "../../src/types/request/comment.request";

export type { CommentResponse, CreateCommentRequest };

export const commentsEndpoints = {
  getCommentsForPost: (postId: number) =>
    api.get(`/api/comments/post/${postId}`),

  createComment: (data: CreateCommentRequest) => {
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
    return api.post("/api/comments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default commentsEndpoints;
