import api from "../../services/api";
import {
  PostResponse,
  ReactionResponse,
  ReactionSummaryResponse,
} from "../../src/types/response/forum.response";
import {
  CreatePostRequest,
  UpdatePostRequest,
  SearchParams,
  ReactionRequest,
  SavePostRequest,
} from "../../src/types/request/forum.request";
import {
  ForumCommentResponse,
  CommentReactionSummary,
} from "../../src/types/response/comment.response";
import { CommentRequest } from "../../src/types/request/comment.request";
import { SavedPostResponse } from "../../src/types/response/savedPost.response";
import { ReportResponse } from "../../src/types/response/report.response";
import { CreateReportRequest } from "../../src/types/request/report.request";

export type { PostResponse, ReactionResponse, ReactionSummaryResponse };
export type {
  CreatePostRequest,
  UpdatePostRequest,
  SearchParams,
  ReactionRequest,
  SavePostRequest,
};
export type { ForumCommentResponse, CommentReactionSummary };
export type { CommentRequest };
export type { SavedPostResponse };
export type { ReportResponse };
export type { CreateReportRequest as ReportRequest };

export const forumEndpoints = {
  getAllPosts: () => api.get("/api/posts"),

  getPostById: (id: number) => api.get(`/api/posts/${id}`),

  createPost: (formData: FormData) =>
    api.post("/api/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updatePost: (id: number, formData: FormData) =>
    api.put(`/api/posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deletePost: (id: number, userEmail: string) =>
    api.delete(`/api/posts/${id}`, {
      params: { userEmail },
      headers: { "User-Email": userEmail },
    }),

  searchPosts: (params: SearchParams) =>
    api.get("/api/posts/search", { params }),

  addReaction: (data: ReactionRequest, userEmail?: string) =>
    api.post(
      "/api/reactions/add",
      { ...data, userEmail },
      {
        params: userEmail ? { userEmail } : undefined,
      }
    ),

  removeReaction: (
    targetId: number,
    targetType: "POST" | "COMMENT",
    userEmail?: string,
    reactionType: "LIKE" | "DISLIKE" = "LIKE"
  ) =>
    api.post(
      "/api/reactions/delete",
      {
        targetId,
        targetType,
        reactionType,
        userEmail,
      },
      {
        params: userEmail ? { userEmail } : undefined,
      }
    ),

  getReactionSummary: (
    targetId: number,
    targetType: "POST" | "COMMENT",
    userEmail?: string
  ) =>
    api.get(`/api/reactions/${targetType.toLowerCase()}/${targetId}/summary`, {
      params: userEmail ? { userEmail } : undefined,
    }),

  createComment: (data: CommentRequest) =>
    api.post("/api/comments", data, {
      params: { userEmail: data.userEmail },
    }),

  replyToComment: (data: CommentRequest & { parentCommentId: number }) =>
    api.post("/api/comments", data),

  updateComment: (id: number, data: CommentRequest) =>
    api.put(`/api/comments/${id}`, data),

  deleteComment: (id: number, userEmail: string) =>
    api.delete(`/api/comments/${id}`, { params: { userEmail } }),

  getCommentsByPost: (postId: number, userEmail?: string) =>
    api.get(`/api/comments/post/${postId}`, {
      params: userEmail ? { userEmail } : undefined,
    }),

  getRepliesByComment: (commentId: number) =>
    api.get(`/api/comments/${commentId}/replies`),

  getCommentReactionSummary: (commentId: number, userEmail?: string) =>
    api.get(`/api/reactions/comment/${commentId}/summary`, {
      params: userEmail ? { userEmail } : undefined,
    }),

  addCommentReaction: (
    commentId: number,
    reactionType: "LIKE" | "DISLIKE",
    userEmail?: string
  ) =>
    api.post("/api/reactions/add", {
      targetId: commentId,
      targetType: "COMMENT",
      reactionType,
      userEmail,
    }),

  removeCommentReaction: (
    commentId: number,
    userEmail?: string,
    reactionType: "LIKE" | "DISLIKE" = "LIKE"
  ) =>
    api.post("/api/reactions/delete", {
      targetId: commentId,
      targetType: "COMMENT",
      reactionType,
      userEmail,
    }),

  savePost: (postId: number) => api.post("/api/saved-posts/save", { postId }),

  unsavePost: (postId: number) =>
    api.delete(`/api/saved-posts/unsave/${postId}`),

  getMySavedPosts: () => api.get("/api/saved-posts/my-saved"),

  getMyPosts: (
    page: number = 0,
    size: number = 10,
    sort: string = "createdAt,desc"
  ) =>
    api.get("/api/posts/my-posts", {
      params: { page, size, sort },
    }),

  checkPostSaved: (postId: number) =>
    api.get(`/api/saved-posts/check/${postId}`),

  createReport: (data: CreateReportRequest, userEmail: string) =>
    api.post("/api/reports/create", data, {
      params: { userEmail },
    }),
};

export default forumEndpoints;
