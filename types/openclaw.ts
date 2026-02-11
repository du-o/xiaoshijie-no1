// OpenClaw 新闻数据类型

export interface OpenClawRelease {
  id: number;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  author: string;
  htmlUrl: string;
  downloadCount: number;
}
