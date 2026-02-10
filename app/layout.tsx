import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "小世界 No.1 | 加密货币数据监控",
  description: "BTC/ETH 实时价格与 AHR999 定投指数",
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
