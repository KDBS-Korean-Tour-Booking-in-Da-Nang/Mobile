export interface Article {
  articleId: number;
  articleTitle: string;
  articleContent: string;
  articleDescription: string;
  articleThumbnail: string;
  articleLink: string;
  articleStatus: "PENDING" | "APPROVED" | "UNAPPROVED";
  articleCreatedDate: string;
  // English translations
  articleTitleEN?: string;
  articleDescriptionEN?: string;
  articleContentEN?: string;
  // Korean translations
  articleTitleKR?: string;
  articleDescriptionKR?: string;
  articleContentKR?: string;
}

export interface ArticleResponse {
  data: Article[];
  message?: string;
}
