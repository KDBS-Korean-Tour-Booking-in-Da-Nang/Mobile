import api from "./api";
import { useAuthContext } from "../contexts/authContext"; // Import hook
import userService from "./userService";

// Cấu trúc dữ liệu thô của comment từ API
interface ApiComment {
  forumCommentId: number;
  content: string;
  imgPath?: string;
  createdAt: string;
}

// Cấu trúc dữ liệu comment mà ứng dụng sử dụng
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

// Dữ liệu để tạo comment
export interface CreateCommentRequest {
  postId: number;
  userEmail: string;
  content: string;
  image?: any;
}

class CommentService {
  // Hàm chuyển đổi private
  private _transformApiComment(
    apiComment: ApiComment,
    postId: number,
    user: { email: string; username: string }
  ): CommentResponse {
    return {
      id: apiComment.forumCommentId,
      content: apiComment.content,
      imageUrl: apiComment.imgPath,
      createdAt: apiComment.createdAt,
      postId: postId,
      userEmail: user.email,
      username: user.username,
      userAvatar: "", // Không có trong API
    };
  }

  // Lấy comment cho một bài viết
  async getCommentsForPost(postId: number): Promise<CommentResponse[]> {
    try {
      const response = await api.get<ApiComment[]>(
        `/api/comments/post/${postId}`
      );
      // API không trả về user info, nên phần này sẽ không đầy đủ
      return response.data.map((c) =>
        this._transformApiComment(c, postId, { email: "", username: "" })
      );
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }

  // Tạo comment mới
  async createComment(data: CreateCommentRequest): Promise<CommentResponse> {
    try {
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
      // API không trả về thông tin user, nên chúng ta không có dữ liệu để truyền vào
      // Backend cần được cập nhật để trả về thông tin người tạo comment
      const transformedComment = this._transformApiComment(
        response.data,
        data.postId,
        { email: "", username: "" }
      );
      return transformedComment;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create comment"
      );
    }
  }

  // Các hàm update/delete có thể thêm vào đây nếu cần
}

export default new CommentService();
