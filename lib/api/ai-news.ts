import { AINewsData, AINewsItem } from "@/types/ai-news";
import { ApiResponse } from "@/types/crypto";

// 更新检查间隔（1小时）
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

// 翻译缓存
let translationsCache: Record<string, string> = {};
let translationsCacheTime = 0;
const TRANSLATIONS_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

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
 * 获取翻译缓存
 */
async function fetchTranslations(): Promise<Record<string, string>> {
  // 检查内存缓存
  const now = Date.now();
  if (translationsCache && Object.keys(translationsCache).length > 0 && (now - translationsCacheTime) < TRANSLATIONS_CACHE_TTL) {
    return translationsCache;
  }

  try {
    const response = await fetch('/data/ai-news/translations.json', {
      cache: 'no-cache',
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    translationsCache = data.translations || {};
    translationsCacheTime = now;
    return translationsCache;
  } catch (error) {
    console.warn('获取翻译缓存失败:', error);
    return {};
  }
}

/**
 * 生成翻译键
 */
function generateTranslationKey(source: string, title: string): string {
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  return `${source}-${simplified}`;
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
    
    // 获取各源数据（统一6条）
    const sourcePromises = [
      fetchSourceData('openai', 6),
      fetchSourceData('arxiv', 6),
      fetchSourceData('机器之心', 6),
      fetchSourceData('qbitai', 6),
      fetchSourceData('google-blog', 6),
      fetchSourceData('every', 6),
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
    const [response, translations] = await Promise.all([
      fetch(`/data/ai-news/${fileName}`, { cache: 'no-cache' }),
      fetchTranslations(),
    ]);
    
    if (!response.ok) {
      throw new Error(`获取 ${source} 新闻失败: ${response.status}`);
    }
    
    const data = await response.json();
    let articles = data.articles || [];
    
    // 限制条数
    articles = articles.slice(0, maxItems);
    
    const newsItems: AINewsItem[] = articles.map((article: any, index: number) => {
      const title = article.title;
      const translationKey = generateTranslationKey(source, title);
      const translatedTitle = translations[translationKey];
      
      return {
        id: `${source}-${index}`,
        title: title,
        translatedTitle: translatedTitle,
        summary: truncateSummary(article.summary || '', 200),
        url: article.url,
        source: data.source || source,
        category: article.category,
        publishedAt: article.date,
      };
    });
    
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
    '36kr': '36kr-latest.json',
    'solidot': 'solidot-latest.json',
    'google-blog': 'google-blog-latest.json',
    'every': 'every-latest.json',
    'openclaw': 'openclaw-latest.json',
    'moltbook': 'moltbook-latest.json',
  };
  return mapping[source] || 'all-sources-latest.json';
}

/**
 * 获取所有可用的新闻源（8个源）
 * 顺序：36氪、Solidot、OpenAI、arXiv、Google Blog、Every.to、OpenClaw、Moltbook
 */
export function getNewsSources(): { id: string; name: string; icon: string }[] {
  return [
    { id: '36kr', name: '36氪', icon: '💼' },
    { id: 'solidot', name: 'Solidot', icon: '📡' },
    { id: 'openai', name: 'OpenAI', icon: '🤖' },
    { id: 'arxiv', name: 'arXiv', icon: '📄' },
    { id: 'google-blog', name: 'Google Blog', icon: '🔍' },
    { id: 'every', name: 'Every.to', icon: '📰' },
    { id: 'openclaw', name: 'OpenClaw', icon: '⚡' },
    { id: 'moltbook', name: 'Moltbook', icon: '💬' },
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
