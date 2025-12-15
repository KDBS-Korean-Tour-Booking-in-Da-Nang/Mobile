import api from "../../services/api";
import { ArticleCommentRequest } from "../../src/types/request/articleComment.request";
import { ArticleCommentResponse } from "../../src/types/response/articleComment.response";

export const articleCommentEndpoints = {
  createComment: (request: ArticleCommentRequest) =>
    api.post<ArticleCommentResponse>("/api/article-comments", request),

  getCommentsByArticleId: (articleId: number) =>
    api.get<ArticleCommentResponse[]>(
      `/api/article-comments/article/${articleId}`
    ),

  getReplies: (commentId: number) =>
    api.get<ArticleCommentResponse[]>(
      `/api/article-comments/${commentId}/replies`
    ),

  updateComment: (commentId: number, request: ArticleCommentRequest) =>
    api.put<ArticleCommentResponse>(
      `/api/article-comments/${commentId}`,
      request
    ),

  deleteComment: (commentId: number, userEmail: string) =>
    api.delete(`/api/article-comments/${commentId}`, {
      params: { userEmail },
    }),

  getCommentById: (commentId: number) =>
    api.get<ArticleCommentResponse>(`/api/article-comments/${commentId}`),
};

export default articleCommentEndpoints;

