export interface ArticleCommentResponse {
  articleCommentId: number;
  content: string;
  imgPath?: string;
  react?: number;
  createdAt: string;
  username: string;
  userAvatar?: string;
  userEmail: string;
  articleId: number;
  parentCommentId?: number;
}

