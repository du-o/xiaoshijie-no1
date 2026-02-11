"use client";

import { AINewsItem } from "@/types/ai-news";
import { NewsItem } from "./news-item";
import { Loader2 } from "lucide-react";

interface NewsListProps {
  items: AINewsItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyText?: string;
  maxItems?: number;
}

export function NewsList({ 
  items, 
  isLoading, 
  error, 
  emptyText = "暂无新闻",
  maxItems = 6
}: NewsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        加载失败: {error.message}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400 text-center">
        {emptyText}
      </div>
    );
  }

  // 限制显示数量
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="space-y-2">
      {displayItems.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </div>
  );
}
