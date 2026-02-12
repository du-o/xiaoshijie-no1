/**
 * HTML 抓取脚本 - 用于抓取 Google Blog 和 Every.to
 * 使用 jina.ai 代理获取文章内容
 */

const fs = require('fs');
const path = require('path');

// 配置
const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'ai-news');

// HTML 数据源配置
const HTML_SOURCES = [
  {
    name: 'google-blog',
    displayName: 'Google Blog',
    file: 'google-blog-latest.json',
    url: 'https://blog.google',
    jinaUrl: 'https://r.jina.ai/http://blog.google.com',
    parser: 'parseGoogleBlog',
  },
  {
    name: 'every',
    displayName: 'Every.to',
    file: 'every-latest.json',
    url: 'https://every.to/newsletter',
    jinaUrl: 'https://r.jina.ai/http://every.to/newsletter',
    parser: 'parseEvery',
  },
];

/**
 * 获取当前时间的 ISO 字符串
 */
function getNowISO() {
  return new Date().toISOString();
}

/**
 * 发送 HTTP 请求获取 HTML 内容
 */
async function fetchHTML(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }
}

/**
 * 解析 Google Blog 内容
 * 通过 jina.ai 获取 markdown 格式内容
 */
function parseGoogleBlog(html, baseUrl) {
  const articles = [];
  
  // 按行分割
  const lines = html.split('\n');
  
  // 查找文章链接模式
  // 格式通常是: [标题](https://blog.google/...)
  const articleRegex = /\[([^\]]+)\]\((https:\/\/blog\.google\/[^)]+)\)/;
  
  // 已处理的 URL，用于去重
  const seenUrls = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和图片
    if (!line || line.startsWith('![')) continue;
    
    const match = line.match(articleRegex);
    if (!match) continue;
    
    const title = match[1].trim();
    let url = match[2].trim();
    
    // 跳过分类页面和作者页面
    if (url.includes('/authors/') || 
        url.endsWith('/innovation-and-ai/') || 
        url.endsWith('/products/') || 
        url.endsWith('/platforms/') ||
        url.endsWith('/company-news/') ||
        url.endsWith('/safety-security/') ||
        url.endsWith('/models-and-research/') ||
        url.endsWith('/inside-google/') ||
        url.endsWith('/around-the-globe/') ||
        url.endsWith('/google-asia/') ||
        url.endsWith('/google-deepmind/')) {
      continue;
    }
    
    // 去重
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    
    // 清理标题
    let cleanTitle = title
      .replace(/^###\s+/, '') // 移除 markdown 标题标记
      .replace(/\s+/g, ' ')
      .trim();
    
    // 跳过太短的标题或分类名称
    if (cleanTitle.length < 15 || 
        cleanTitle === 'Innovation & AI' ||
        cleanTitle === 'Products & platforms' ||
        cleanTitle === 'Company news' ||
        cleanTitle === 'Safety & Security' ||
        cleanTitle === 'Google DeepMind' ||
        cleanTitle === 'Google in Asia') {
      continue;
    }
    
    // 提取分类
    const category = extractCategory(url);
    
    articles.push({
      title: cleanTitle,
      url: url,
      date: getNowISO(),
      summary: '',
      category: category,
    });
    
    // 最多取6条
    if (articles.length >= 6) break;
  }
  
  return articles;
}

/**
 * 从 URL 提取分类
 */
function extractCategory(url) {
  if (url.includes('/innovation-and-ai/')) return 'Innovation & AI';
  if (url.includes('/products/')) return 'Products';
  if (url.includes('/company-news/')) return 'Company';
  return 'Google';
}

/**
 * 解析 Every.to Newsletter 内容
 */
