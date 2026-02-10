import { CryptoPrice, AHR999Index, ApiResponse } from "@/types/crypto";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

/**
 * 获取加密货币价格数据
 */
export async function fetchCryptoPrices(): Promise<ApiResponse<CryptoPrice[]>> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,cny&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    const prices: CryptoPrice[] = [
      {
        symbol: "BTC",
        name: "Bitcoin",
        priceUsd: data.bitcoin.usd,
        priceCny: data.bitcoin.cny,
        change24h: data.bitcoin.usd_24h_change || 0,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        priceUsd: data.ethereum.usd,
        priceCny: data.ethereum.cny,
        change24h: data.ethereum.usd_24h_change || 0,
        lastUpdated: new Date().toISOString(),
      },
    ];

    return {
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 获取 AHR999 指数
 * 从静态 JSON 文件读取数据（部署时包含在构建中）
 */
export async function fetchAHR999(): Promise<ApiResponse<AHR999Index>> {
  try {
    // 从 public 目录下的静态文件读取
    const response = await fetch('/data/ahr999.json', { 
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error('AHR999 数据暂不可用');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        value: data.value,
        signal: data.signal,
        price: data.price,
        avgPrice200d: data.avgPrice200d,
        growthFactor: data.growthFactor,
        lastUpdated: data.lastUpdated,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      timestamp: new Date().toISOString(),
    };
  }
}
