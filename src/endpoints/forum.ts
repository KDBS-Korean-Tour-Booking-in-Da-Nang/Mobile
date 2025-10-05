import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ApiPostImg {
  imgPath: string;
}

interface ApiHashtag {
  hashtagId: number;
  content: string;
}

interface ApiReactionSummary {
  targetId: number;
  targetType: "POST" | "COMMENT";
  likeCount: number;
  dislikeCount: number;
  totalReactions: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}

interface ReactionSummaryResponse {
  targetId: number;
  targetType: "POST" | "COMMENT";
  likeCount: number;
  dislikeCount: number;
  totalReactions: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}

interface ApiPost {
  forumPostId: number;
  title: string;
  content: string;
  images: ApiPostImg[];
  hashtags: ApiHashtag[];
  createdAt: string;
  reactions: ApiReactionSummary;
  username: string;
  userAvatar: string;
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  username: string;
  userAvatar: string;
  imageUrls: string[];
  hashtags: string[];
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  totalReactions: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
  commentCount?: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  images?: any[];
  hashtags?: string[];
  userEmail?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  hashtags?: string[];
  images?: any[];
  userEmail?: string;
}

export interface SearchParams {
  keyword?: string;
  hashtags?: string[];
  page?: number;
  size?: number;
  sort?: string;
}

function toAbsoluteUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const origin = base.endsWith("/api") ? base.slice(0, -4) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

function transformApiPost(apiPost: ApiPost): PostResponse {
  let hashtags: string[] = [];
  if (apiPost.hashtags) {
    if (Array.isArray(apiPost.hashtags)) {
      hashtags = apiPost.hashtags.map((h) => {
        if (typeof h === "string") return h;
        if (typeof h === "object" && h.content) return h.content;
        return String(h);
      });
    }
  }

  return {
    id: apiPost.forumPostId,
    title: apiPost.title,
    content: apiPost.content,
    username: apiPost.username || "Unknown User",
    userAvatar: apiPost.userAvatar || "",
    imageUrls: apiPost.images
      ? apiPost.images.map((i) => toAbsoluteUrl(i.imgPath))
      : [],
    hashtags,
    createdAt: apiPost.createdAt,
    likeCount: apiPost.reactions?.likeCount || 0,
    dislikeCount: apiPost.reactions?.dislikeCount || 0,
    totalReactions: apiPost.reactions?.totalReactions || 0,
    userReaction: apiPost.reactions?.userReaction || null,
    commentCount: 0,
  };
}

export async function getAllPosts(): Promise<PostResponse[]> {
  const response = await api.get<ApiPost[]>("/api/posts");

  return response.data.map(transformApiPost);
}

export async function getPostById(id: number): Promise<PostResponse> {
  const response = await api.get<ApiPost>(`/api/posts/${id}`);
  return transformApiPost(response.data);
}

