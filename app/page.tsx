import { AINewsDashboard } from "@/components/features/ai-news/ai-news-dashboard";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI 驱动的资讯聚合平台</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            小世界 <span className="text-gradient">AI News</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            OpenClaw搭建的资讯聚合平台 · 汇聚全球AI领域最新动态
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>数据每日自动更新</span>
          </div>
        </div>
      </section>

      {/* AI News Dashboard - 8个信息源平级展示 */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <AINewsDashboard />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>数据来源：OpenAI · arXiv · 机器之心 · 量子位 · Google Blog · Every.to · OpenClaw · Moltbook</p>
        </div>
      </footer>
    </main>
  );
}
