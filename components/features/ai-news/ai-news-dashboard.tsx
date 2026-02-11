"use client";

import { useEffect, useState } from "react";
import { useAINewsBySource } from "@/hooks/use-ai-news";
import { NewsList } from "./news-list";
import { getNewsSources } from "@/lib/api/ai-news";
import { Newspaper } from "lucide-react";

// 元数据类型
interface NewsMeta {
  lastUpdated: string;
  lastUpdatedFormatted: string;
}

export function AINewsDashboard() {
  const [meta, setMeta] = useState<NewsMeta | null>(null);

  // 获取消息源数据（排除 'all'）
  const sources = getNewsSources().filter((s) => s.id !== "all");

  // 为每个消息源获取数据
  const newsQueries = sources.map((source) => ({
    source,
    ...useAINewsBySource(source.id),
  }));

  // 加载 meta.json 获取更新时间
  useEffect(() => {
    fetch("/data/ai-news/meta.json")
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch((err) => console.error("加载 meta.json 失败:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI 新闻聚合</h2>
            <p className="text-sm text-gray-400">来自多个来源的最新 AI 资讯</p>
          </div>
        </div>

        {/* 更新时间说明 */}
        <div className="text-right">
          {meta && (
            <p className="text-sm text-gray-400">
              数据更新时间：{meta.lastUpdatedFormatted}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            每天 8:00、12:00、16:00、20:00 自动更新
          </p>
        </div>
      </div>

      {/* 2x2 网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {newsQueries.map(({ source, data, isLoading, error }) => (
          <div key={source.id} className="card p-4">
            {/* 卡片标题 */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <span className="text-lg">{source.icon}</span>
              <h3 className="font-semibold text-white">{source.name}</h3>
              {data && (
                <span className="text-xs text-gray-500 ml-auto">
                  {data.length} 条
                </span>
              )}
            </div>

            {/* 新闻列表 */}
            <NewsList
              items={data || []}
              isLoading={isLoading}
              error={error}
              emptyText={`暂无 ${source.name} 新闻`}
              maxItems={6}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
