// 工具函数

/**
 * 格式化货币金额
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === 'USD' ? 2 : 2,
  });
  return formatter.format(value);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 格式化时间
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取涨跌幅颜色类名
 */
export function getChangeColorClass(value: number): string {
  return value >= 0 ? 'text-green-400' : 'text-red-400';
}

/**
 * 获取 AHR999 信号颜色
 */
export function getAHR999SignalColor(signal: string): string {
  switch (signal) {
    case 'accumulate':
      return 'text-green-400 bg-green-400/10';
    case 'hold':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'sell':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-slate-400 bg-slate-400/10';
  }
}

/**
 * 获取 AHR999 信号中文文本
 */
export function getAHR999SignalText(signal: string): string {
  switch (signal) {
    case 'accumulate':
      return '定投区间';
    case 'hold':
      return '持有观望';
    case 'sell':
      return '卖出区间';
    default:
      return '未知';
  }
}
