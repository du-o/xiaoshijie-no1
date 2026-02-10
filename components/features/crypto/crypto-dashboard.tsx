"use client";

import { useCryptoPrices, useAHR999 } from "@/hooks/use-crypto";
import { CryptoCard } from "./crypto-card";
import { AHR999Card } from "./ahr999-card";
import { Loader2 } from "lucide-react";

export function CryptoDashboard() {
  const { data: prices, isLoading: pricesLoading, error: pricesError } = useCryptoPrices();
  const { data: ahr999, isLoading: ahr999Loading, error: ahr999Error } = useAHR999();

  // 获取 BTC 实时价格
  const btcPrice = prices?.find(p => p.symbol === "BTC")?.priceUsd;

  return (
    <div className="space-y-6">
      {/* 实时价格区域 */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-white">实时价格</h2>
        </div>
        
        {pricesLoading ? (
          <div className="flex items-center justify-center h-40 card">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : pricesError ? (
          <div className="p-6 card border-red-500/30 text-red-400">
            加载失败: {pricesError.message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prices?.map((crypto) => (
              <CryptoCard key={crypto.symbol} data={crypto} />
            ))}
          </div>
        )}
      </section>

      {/* AHR999 指数区域 */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-white">AHR999 定投指数</h2>
        </div>
        
        {ahr999Loading || pricesLoading ? (
          <div className="flex items-center justify-center h-40 card">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : ahr999Error ? (
          <div className="p-6 card border-yellow-500/30 text-yellow-400">
            AHR999 数据暂不可用: {ahr999Error.message}
          </div>
        ) : ahr999 && btcPrice ? (
          <AHR999Card data={ahr999} btcPrice={btcPrice} />
        ) : null}
      </section>
    </div>
  );
}