function parseEvery(html, baseUrl) {
  const articles = [];
  
  // 按行分割
  const lines = html.split('\n');
  
  // 已处理的 URL，用于去重
  const seenUrls = new Set();
  
  // Every.to 的文章链接格式: [### Title](https://every.to/...)
  // URL 格式: https://every.to/source-code/..., https://every.to/context-window/..., etc.
  const articleRegex = /\[(?:###\s*)?([^\]]+)\]\((https:\/\/every\.to\/(?:(?:source-code|context-window|on-every|podcast|playtesting|vibe-check|also-true-for-humans|p)\/[^)]+))\)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和图片
    if (!line || line.startsWith('![')) continue;
    
    const match = line.match(articleRegex);
    if (!match) continue;
    
    const title = match[1].trim();
    const url = match[2].trim();
    
    // 去重
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    
    // 跳过导航链接
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('sign in') || 
        lowerTitle.includes('subscribe') ||
        lowerTitle.includes('home') ||
        lowerTitle.includes('newsletter') ||
        lowerTitle.includes('columnists') ||
        lowerTitle.includes('columns') ||
        lowerTitle.includes('podcast') ||
        lowerTitle.includes('products') ||
        lowerTitle.includes('events') ||
        lowerTitle.includes('consulting') ||
        lowerTitle.includes('store') ||
        lowerTitle.includes('search') ||
        lowerTitle.includes('about us') ||
        lowerTitle.includes('jobs') ||
        lowerTitle.includes('advertise') ||
        lowerTitle.includes('the team') ||
        lowerTitle.includes('faq') ||
        lowerTitle.includes('help center') ||
        lowerTitle.includes('popular') ||
        lowerTitle.includes('newest') ||
        lowerTitle.includes('oldest')) {
      continue;
    }
    
    // 提取分类
    const category = extractEveryCategory(url);
    
    // 清理标题 - 移除多余空格
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    
    // 跳过太短的标题
    if (cleanTitle.length < 10) continue;
    
    articles.push({
      title: cleanTitle,
      url: url,
      date: getNowISO(),
      summary: '',
      category: category,
    });
    
    // 最多取6条
    if (articles.length >= 6) break;
  }
  
  return articles;
}

/**
 * 从 Every.to URL 提取分类
 */
function extractEveryCategory(url) {
  if (url.includes('/source-code/')) return 'Source Code';
  if (url.includes('/context-window/')) return 'Context Window';
  if (url.includes('/on-every/')) return 'On Every';
  if (url.includes('/podcast/')) return 'Podcast';
  if (url.includes('/playtesting/')) return 'Playtesting';
  if (url.includes('/vibe-check/')) return 'Vibe Check';
  if (url.includes('/also-true-for-humans/')) return 'Also True for Humans';
  if (url.includes('/p/')) return 'Article';
  return 'Every';
}

/**
 * 抓取单个 HTML 数据源
 */
async function fetchHTMLSource(source) {
  console.log(`\n[${source.name}] 开始抓取...`);

  try {
    // 使用 jina.ai 获取 markdown 格式内容
    console.log(`[${source.name}] 使用 jina.ai 代理: ${source.jinaUrl}`);
    const html = await fetchHTML(source.jinaUrl);
    
    // 解析内容
    let articles = [];
    if (source.parser === 'parseGoogleBlog') {
      articles = parseGoogleBlog(html, source.url);
    } else if (source.parser === 'parseEvery') {
      articles = parseEvery(html, source.url);
    }

    console.log(`[${source.name}] 获取到 ${articles.length} 篇文章`);

    // 构建输出数据
    const output = {
      source: source.displayName,
      source_url: source.url,
      fetch_time: getNowISO(),
      articles: articles,
      status: 'success',
      error: null,
    };

    // 写入文件
    const outputPath = path.join(DATA_DIR, source.file);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`[${source.name}] ✓ 已保存到 ${source.file}`);

    return {
      success: true,
      count: articles.length,
      source: source.name,
    };
  } catch (error) {
    console.error(`[${source.name}] ✗ 抓取失败: ${error.message}`);

    // 写入错误状态
    const output = {
      source: source.displayName,
      source_url: source.url,
      fetch_time: getNowISO(),
      articles: [],
      status: 'error',
      error: error.message,
    };

    const outputPath = path.join(DATA_DIR, source.file);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    return {
      success: false,
      error: error.message,
      source: source.name,
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== HTML 抓取脚本 ===');
  console.log(`开始时间: ${getNowISO()}`);

  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`创建目录: ${DATA_DIR}`);
  }

  // 抓取所有 HTML 源
  const results = [];
  for (const source of HTML_SOURCES) {
    const result = await fetchHTMLSource(source);
    results.push(result);
    
    // 添加小延迟避免触发速率限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出统计
  console.log('\n=== 抓取统计 ===');
  const successCount = results.filter((r) => r.success).length;
  const totalArticles = results.reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`成功: ${successCount}/${HTML_SOURCES.length}`);
  console.log(`文章总数: ${totalArticles}`);

  results.forEach((r) => {
    const status = r.success ? '✓' : '✗';
    const count = r.count !== undefined ? `(${r.count}篇)` : '';
    const error = r.error ? `: ${r.error}` : '';
    console.log(`  ${status} ${r.source} ${count}${error}`);
  });

  console.log(`\n结束时间: ${getNowISO()}`);

  // 如果有失败，返回非零退出码
  if (successCount < HTML_SOURCES.length) {
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
