export interface ArticleCommentRequest {
  userEmail: string;
  articleId: number;
  content: string;
  imgPath?: string;
  parentCommentId?: number;
}

