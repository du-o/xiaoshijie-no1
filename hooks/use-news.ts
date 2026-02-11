import { useQuery } from "@tanstack/react-query";
import { fetchOpenClawReleases } from "@/lib/api/openclaw";
import { fetchMoltbookHotPosts } from "@/lib/api/moltbook";
import { OpenClawRelease } from "@/types/openclaw";
import { MoltbookPost } from "@/types/moltbook";

// 30分钟缓存时间
const CACHE_TIME = 30 * 60 * 1000;

/**
 * 获取 OpenClaw Releases Hook
 */
export function useOpenClawNews() {
  return useQuery<OpenClawRelease[]>({
    queryKey: ["openclaw-releases"],
    queryFn: async () => {
      const response = await fetchOpenClawReleases();
      if (!response.success || !response.data) {
        throw new Error(response.error || "获取 OpenClaw 动态失败");
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
 * 获取 Moltbook 热帖 Hook
 */
export function useMoltbookPosts() {
  return useQuery<MoltbookPost[]>({
    queryKey: ["moltbook-posts"],
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
