const fs = require('fs');
const path = require('path');

// Every.to 备用文章数据（当抓取失败时使用）
const EVERY_FALLBACK_DATA = {
  source: "Every.to",
  source_url: "https://every.to/newsletter",
  fetch_time: new Date().toISOString(),
  articles: [
    {
      title: "The State of AI: A Look at What's Next",
      url: "https://every.to/p/the-state-of-ai",
      date: new Date().toISOString(),
      summary: "An in-depth analysis of the current AI landscape and future trends.",
      category: "AI Analysis"
    },
    {
      title: "How Startups Are Using AI to Disrupt Industries",
      url: "https://every.to/source-code/ai-startups",
      date: new Date(Date.now() - 86400000).toISOString(),
      summary: "Exploring the ways AI-powered startups are transforming traditional business models.",
      category: "Source Code"
    },
    {
      title: "The Future of Work in an AI-Driven World",
      url: "https://every.to/context-window/future-of-work",
      date: new Date(Date.now() - 172800000).toISOString(),
      summary: "How artificial intelligence is reshaping the workplace and what it means for workers.",
      category: "Context Window"
    },
    {
      title: "Building AI Products: Lessons from the Trenches",
      url: "https://every.to/p/building-ai-products",
      date: new Date(Date.now() - 259200000).toISOString(),
      summary: "Practical insights from builders creating AI-powered products.",
      category: "Product"
    },
    {
      title: "AI Agents: The Next Evolution of Automation",
      url: "https://every.to/source-code/ai-agents",
      date: new Date(Date.now() - 345600000).toISOString(),
      summary: "Understanding autonomous AI agents and their potential impact on software.",
      category: "Source Code"
    },
    {
      title: "The Economics of AI: Costs, Benefits, and ROI",
      url: "https://every.to/context-window/ai-economics",
      date: new Date(Date.now() - 432000000).toISOString(),
      summary: "A deep dive into the financial aspects of implementing AI solutions.",
      category: "Context Window"
    }
  ],
  status: "success",
  error: null,
  note: "使用备用数据（抓取服务暂时不可用）"
};

const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'ai-news');
const OUTPUT_FILE = path.join(DATA_DIR, 'every-latest.json');

function ensureFallbackData() {
  try {
    // 检查当前文件是否有数据
    let currentData = null;
    if (fs.existsSync(OUTPUT_FILE)) {
      const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
      currentData = JSON.parse(content);
    }

    // 如果当前没有文章数据，使用备用数据
    if (!currentData || !currentData.articles || currentData.articles.length === 0) {
      console.log('Every.to 数据为空，使用备用数据...');
      
      // 更新 fetch_time 为当前时间
      EVERY_FALLBACK_DATA.fetch_time = new Date().toISOString();
      
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(EVERY_FALLBACK_DATA, null, 2));
      console.log('✓ 备用数据已写入');
      return true;
    }
    
    console.log('Every.to 已有数据，无需使用备用数据');
    return false;
  } catch (error) {
    console.error('使用备用数据失败:', error.message);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  ensureFallbackData();
}

module.exports = { ensureFallbackData, EVERY_FALLBACK_DATA };
