import api from "../services/api";

// Raw API types
interface ApiPost {
  forumPostId: number;
  title: string;
  content: string;
  images: { imgPath: string }[];
  hashtags: { hashtagId: number; content: string }[];
  createdAt: string;
  userEmail?: string;
  username?: string;
  likeCount?: number;
  commentCount?: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
}

// Public types
export interface PostResponse {
  id: number;
  title: string;
  content: string;
  userEmail: string;
  username: string;
  userAvatar: string;
  imageUrls: string[];
  hashtags: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  images?: any[];
  hashtags?: string[];
  userEmail?: string; // some screens pass this along
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
    userEmail: apiPost.userEmail || "",
    username: apiPost.username || "Unknown User",
    userAvatar: "",
    imageUrls: apiPost.images ? apiPost.images.map((i) => i.imgPath) : [],
    hashtags,
    createdAt: apiPost.createdAt,
    likeCount: apiPost.likeCount || 0,
    commentCount: apiPost.commentCount || 0,
    userReaction: apiPost.userReaction || null,
  };
}

export async function getAllPosts(): Promise<PostResponse[]> {
  const response = await api.get<ApiPost[]>("/api/posts");
  console.log("getAllPosts - raw API response:", response.data);
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
    data.images.forEach((image) => {
      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("imageUrls", {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
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
    data.images.forEach((image: any) => {
      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("imageUrls", {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
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
  const params = userEmail ? { userEmail } : {};
  await api.delete(`/api/posts/${id}`, { params });
}

export async function searchPosts(
  params: SearchParams
): Promise<PostResponse[]> {
  const requestParams: any = { ...params };
  if (Array.isArray(requestParams.hashtags)) {
    requestParams.hashtags = requestParams.hashtags.join(",");
  }
  const response = await api.get<{ content: ApiPost[] }>("/api/posts/search", {
    params: requestParams,
  });
  return response.data.content.map(transformApiPost);
}
