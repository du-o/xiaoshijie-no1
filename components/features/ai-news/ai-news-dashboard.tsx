"use client";

import { useEffect, useState, useRef } from "react";
import { useAINewsBySource } from "@/hooks/use-ai-news";
import { NewsList } from "./news-list";
import { getNewsSources } from "@/lib/api/ai-news";
import { Loader2 } from "lucide-react";

// 元数据类型
interface NewsMeta {
  lastUpdated: string;
  lastUpdatedFormatted: string;
}

export function AINewsDashboard() {
  const [meta, setMeta] = useState<NewsMeta | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 获取所有8个消息源
  const sources = getNewsSources();

  // 为每个消息源获取数据
  const newsQueries = sources.map((source) => ({
    source,
    ...useAINewsBySource(source.id),
  }));

  // 加载 meta.json 获取更新时间
  useEffect(() => {
    fetch("/data/ai-news/meta.json")
      .then((res) => res.json())
      .then((data) => {
        // 格式化时间
        const lastUpdated = new Date(data.lastUpdated);
        const formatted = lastUpdated.toLocaleString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        setMeta({
          lastUpdated: data.lastUpdated,
          lastUpdatedFormatted: formatted,
        });
      })
      .catch((err) => console.error("加载 meta.json 失败:", err));
  }, []);

  // 监听滚动，更新当前激活的导航项
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // 偏移量
      
      for (const source of sources) {
        const element = sectionRefs.current[source.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(source.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sources]);

  // 平滑滚动到指定模块
  const scrollToSection = (sourceId: string) => {
    const element = sectionRefs.current[sourceId];
    if (element) {
      const navHeight = 80; // 导航栏高度
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
      setActiveSection(sourceId);
    }
  };

  return (
    <div className="space-y-8">
      {/* 顶部横向滚动导航栏 */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 py-3 -mx-4 px-4">
        <div className="flex items-center justify-between gap-4">
          {/* 导航项 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => scrollToSection(source.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === source.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">{source.icon}</span>
                <span className="text-sm font-medium">{source.name}</span>
              </button>
            ))}
          </div>

          {/* 更新时间 */}
          {meta && (
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-gray-500">
                更新于 {meta.lastUpdatedFormatted}
              </p>
            </div>
          )}
        </div>
      </nav>

      {/* 8个信息源平级展示 - 3列网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsQueries.map(({ source, data, isLoading, error }) => (
          <div
            key={source.id}
            ref={(el) => { sectionRefs.current[source.id] = el; }}
            id={`section-${source.id}`}
            className="card p-4 scroll-mt-24"
          >
            {/* 卡片标题 */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <span className="text-xl">{source.icon}</span>
              <h3 className="font-semibold text-white">{source.name}</h3>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />
              )}
              {data && !isLoading && (
                <span className="text-xs text-gray-500 ml-auto">
                  {data.length} 条
                </span>
              )}
            </div>

            {/* 新闻列表 - 固定6条 */}
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

      {/* 更新时间说明（移动端显示） */}
      {meta && (
        <div className="text-center sm:hidden">
          <p className="text-xs text-gray-500">
            数据更新时间：{meta.lastUpdatedFormatted}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            每天 8:00、12:00、16:00、20:00 自动更新
          </p>
        </div>
      )}
    </div>
  );
}
