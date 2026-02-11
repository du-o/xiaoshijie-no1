import { AINewsData, AINewsItem } from "@/types/ai-news";
import { ApiResponse } from "@/types/crypto";

// 更新检查间隔（1小时）
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * 元数据类型
 */
export interface AINewsMeta {
  lastUpdated: string;
  sources: Record<string, {
    lastUpdated: string;
    articleCount: number;
  }>;
}

/**
 * 更新状态类型
 */
export interface AINewsUpdateStatus {
  needsUpdate: boolean;
  lastUpdated: string;
  timeSinceLastUpdate: number;
  timeSinceLastUpdateFormatted: string;
  nextUpdateIn: number;
  nextUpdateInFormatted: string;
  totalArticles: number;
  sources: AINewsMeta['sources'];
}

/**
 * 获取 AI 新闻数据
 * 从 public/data/ai-news/ 目录读取 JSON 文件
 * 所有消息源统一取最近6条
 */
export async function fetchAINews(): Promise<ApiResponse<AINewsItem[]>> {
  try {
    // 读取合并后的所有新闻源数据
    const response = await fetch('/data/ai-news/all-sources-latest.json', {
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      throw new Error(`获取 AI 新闻失败: ${response.status}`);
    }
    
    const data: AINewsData = await response.json();
    
    // 按源分别获取数据
    const allNewsItems: AINewsItem[] = [];
    
    // 获取各源数据（统一6条，不区分低频/高频）
    const sourcePromises = [
      fetchSourceData('openai', 6),
      fetchSourceData('arxiv', 6),
      fetchSourceData('机器之心', 6),
      fetchSourceData('qbitai', 6),
    ];
    
    const results = await Promise.allSettled(sourcePromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        allNewsItems.push(...result.value.data);
      }
    });
    
    // 按发布时间排序（最新的在前）
    allNewsItems.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
    
    return {
      success: true,
      data: allNewsItems,
      timestamp: data.fetch_time,
    };
  } catch (error) {
    console.error('获取 AI 新闻失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取 AI 新闻失败",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 获取指定源的新闻数据
 * @param source 源ID
 * @param maxItems 最大条数
 */
async function fetchSourceData(
  source: string, 
  maxItems: number
): Promise<ApiResponse<AINewsItem[]>> {
  try {
    const fileName = getSourceFileName(source);
    const response = await fetch(`/data/ai-news/${fileName}`, {
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      throw new Error(`获取 ${source} 新闻失败: ${response.status}`);
    }
    
    const data = await response.json();
    let articles = data.articles || [];
    
    // 限制条数
    articles = articles.slice(0, maxItems);
    
    const newsItems: AINewsItem[] = articles.map((article: any, index: number) => ({
      id: `${source}-${index}`,
      title: article.title,
      summary: truncateSummary(article.summary || '', 200),
      url: article.url,
      source: data.source || source,
      category: article.category,
      publishedAt: article.date,
    }));
    
    return {
      success: true,
      data: newsItems,
      timestamp: data.fetch_time || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`获取 ${source} 新闻失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `获取 ${source} 新闻失败`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 按来源获取 AI 新闻
 * 所有消息源统一取最近6条
 */
export async function fetchAINewsBySource(source: string): Promise<ApiResponse<AINewsItem[]>> {
  try {
    // 统一取6条
    return await fetchSourceData(source, 6);
  } catch (error) {
    console.error(`获取 ${source} 新闻失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `获取 ${source} 新闻失败`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 截断摘要到指定长度
 */
function truncateSummary(summary: string, maxLength: number): string {
  if (!summary) return '';
  if (summary.length <= maxLength) return summary;
  return summary.slice(0, maxLength) + '...';
}

/**
 * 获取来源对应的文件名
 */
function getSourceFileName(source: string): string {
  const mapping: Record<string, string> = {
    'openai': 'openai-news-latest.json',
    'arxiv': 'arxiv-cs-ai-latest.json',
    'qbitai': 'qbitai-latest.json',
    '机器之心': '机器之心-latest.json',
  };
  return mapping[source] || 'all-sources-latest.json';
}

/**
 * 获取所有可用的新闻源
 */
export function getNewsSources(): { id: string; name: string; icon: string }[] {
  return [
    { id: 'all', name: '全部', icon: '🔥' },
    { id: 'openai', name: 'OpenAI', icon: '🤖' },
    { id: 'arxiv', name: 'arXiv', icon: '📄' },
    { id: 'qbitai', name: '量子位', icon: '⚛️' },
    { id: '机器之心', name: '机器之心', icon: '🇨🇳' },
  ];
}

/**
 * 读取 meta.json 获取更新时间戳
 */
export async function fetchAINewsMeta(): Promise<ApiResponse<AINewsMeta>> {
  try {
    const response = await fetch('/data/ai-news/meta.json', {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`获取元数据失败: ${response.status}`);
    }

    const data: AINewsMeta = await response.json();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('获取 AI 新闻元数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取元数据失败",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 检查是否需要更新
 */
export function checkNeedsUpdate(lastUpdated: string): boolean {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdateTime > UPDATE_INTERVAL_MS;
}

/**
 * 获取更新状态（从 API）
 */
export async function fetchAINewsStatus(): Promise<ApiResponse<AINewsUpdateStatus>> {
  try {
    const response = await fetch('/api/ai-news/status', {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`获取状态失败: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('获取 AI 新闻状态失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取状态失败",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 触发后台更新
 */
export async function triggerAINewsUpdate(): Promise<ApiResponse<{
  needsUpdate: boolean;
  lastUpdated?: string;
  message: string;
}>> {
  try {
    const response = await fetch('/api/ai-news/update', {
      method: 'POST',
      cache: 'no-cache',
    });

    const data = await response.json();

    return {
      success: data.success,
      data: {
        needsUpdate: data.needsUpdate,
        lastUpdated: data.lastUpdated,
        message: data.message,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('触发 AI 新闻更新失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "触发更新失败",
      timestamp: new Date().toISOString(),
    };
  }
}
