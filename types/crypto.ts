// 加密货币数据类型定义
// 支持当前数值展示，预留趋势数据扩展

export interface CryptoPrice {
  symbol: string;           // 币种符号，如 BTC
  name: string;             // 币种名称，如 Bitcoin
  priceUsd: number;         // 美元价格
  priceCny: number;         // 人民币价格
  change24h: number;        // 24小时涨跌幅 (%)
  marketCap?: number;       // 市值（可选）
  volume24h?: number;       // 24小时交易量（可选）
  lastUpdated: string;      // 最后更新时间 ISO 格式
}

// AHR999 指数数据
export interface AHR999Index {
  value: number;            // 当前指数值
  signal: 'accumulate' | 'hold' | 'sell';  // 信号：定投、持有、卖出
  price: number;            // 当前价格
  avgPrice200d: number;     // 200日平均价格
  growthFactor: number;     // 价格增长系数
  lastUpdated: string;      // 最后更新时间
}

// 趋势数据点（用于图表）
export interface TrendPoint {
  timestamp: string;        // 时间点
  value: number;            // 数值
}

// 加密货币完整数据（含趋势）
export interface CryptoDataWithTrend extends CryptoPrice {
  priceHistory: TrendPoint[];  // 价格历史（预留）
}

// AHR999 历史数据（预留）
export interface AHR999WithTrend extends AHR999Index {
  history: TrendPoint[];    // 指数历史
}

// API 响应统一格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
