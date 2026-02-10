/**
 * GitHub Actions 使用的数据更新脚本
 * 计算AHR999指数并更新JSON文件
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'ahr999.json');
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function updateAHR999() {
  console.log('开始更新AHR999数据...');
  
  try {
    // 获取当前BTC价格
    console.log('获取BTC当前价格...');
    const priceData = await fetchJSON(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`);
    const currentPrice = priceData.bitcoin.usd;
    console.log(`当前BTC价格: $${currentPrice}`);
    
    // 获取200日历史数据
    console.log('获取200日历史数据...');
    const historyData = await fetchJSON(`${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=200`);
    const prices = historyData.prices.map(p => p[1]);
    
    // 计算200日均价
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    console.log(`200日均价: $${avgPrice.toFixed(2)}`);
    
    // 计算ahr999指数
    const ahr999 = currentPrice / avgPrice;
    console.log(`AHR999指数: ${ahr999.toFixed(3)}`);
    
    // 判断信号
    let signal;
    if (ahr999 < 0.45) signal = 'accumulate';
    else if (ahr999 <= 1.2) signal = 'hold';
    else signal = 'sell';
    console.log(`信号: ${signal}`);
    
    // 构建数据对象
    const data = {
      value: parseFloat(ahr999.toFixed(3)),
      signal: signal,
      price: currentPrice,
      avgPrice200d: parseFloat(avgPrice.toFixed(2)),
      growthFactor: parseFloat((currentPrice / avgPrice).toFixed(3)),
      lastUpdated: new Date().toISOString()
    };
    
    // 确保目录存在
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`数据已保存到: ${DATA_FILE}`);
    console.log('更新完成:', data);
    
  } catch (error) {
    console.error('更新失败:', error.message);
    process.exit(1);
  }
}

updateAHR999();
