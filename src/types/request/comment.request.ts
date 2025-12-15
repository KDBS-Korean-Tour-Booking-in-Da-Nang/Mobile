export interface CreateCommentRequest {
  postId: number;
  userEmail: string;
  content: string;
  image?: any;
}

export interface CommentRequest {
  forumPostId: number;
  content: string;
  userEmail: string;
  imgPath?: string | null;
  parentCommentId?: number;
}
