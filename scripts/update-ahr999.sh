#!/bin/bash
# 更新AHR999数据脚本
# 此脚本由定时任务调用，更新数据后自动推送到GitHub

set -e

WORKSPACE="/home/induo/.openclaw/workspace-build/xiaoshijie-no1"
DATA_FILE="$WORKSPACE/public/data/ahr999.json"
REPO_URL="https://github.com/duo/ahr999-tracker.git"

echo "[$(date)] 开始更新AHR999数据..."

# 获取最新BTC价格和200日历史数据
echo "获取BTC数据..."
CURRENT_PRICE=$(curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd" | grep -o '"usd":[0-9.]*' | cut -d: -f2)

if [ -z "$CURRENT_PRICE" ]; then
    echo "错误: 无法获取BTC价格"
    exit 1
fi

echo "当前BTC价格: $CURRENT_PRICE"

# 获取200日历史数据并计算均价
echo "计算200日均价..."
HISTORY_DATA=$(curl -s "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200")

# 使用Node.js计算均价和ahr999指数
node -e "
const prices = $(echo "$HISTORY_DATA" | node -e "const data = ''; process.stdin.on('data', c => data.push(c)); process.stdin.on('end', () => console.log(JSON.stringify(JSON.parse(data.join('')).prices.map(p => p[1]))))");
const currentPrice = $CURRENT_PRICE;
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
const ahr999 = currentPrice / avgPrice;

let signal;
if (ahr999 < 0.45) signal = 'accumulate';
else if (ahr999 <= 1.2) signal = 'hold';
else signal = 'sell';

const fs = require('fs');
fs.writeFileSync('$DATA_FILE', JSON.stringify({
  value: parseFloat(ahr999.toFixed(3)),
  signal: signal,
  price: currentPrice,
  avgPrice200d: parseFloat(avgPrice.toFixed(2)),
  growthFactor: parseFloat((currentPrice / avgPrice).toFixed(3)),
  lastUpdated: new Date().toISOString()
}, null, 2));
console.log('数据已更新:', { value: ahr999.toFixed(3), signal, price: currentPrice });
"

echo "数据文件已更新: $DATA_FILE"

# 检查是否有变更
if ! git -C "$WORKSPACE" diff --quiet public/data/ahr999.json 2>/dev/null; then
    echo "检测到数据变更，准备提交..."
    
    cd "$WORKSPACE"
    git add public/data/ahr999.json
    git commit -m "chore: update ahr999 data [$(date +%Y-%m-%d)]"
    
    # 推送到GitHub
    git push origin main
    echo "已推送到GitHub，Vercel将自动部署"
else
    echo "数据无变更，跳过提交"
fi

echo "[$(date)] 更新完成"
