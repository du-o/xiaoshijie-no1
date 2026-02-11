import { AINewsDashboard } from "@/components/features/ai-news/ai-news-dashboard";
import { OpenClawNewsSection } from "@/components/features/openclaw/openclaw-news-section";
import { MoltbookSection } from "@/components/features/moltbook/moltbook-section";
import { Sparkles, Github, MessageCircle } from "lucide-react";

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

      {/* AI News Dashboard - 核心位置 */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <AINewsDashboard />
        </div>
      </section>

      {/* OpenClaw & Moltbook Section */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OpenClaw */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Github className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">OpenClaw 动态</h3>
              </div>
              <OpenClawNewsSection />
            </div>

            {/* Moltbook */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Moltbook 热帖</h3>
              </div>
              <MoltbookSection />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>数据来源：OpenAI News · arXiv CS.AI · 机器之心 · 量子位 · GitHub · Moltbook</p>
        </div>
      </footer>
    </main>
  );
}
