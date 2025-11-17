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

export interface ReactionRequest {
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
}

export interface SavePostRequest {
  postId: number;
}
