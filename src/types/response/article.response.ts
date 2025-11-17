export interface Article {
  articleId: number;
  articleTitle: string;
  articleContent: string;
  articleDescription: string;
  articleThumbnail: string;
  articleLink: string;
  articleStatus: "PENDING" | "APPROVED" | "UNAPPROVED";
  articleCreatedDate: string;
}

export interface ArticleResponse {
  data: Article[];
  message?: string;
}
