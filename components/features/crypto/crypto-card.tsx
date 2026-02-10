"use client";

import { CryptoPrice } from "@/types/crypto";
import { formatCurrency, formatPercent, formatTime, getChangeColorClass } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface CryptoCardProps {
  data: CryptoPrice;
}

export function CryptoCard({ data }: CryptoCardProps) {
  const isPositive = data.change24h >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const glowClass = isPositive ? "glow-green" : "glow-red";

  return (
    <div className="card card-hover">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* 币种图标 */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
            data.symbol === "BTC" 
              ? "bg-gradient-to-br from-orange-500 to-orange-600" 
              : "bg-gradient-to-br from-blue-500 to-purple-600"
          }`}>
            {data.symbol === "BTC" ? "₿" : "Ξ"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{data.name}</h3>
            <span className="text-sm text-gray-400">{data.symbol}</span>
          </div>
        </div>
        
        {/* 涨跌幅标签 */}
        <div className={`status-badge ${isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          <div className="flex items-center gap-1">
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{formatPercent(data.change24h)}</span>
          </div>
        </div>
      </div>

      {/* 价格展示 */}
      <div className="space-y-3">
        <div>
          <span className="text-4xl font-bold text-white tracking-tight">
            {formatCurrency(data.priceUsd, "USD").replace("US$", "$")}
          </span>
        </div>
        <div className="text-lg text-gray-400">
          ≈ {formatCurrency(data.priceCny, "CNY")}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>更新于 {formatTime(data.lastUpdated)}</span>
      </div>
    </div>
  );
}
