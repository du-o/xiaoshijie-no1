import { MoltbookPost } from "@/types/moltbook";
import { ApiResponse } from "@/types/crypto";

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
const MOLTBOOK_API_KEY = "moltbook_sk__c-otDzzeAd2f-wpAq3VxGYylKUr6dn7";

/**
 * 获取 Moltbook 热门帖子
 */
export async function fetchMoltbookHotPosts(): Promise<ApiResponse<MoltbookPost[]>> {
  try {
    const response = await fetch(`${MOLTBOOK_API}/posts?sort=hot&limit=10`, {
      headers: {
        "Authorization": `Bearer ${MOLTBOOK_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Moltbook API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "获取 Moltbook 数据失败");
    }
    
    // 处理响应数据
    const posts: MoltbookPost[] = (data.posts || []).map((post: any) => ({
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
    
    return {
      success: true,
      data: posts,
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
