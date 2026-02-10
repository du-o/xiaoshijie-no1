"use client";

import { AHR999Index } from "@/types/crypto";
import { formatCurrency, formatTime, getAHR999SignalColor, getAHR999SignalText } from "@/lib/utils/format";
import { Activity, TrendingUp, Calendar, DollarSign } from "lucide-react";

interface AHR999CardProps {
  data: AHR999Index;
  btcPrice: number;  // 实时 BTC 价格
}

export function AHR999Card({ data, btcPrice }: AHR999CardProps) {
  const signalClass = getAHR999SignalColor(data.signal);
  const signalText = getAHR999SignalText(data.signal);
  
  // 计算进度条位置 (0-2 范围映射到 0-100%)
  const progressPercent = Math.min(Math.max((data.value / 2) * 100, 0), 100);
  
  // 根据数值确定颜色
  const getValueColor = (value: number) => {
    if (value < 0.45) return "text-green-500";
    if (value <= 1.2) return "text-yellow-500";
    return "text-red-500";
  };
  
  const valueColor = getValueColor(data.value);

  return (
    <div className="card">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AHR999 定投指数</h3>
            <span className="text-sm text-gray-400">比特币定投参考指标</span>
          </div>
        </div>
        
        <div className={`status-badge ${signalClass}`}>
          {signalText}
        </div>
      </div>

      {/* 指数值展示 */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <span className={`text-6xl font-bold tracking-tight ${valueColor}`}>
            {data.value.toFixed(3)}
          </span>
          <span className="text-gray-400 text-lg">指数值</span>
        </div>
        
        {/* 进度条 */}
        <div className="relative">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${
                data.value < 0.45 ? "bg-green-500" : 
                data.value <= 1.2 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          {/* 刻度标记 */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span className="text-green-500">0.45</span>
            <span className="text-yellow-500">1.2</span>
            <span>2.0</span>
          </div>
        </div>
        
        {/* 区间说明 */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-400">&lt; 0.45 定投</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-400">0.45-1.2 持有</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-400">&gt; 1.2 卖出</span>
          </div>
        </div>
      </div>

      {/* 详细数据网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>当前价格</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {formatCurrency(btcPrice, "USD").replace("US$", "$")}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>200日均价</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {formatCurrency(data.avgPrice200d, "USD").replace("US$", "$")}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>增长系数</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {data.growthFactor.toFixed(4)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            <span>更新时间</span>
          </div>
          <p className="text-sm font-medium text-white">
            {formatTime(data.lastUpdated)}
          </p>
        </div>
      </div>
    </div>
  );
}
