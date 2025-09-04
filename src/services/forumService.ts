import api from "./api";

// =================================
// INTERFACES
// =================================

// Cấu trúc dữ liệu thô trả về từ API
interface ApiPost {
  forumPostId: number;
  title: string;
  content: string;
  images: { imgPath: string }[];
  hashtags: { hashtagId: number; content: string }[];
  createdAt: string;
  // Các trường sau không có trong tài liệu API chính thức cho GET /api/posts
  // nhưng chúng ta giả định chúng tồn tại để ứng dụng hoạt động
  userEmail?: string;
  username?: string;
  likeCount?: number;
  commentCount?: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
}

// Cấu trúc dữ liệu mà ứng dụng sử dụng (sau khi đã được chuyển đổi)
export interface PostResponse {
  id: number;
  title: string;
  content: string;
  userEmail: string;
  username: string;
  userAvatar: string; // Trường này không có trong API mới
  imageUrls: string[];
  hashtags: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
}

// Dữ liệu để tạo bài viết mới
export interface CreatePostRequest {
  title: string;
  content: string;
  images?: any[];
  hashtags?: string[];
}

// Dữ liệu để cập nhật bài viết
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  hashtags?: string[];
  images?: any[];
}

// Tham số tìm kiếm
export interface SearchParams {
  keyword?: string;
  hashtags?: string[];
  page?: number;
  size?: number;
  sort?: string;
}

// =================================
// SERVICE CLASS
// =================================

class ForumService {
  // Hàm private để chuyển đổi dữ liệu từ API sang dạng ứng dụng sử dụng
  private _transformApiPost(apiPost: ApiPost): PostResponse {
    return {
      id: apiPost.forumPostId,
      title: apiPost.title,
      content: apiPost.content,
      userEmail: apiPost.userEmail || "", // Mặc định an toàn
      username: apiPost.username || "Unknown User", // Mặc định an toàn
      userAvatar: "", // Không có trong API mới
      imageUrls: apiPost.images ? apiPost.images.map((img) => img.imgPath) : [],
      hashtags: apiPost.hashtags
        ? apiPost.hashtags.map((ht) => ht.content)
        : [],
      createdAt: apiPost.createdAt,
      likeCount: apiPost.likeCount || 0,
      commentCount: apiPost.commentCount || 0,
      userReaction: apiPost.userReaction || null,
    };
  }

  // Lấy tất cả bài viết
  async getAllPosts(): Promise<PostResponse[]> {
    try {
      const response = await api.get<ApiPost[]>("/api/posts");
      return response.data.map(this._transformApiPost);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch posts");
    }
  }

  // Lấy bài viết theo ID
  async getPostById(id: number): Promise<PostResponse> {
    try {
      const response = await api.get<ApiPost>(`/api/posts/${id}`);
      return this._transformApiPost(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch post");
    }
  }

  // Tạo bài viết mới
  async createPost(data: CreatePostRequest): Promise<PostResponse> {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
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
      return this._transformApiPost(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create post");
    }
  }

  // Cập nhật bài viết
  async updatePost(id: number, data: UpdatePostRequest): Promise<PostResponse> {
    try {
      const formData = new FormData();
      if (data.title !== undefined) formData.append("title", data.title);
      if (data.content !== undefined) formData.append("content", data.content);
      if (data.hashtags) {
        data.hashtags.forEach((hashtag) => {
          formData.append("hashtags", hashtag);
        });
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
      return this._transformApiPost(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update post");
    }
  }

  // Xóa bài viết
  async deletePost(id: number): Promise<void> {
    try {
      await api.delete(`/api/posts/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete post");
    }
  }

  // Tìm kiếm bài viết
  async searchPosts(params: SearchParams): Promise<PostResponse[]> {
    try {
      // Create a copy of the params to avoid modifying the original object
      const requestParams: any = { ...params };

      // If hashtags is an array, join it into a comma-separated string
      if (Array.isArray(requestParams.hashtags)) {
        requestParams.hashtags = requestParams.hashtags.join(",");
      }

      const response = await api.get<{ content: ApiPost[] }>(
        "/api/posts/search",
        { params: requestParams } // Use the modified params
      );
      return response.data.content.map(this._transformApiPost);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to search posts"
      );
    }
  }
}

export default new ForumService();
