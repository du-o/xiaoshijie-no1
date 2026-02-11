import { MoltbookPost } from "@/types/moltbook";
import { ApiResponse } from "@/types/crypto";

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
const MOLTBOOK_API_KEY = "moltbook_sk__c-otDzzeAd2f-wpAq3VxGYylKUr6dn7";

// 本地数据文件路径
const MOLTBOOK_POSTS_URL = "/data/ai-news/moltbook-posts.json";
const MOLTBOOK_TRANSLATIONS_URL = "/data/ai-news/moltbook-translations.json";

/**
 * 检测文本是否为英文
 */
function isEnglishText(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return englishChars > 10 && chineseChars < text.length * 0.1;
}

/**
 * 生成翻译键
 */
function generateTranslationKey(title: string): string {
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `moltbook-${simplified}`;
}

/**
 * 获取 Moltbook 翻译缓存
 */
async function fetchTranslations(): Promise<Record<string, string>> {
  try {
    const response = await fetch(MOLTBOOK_TRANSLATIONS_URL, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      return data.translations || {};
    }
  } catch (error) {
    console.warn("读取 Moltbook 翻译缓存失败:", error);
  }
  return {};
}

/**
 * 从本地 JSON 文件获取 Moltbook 帖子
 */
async function fetchLocalPosts(): Promise<MoltbookPost[] | null> {
  try {
    const response = await fetch(MOLTBOOK_POSTS_URL, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      return data.posts || null;
    }
  } catch (error) {
    console.warn("读取本地 Moltbook 数据失败:", error);
  }
  return null;
}

/**
 * 从 API 获取 Moltbook 热门帖子
 */
async function fetchApiPosts(): Promise<MoltbookPost[]> {
  const response = await fetch(`${MOLTBOOK_API}/posts?sort=hot&limit=10`, {
    headers: {
      Authorization: `Bearer ${MOLTBOOK_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Moltbook API 请求失败: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "获取 Moltbook 数据失败");
  }

  return (data.posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content || "",
    author: post.author?.name || "Unknown",
    submolt: post.submolt?.name || "general",
    upvotes: post.upvotes || 0,
    downvotes: post.downvotes || 0,
    commentCount: post.comment_count || 0,
    createdAt: post.created_at,
  }));
}

/**
 * 获取 Moltbook 热门帖子（带翻译）
 */
export async function fetchMoltbookHotPosts(): Promise<ApiResponse<MoltbookPost[]>> {
  try {
    // 优先从本地 JSON 读取
    let posts = await fetchLocalPosts();
    
    // 如果本地没有数据，从 API 获取
    if (!posts) {
      posts = await fetchApiPosts();
    }

    // 获取翻译缓存
    const translations = await fetchTranslations();

    // 为每个帖子添加翻译
    const postsWithTranslation = posts.map((post) => {
      const translationKey = generateTranslationKey(post.title);
      const translatedTitle = translations[translationKey];
      
      return {
        ...post,
        translatedTitle: isEnglishText(post.title) ? (translatedTitle || null) : null,
      };
    });

    return {
      success: true,
      data: postsWithTranslation,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取 Moltbook 热帖失败",
      timestamp: new Date().toISOString(),
    };
  }
}
