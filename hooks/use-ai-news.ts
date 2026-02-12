import { useQuery } from "@tanstack/react-query";
import { fetchAINews, fetchAINewsBySource } from "@/lib/api/ai-news";
import { AINewsItem } from "@/types/ai-news";

// 30分钟缓存时间
const CACHE_TIME = 30 * 60 * 1000;

/**
 * 获取所有 AI 新闻 Hook
 */
export function useAINews() {
  return useQuery<AINewsItem[]>({
    queryKey: ["ai-news"],
    queryFn: async () => {
      const response = await fetchAINews();
      if (!response.success || !response.data) {
        throw new Error(response.error || "获取 AI 新闻失败");
      }
      return response.data;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * 按来源获取 AI 新闻 Hook
 * 支持 8 个源：openai、arxiv、机器之心、qbitai、google-blog、every、openclaw、moltbook
 * 统一使用本地 JSON 文件
 */
export function useAINewsBySource(source: string) {
  return useQuery<AINewsItem[]>({
    queryKey: ["ai-news", source],
    queryFn: async () => {
      const response = await fetchAINewsBySource(source);
      if (!response.success || !response.data) {
        throw new Error(response.error || `获取 ${source} 新闻失败`);
      }
      return response.data;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!source,
  });
}
