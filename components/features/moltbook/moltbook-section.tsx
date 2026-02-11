"use client";

import { useMoltbookPosts } from "@/hooks/use-news";
import { Loader2, ExternalLink, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { formatTime } from "@/lib/utils/format";

export function MoltbookSection() {
  const { data: posts, isLoading, error } = useMoltbookPosts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 card">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 card border-red-500/30 text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts?.slice(0, 5).map((post) => (
        <a
          key={post.id}
          href={`https://moltbook.com/post/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block card card-hover p-4 group"
        >
          <div className="flex items-start gap-3">
            {/* 投票区 */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <ArrowUp className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-white">{post.upvotes - post.downvotes}</span>
              <ArrowDown className="w-5 h-5 text-gray-500" />
            </div>
            
            {/* 内容区 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium line-clamp-2 group-hover:text-orange-400 transition-colors">
                {post.title}
              </h4>
              
              {post.content && (
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {post.content}
                </p>
              )}
              
              <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                <span className="text-orange-400">@{post.author}</span>
                <span>•</span>
                <span>{formatTime(post.createdAt)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{post.commentCount}</span>
                </div>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
