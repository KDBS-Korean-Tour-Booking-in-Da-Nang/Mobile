export interface PostResponse {
  id: number;
  title: string;
  content: string;
  username: string;
  userAvatar: string;
  imageUrls: string[];
  hashtags: string[];
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  totalReactions: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
  commentCount?: number;
}

export interface ReactionResponse {
  reactionId: number;
  targetId: number;
  targetType: "POST" | "COMMENT";
  reactionType: "LIKE" | "DISLIKE";
  createdAt: string;
}

export interface ReactionSummaryResponse {
  targetId: number;
  targetType: "POST" | "COMMENT";
  likeCount: number;
  dislikeCount: number;
  totalReactions: number;
  userReaction: "LIKE" | "DISLIKE" | null;
}

export interface PostImgResponse {
  imgPath: string;
}

export interface HashtagResponse {
  hashtagId: number;
  content: string;
}

export interface PostRawResponse {
  forumPostId: number;
  title: string;
  content: string;
  images: PostImgResponse[];
  hashtags: HashtagResponse[];
  createdAt: string;
  reactions: ReactionSummaryResponse;
  username: string;
  userAvatar: string;
}
