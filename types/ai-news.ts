// AI 新闻数据类型

export interface AINewsArticle {
  title: string;
  date: string;
  summary: string;
  url: string;
  category?: string;
  _source: string;
}

export interface AINewsSource {
  source: string;
  source_url: string;
  fetch_time: string;
  articles: AINewsArticle[];
}

export interface AINewsData {
  fetch_time: string;
  filter_time: string;
  filter_criteria: string;
  total_sources: number;
  total_articles: number;
  sources_summary: {
    source: string;
    original_count: number;
    filtered_count: number;
  }[];
  articles: AINewsArticle[];
}

// 用于组件展示的简化新闻项
export interface AINewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category?: string;
  publishedAt: string;
}
