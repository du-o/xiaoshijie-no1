// Moltbook 数据类型

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  author: string;
  submolt: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
}
