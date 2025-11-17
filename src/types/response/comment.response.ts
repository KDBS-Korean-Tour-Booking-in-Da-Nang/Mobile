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

export interface ForumCommentResponse {
  forumCommentId: number;
  content: string;
  imgPath?: string;
  react: number;
  createdAt: string;
  username: string;
  userAvatar: string;
  forumPostId: number;
  parentCommentId?: number | null;
  userReactions?: Array<{
    userEmail: string;
    reactionType: string;
  }>;
  replies?: ForumCommentResponse[];
}

export interface CommentReactionSummary {
  likeCount: number;
  dislikeCount: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}