export async function createPost(
  data: CreatePostRequest
): Promise<PostResponse> {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  if (data.userEmail) {
    formData.append("userEmail", data.userEmail);
  }
  if (data.hashtags && data.hashtags.length > 0) {
    data.hashtags.forEach((hashtag) => {
      formData.append("hashtags", hashtag);
    });
  }
  if (data.images) {
    data.images.forEach((image: any, idx: number) => {
      const uri: string = image?.uri || image?.path || "";
      const clean = uri.split("?")[0];
      const ext = (
        clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg"
      ).toLowerCase();
      const mime =
        image?.type ||
        (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);
      const name = image?.name || `photo_${Date.now()}_${idx}.${ext}`;
      if (uri) {
        formData.append("images", { uri, name, type: mime } as any);
      }
    });
  }
  const response = await api.post<ApiPost>("/api/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return transformApiPost(response.data);
}

export async function updatePost(
  id: number,
  data: UpdatePostRequest
): Promise<PostResponse> {
  const formData = new FormData();
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.content !== undefined) formData.append("content", data.content);
  if (data.userEmail) formData.append("userEmail", data.userEmail);
  if (data.hashtags) {
    data.hashtags.forEach((hashtag) => formData.append("hashtags", hashtag));
  }
  if (data.images && data.images.length > 0) {
    data.images.forEach((image: any, idx: number) => {
      const uri: string = image?.uri || image?.path || "";
      const clean = uri.split("?")[0];
      const ext = (
        clean.match(/\.([a-zA-Z0-9]+)$/)?.[1] || "jpg"
      ).toLowerCase();
      const mime =
        image?.type ||
        (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`);
      const name = image?.name || `photo_${Date.now()}_${idx}.${ext}`;
      if (uri) {
        formData.append("images", { uri, name, type: mime } as any);
      }
    });
  }
  const response = await api.put<ApiPost>(`/api/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return transformApiPost(response.data);
}

export async function deletePost(
  id: number,
  userEmail?: string
): Promise<void> {
  if (!userEmail) {
    throw new Error("User email is required to delete post");
  }

  try {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      try {
        const introspectResponse = await api.post("/api/auth/introspect", {
          token: token,
        });
      } catch (introspectError: any) {}
    }

    const params = new URLSearchParams();
    params.append("userEmail", userEmail);

    await api.delete(`/api/posts/${id}?${params.toString()}`, {
      headers: {
        Authorization: token,
        "User-Email": userEmail,
      },
    });
  } catch (error: any) {
    throw error;
  }
}

export async function searchPosts(
  params: SearchParams
): Promise<PostResponse[]> {
  const requestParams: any = { ...params };
  if (Array.isArray(requestParams.hashtags)) {
    requestParams.hashtags = requestParams.hashtags.join(",");
  }
  if (requestParams.keyword) {
    requestParams.searchIn = "title,content";
    requestParams.fullText = true;
  }
  const response = await api.get<{ content: ApiPost[] } | ApiPost[]>(
    "/api/posts/search",
    {
      params: requestParams,
    }
  );
  const raw = Array.isArray(response.data)
    ? (response.data as ApiPost[])
    : (response.data as { content: ApiPost[] }).content;
  let posts = raw.map(transformApiPost);
  if (
    params.keyword &&
    typeof params.keyword === "string" &&
    params.keyword.trim()
  ) {
    const q = params.keyword.trim().toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q)
    );
  }
  return posts;
}

export interface ReactionRequest {
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
}

export interface ReactionResponse {
  reactionId: number;
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
  createdAt: string;
}

export async function addReaction(
  data: ReactionRequest
): Promise<ReactionResponse | null> {
  let params: any = undefined;
  let userEmail: string | undefined = undefined;
  try {
    const stored = await AsyncStorage.getItem("userData");
    if (stored) {
      const parsed = JSON.parse(stored);
      userEmail =
        parsed?.email ||
        parsed?.userEmail ||
        parsed?.emailAddress ||
        parsed?.mail;
      if (userEmail) params = { userEmail };
    }
  } catch {}
  const body: any = { ...data };
  if (userEmail) body.userEmail = userEmail;
  const response = await api.post<{ result: ReactionResponse }>(
    "/api/reactions/add",
    body,
    { params }
  );
  return response.data.result || null;
}

export async function removeReaction(
  targetId: number,
  targetType: "POST" | "COMMENT"
): Promise<void> {
  let params: any = undefined;
  try {
    const stored = await AsyncStorage.getItem("userData");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.email) params = { userEmail: parsed.email };
    }
  } catch {}
  await api.post(`/api/reactions/${targetType}/${targetId}`, null, { params });
}

export async function getReactionSummary(
  targetId: number,
  targetType: "POST" | "COMMENT",
  userEmail?: string
): Promise<ApiReactionSummary> {
  const params = userEmail ? { userEmail } : undefined;
  if (targetType === "POST") {
    try {
      const response = await api.get<
        ReactionSummaryResponse | { result: ApiReactionSummary }
      >(`/api/reactions/post/${targetId}/summary`, { params });
      const data: any = response.data as any;
      return (data.result ?? data) as ApiReactionSummary;
    } catch {
      const response2 = await api.get<
        ReactionSummaryResponse | { result: ApiReactionSummary }
      >(`/api/reactions/POST/${targetId}/summary`, { params });
      const data2: any = response2.data as any;
      return (data2.result ?? data2) as ApiReactionSummary;
    }
  }

  const response = await api.get<
    ReactionSummaryResponse | { result: ApiReactionSummary }
  >(`/api/reactions/comment/${targetId}/summary`, { params });
  const data: any = response.data as any;
  return (data.result ?? data) as ApiReactionSummary;
}

export interface CommentRequest {
  forumPostId: number;
  content: string;
  userEmail: string;
  imgPath?: string | null;
  parentCommentId?: number;
}

export interface CommentResponse {
  forumCommentId: number;
  content: string;
  imgPath?: string;
  react: number;
  createdAt: string;
  username: string;
  userAvatar: string;
  forumPostId: number;
  parentCommentId?: number | null;
  userReactions?: Array<{
    userEmail: string;
    reactionType: string;
  }>;
  replies?: CommentResponse[];
}

export async function createComment(
  data: CommentRequest
): Promise<CommentResponse> {
  const response = await api.post<CommentResponse>("/api/comments", data, {
    params: { userEmail: data.userEmail },
  });

  return response.data;
}

