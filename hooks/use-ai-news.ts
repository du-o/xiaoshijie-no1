import { useQuery } from "@tanstack/react-query";
import { fetchAINews, fetchAINewsBySource } from "@/lib/api/ai-news";
import { AINewsItem } from "@/types/ai-news";
import { useOpenClawNews } from "./use-news";
import { fetchMoltbookHotPosts } from "@/lib/api/moltbook";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";

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
 * 使用 Moltbook 数据的 Hook
 */
function useMoltbookPostsForNews() {
  return useTanStackQuery({
    queryKey: ["moltbook-posts-for-news"],
    queryFn: async () => {
      const response = await fetchMoltbookHotPosts();
      if (!response.success || !response.data) {
        throw new Error(response.error || "获取 Moltbook 热帖失败");
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
 */
export function useAINewsBySource(source: string) {
  // OpenClaw 和 Moltbook 使用专门的 hooks
  const openclawQuery = useOpenClawNews();
  const moltbookQuery = useMoltbookPostsForNews();

  return useQuery<AINewsItem[]>({
    queryKey: ["ai-news", source],
    queryFn: async () => {
      // 处理 OpenClaw 源
      if (source === 'openclaw') {
        if (openclawQuery.isLoading) return [];
        if (openclawQuery.error) throw openclawQuery.error;
        
        return (openclawQuery.data || []).slice(0, 6).map((release, index) => ({
          id: `openclaw-${index}`,
          title: release.name,
          summary: release.body.replace(/[#*`]/g, "").slice(0, 200),
          url: release.htmlUrl,
          source: 'OpenClaw',
          publishedAt: release.publishedAt,
        }));
      }

      // 处理 Moltbook 源
      if (source === 'moltbook') {
        if (moltbookQuery.isLoading) return [];
        if (moltbookQuery.error) throw moltbookQuery.error;
        
        return (moltbookQuery.data || []).slice(0, 6).map((post, index) => ({
          id: `moltbook-${index}`,
          title: post.title,
          translatedTitle: post.translatedTitle,
          summary: post.content?.slice(0, 200) || '',
          url: `https://moltbook.com/post/${post.id}`,
          source: 'Moltbook',
          publishedAt: post.createdAt,
        }));
      }

      // 其他源使用 API 获取
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
