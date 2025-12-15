export interface SavedPostResponse {
  savedPostId: number;
  postId: number;
  postTitle: string;
  postContent: string;
  postAuthor: string;
  postAuthorAvatar: string;
  postCreatedAt: string;
  note?: string;
  savedAt: string;
}
