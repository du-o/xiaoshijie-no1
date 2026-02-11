"use client";

import { AINewsItem } from "@/types/ai-news";
import { ExternalLink } from "lucide-react";

interface NewsItemProps {
  item: AINewsItem;
}

export function NewsItem({ item }: NewsItemProps) {
  // 格式化时间（智能显示：今天、昨天、M月D日、X小时前、X分钟前）
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // 1小时内：显示分钟前
      if (diffMinutes < 60 && diffMinutes >= 0) {
        return diffMinutes < 1 ? "刚刚" : `${diffMinutes}分钟前`;
      }
      
      // 24小时内：显示小时前
      if (diffHours < 24 && diffHours >= 0) {
        return `${diffHours}小时前`;
      }
      
      // 昨天
      if (diffDays === 1) {
        return "昨天";
      }
      
      // 7天内：显示X天前
      if (diffDays < 7 && diffDays > 1) {
        return `${diffDays}天前`;
      }
      
      // 其他日期：M月D日
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    } catch {
      return dateStr;
    }
  };

  // 格式化完整时间：YYYY年M月D日 HH:mm
  const formatFullTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // 获取分类标签
  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    return (
      <span className="px-1.5 py-0.5 text-xs rounded-full bg-white/5 text-gray-400">
        {category}
      </span>
    );
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 标题和时间 */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-white break-words group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>
            <span className="text-xs text-gray-500 shrink-0">
              {formatTime(item.publishedAt)}
            </span>
          </div>
          
          {/* 摘要 */}
          {item.summary && (
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-3">
              {item.summary}
            </p>
          )}
          
          {/* 分类标签和来源 */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {getCategoryBadge(item.category)}
            {item.source && (
              <span className="text-xs text-gray-500">
                @{item.source}
              </span>
            )}
            <span className="text-xs text-gray-500">
              · {formatFullTime(item.publishedAt)}
            </span>
          </div>
        </div>
        
        {/* 外部链接图标 */}
        <div className="shrink-0 pt-0.5">
          <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </a>
  );
}
