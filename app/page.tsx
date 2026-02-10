import { CryptoDashboard } from "@/components/features/crypto/crypto-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            小世界 <span className="text-gradient">No.1</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            加密货币数据监控面板 · 实时价格 · AHR999 定投指数
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>数据实时更新中</span>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <CryptoDashboard />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>数据来源：CoinGecko API | AHR999 指数</p>
        </div>
      </footer>
    </main>
  );
}