export async function replyToComment(
  data: CommentRequest & { parentCommentId: number }
): Promise<CommentResponse> {
  const response = await api.post<CommentResponse>("/api/comments", data);
  return response.data;
}

export async function updateComment(
  id: number,
  data: CommentRequest
): Promise<CommentResponse> {
  const response = await api.put<CommentResponse>(`/api/comments/${id}`, data);
  return response.data;
}

export async function deleteComment(
  id: number,
  userEmail: string
): Promise<void> {
  await api.delete(`/api/comments/${id}`, { params: { userEmail } });
}

export async function getCommentsByPost(
  postId: number
): Promise<CommentResponse[]> {
  let params: any = undefined;
  try {
    const stored = await AsyncStorage.getItem("userData");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.email) params = { userEmail: parsed.email };
    }
  } catch {}
  const response = await api.get<CommentResponse[]>(
    `/api/comments/post/${postId}`,
    { params }
  );
  return response.data.map((c: any) => ({
    ...c,
    imgPath: c?.imgPath ? toAbsoluteUrl(c.imgPath) : undefined,
  }));
}

export async function getRepliesByComment(
  commentId: number
): Promise<CommentResponse[]> {
  const response = await api.get<CommentResponse[]>(
    `/api/comments/${commentId}/replies`
  );
  return response.data.map((c: any) => ({
    ...c,
    imgPath: c?.imgPath ? toAbsoluteUrl(c.imgPath) : undefined,
  }));
}

export interface CommentReactionSummary {
  likeCount: number;
  dislikeCount: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}

export async function getCommentReactionSummary(
  commentId: number,
  userEmail?: string
): Promise<CommentReactionSummary | null> {
  const params = userEmail ? { userEmail } : undefined;
  try {
    const res = await api.get<CommentReactionSummary>(
      `http://localhost:8080/api/reactions/comment/${commentId}/summary`,
      { params }
    );
    return res.data as any;
  } catch {
    try {
      const res2 = await api.get<{ result: ApiReactionSummary }>(
        `/api/reactions/COMMENT/${commentId}/summary`,
        { params }
      );
      const r = res2.data.result;
      return {
        likeCount: r.likeCount,
        dislikeCount: r.dislikeCount,
        userReaction: r.userReaction,
      };
    } catch {
      return null;
    }
  }
}

export async function addCommentReaction(
  commentId: number,
  reactionType: "LIKE" | "DISLIKE",
  userEmail?: string
): Promise<void> {
  const body: any = {
    targetId: commentId,
    targetType: "COMMENT",
    reactionType,
  };
  if (userEmail) body.userEmail = userEmail;
  await api.post("/api/reactions/add", body);
}

export async function removeCommentReaction(commentId: number): Promise<void> {
  await api.post(`/api/reactions/COMMENT/${commentId}`);
}

export interface SavePostRequest {
  postId: number;
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

export async function savePost(postId: number): Promise<SavedPostResponse> {
  const response = await api.post<{ result: SavedPostResponse }>(
    "/api/saved-posts/save",
    { postId }
  );
  return response.data.result;
}

export async function unsavePost(postId: number): Promise<void> {
  await api.delete(`/api/saved-posts/unsave/${postId}`);
}

export async function getMySavedPosts(): Promise<SavedPostResponse[]> {
  const response = await api.get<{ result: SavedPostResponse[] }>(
    "/api/saved-posts/my-saved"
  );
  return response.data.result;
}

export async function getMyPosts(
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc"
): Promise<PostResponse[]> {
  const response = await api.get<{ content: ApiPost[] }>(
    "/api/posts/my-posts",
    {
      params: { page, size, sort },
    }
  );
  return response.data.content.map(transformApiPost);
}

export async function checkPostSaved(postId: number): Promise<boolean> {
  const response = await api.get<{ result: boolean }>(
    `/api/saved-posts/check/${postId}`
  );
  return response.data.result;
}

export interface ReportRequest {
  targetType: "POST" | "COMMENT";
  targetId: number;
  reasons: string[];
  description?: string;
}

export interface ReportResponse {
  reportId: number;
  reporterUsername: string;
  reporterEmail: string;
  targetType: "POST" | "COMMENT";
  targetId: number;
  targetTitle: string;
  targetAuthor: string;
  reasons: string[];
  description?: string | null;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" | "CLOSED";
  adminNote: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  resolvedByUsername: string | null;
}

export async function createReport(
  data: ReportRequest,
  userEmail: string
): Promise<ReportResponse> {
  const response = await api.post<ReportResponse>("/api/reports/create", data, {
    params: { userEmail },
  });
  return response.data;
}
