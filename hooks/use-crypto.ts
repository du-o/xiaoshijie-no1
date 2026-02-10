import { useQuery } from "@tanstack/react-query";
import { fetchCryptoPrices, fetchAHR999 } from "@/lib/api/crypto";

// 30分钟缓存时间
const CACHE_TIME = 30 * 60 * 1000;

/**
 * 获取加密货币价格数据 Hook
 * 更新策略：30分钟缓存，页面打开/刷新时更新
 */
export function useCryptoPrices() {
  return useQuery({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      const response = await fetchCryptoPrices();
      if (!response.success || !response.data) {
        throw new Error(response.error || "获取数据失败");
      }
      return response.data;
    },
    // 30分钟内数据视为新鲜，不会重新获取
    staleTime: CACHE_TIME,
    // 缓存保留30分钟
    gcTime: CACHE_TIME,
    // 禁用自动轮询刷新
    refetchInterval: false,
    // 窗口重新聚焦时不刷新
    refetchOnWindowFocus: false,
    // 网络恢复时不刷新
    refetchOnReconnect: false,
  });
}

/**
 * 获取 AHR999 指数 Hook
 * 更新策略：30分钟缓存，页面打开/刷新时更新
 */
export function useAHR999() {
  return useQuery({
    queryKey: ["ahr999"],
    queryFn: async () => {
      const response = await fetchAHR999();
      if (!response.success || !response.data) {
        throw new Error(response.error || "获取数据失败");
      }
      return response.data;
    },
    // 30分钟内数据视为新鲜
    staleTime: CACHE_TIME,
    // 缓存保留30分钟
    gcTime: CACHE_TIME,
    // 禁用自动轮询刷新
    refetchInterval: false,
    // 窗口重新聚焦时不刷新
    refetchOnWindowFocus: false,
    // 网络恢复时不刷新
    refetchOnReconnect: false,
    retry: 2,
  });
}
