import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "小世界 AI News | AI 新闻聚合平台",
  description: "汇聚全球 AI 领域最新动态 · OpenAI · arXiv · 机器之心 · AINOW",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-[#0a0a0a]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
