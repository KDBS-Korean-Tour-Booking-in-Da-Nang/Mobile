import api from "../../services/api";
import {
  Article,
  ArticleResponse,
} from "../../src/types/response/article.response";

export type { Article, ArticleResponse };

export const getApprovedArticles = async (): Promise<Article[]> => {
  try {
    const response = await api.get("/api/article/status/APPROVED");
    const data = response.data as Article[];
    return data.sort(
      (a, b) =>
        new Date(b.articleCreatedDate).getTime() -
        new Date(a.articleCreatedDate).getTime()
    );
  } catch (error) {
    throw error;
  }
};

export const getArticleById = async (id: number): Promise<Article> => {
  try {
    const response = await api.get(`/api/article/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllArticles = async (): Promise<Article[]> => {
  try {
    const response = await api.get("/api/article");
    const data = response.data as Article[];
    return data.sort(
      (a, b) =>
        new Date(b.articleCreatedDate).getTime() -
        new Date(a.articleCreatedDate).getTime()
    );
  } catch (error) {
    throw error;
  }
};
