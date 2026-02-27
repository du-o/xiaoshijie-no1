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
    url: 'https://blog.google/innovation-and-ai/',
    jinaUrl: 'https://r.jina.ai/http://blog.google.com', // 使用主站获取更多文章
    parser: 'parseGoogleBlog',
  },
  {
    name: 'every',
    displayName: 'Every.to',
    file: 'every-latest.json',
    url: 'https://every.to/newsletter',
    jinaUrl: 'https://r.jina.ai/http://every.to/newsletter',
    fallbackUrls: [
      'https://r.jina.ai/http://every.to',
      'https://r.jina.ai/http://every.to/archive',
    ],
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
 * 获取备用内容（当主抓取失败时使用）
 * 使用 r.jina.ai/http:// 格式作为备用
 */
async function fetchWithFallback(primaryUrl, fallbackUrls = []) {
  const urlsToTry = [primaryUrl, ...fallbackUrls];
  
  for (const url of urlsToTry) {
    try {
      console.log(`  尝试: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 100) {
          console.log(`  ✓ 成功从 ${url} 获取内容 (${text.length} 字符)`);
          return text;
        }
      }
    } catch (error) {
      console.log(`  ✗ ${url} 失败: ${error.message}`);
    }
  }
  
  throw new Error('所有备用 URL 均失败');
}

/**
 * 解析 Google Blog 内容
 * 通过 jina.ai 获取 markdown 格式内容
 * 优先保留 AI 相关文章
 */
function parseGoogleBlog(html, baseUrl) {
  const articles = [];
  const aiArticles = []; // AI 相关文章
  const otherArticles = []; // 其他文章
  
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
      .replace(/\s+={3,}/, '') // 移除 === 分隔符
      .replace(/\s+-{3,}/, '') // 移除 --- 分隔符
      .replace(/\s+/g, ' ')
      .trim();
    
    // 跳过栏目首页（以 / 结尾的 URL 通常是栏目页，但要保留具体文章页）
    const urlParts = url.replace('https://blog.google', '').split('/').filter(Boolean);
    if (urlParts.length <= 2 && url.endsWith('/')) {
      continue;
    }
    
    // 跳过太短的标题或分类名称
    if (cleanTitle.length < 10 || 
        cleanTitle === 'Innovation & AI' ||
        cleanTitle === 'Products & platforms' ||
        cleanTitle === 'Company news' ||
        cleanTitle === 'Safety & Security' ||
        cleanTitle === 'Google DeepMind' ||
        cleanTitle === 'Google in Asia' ||
        cleanTitle.toLowerCase() === 'blog' ||
        cleanTitle.toLowerCase().endsWith(' blog') ||
        cleanTitle.toLowerCase().includes('homepage')) {
      continue;
    }
    
    // 提取分类
    const category = extractCategory(url);
    
    const article = {
      title: cleanTitle,
      url: url,
      date: getNowISO(),
      summary: '',
      category: category,
    };
    
    // 判断是否为 AI 相关文章
    const isAIArticle = url.includes('/innovation-and-ai/') ||
                       url.includes('/models-and-research/') ||
                       url.includes('/google-deepmind/') ||
                       url.includes('/ai/') ||
                       cleanTitle.toLowerCase().includes('ai') ||
                       cleanTitle.toLowerCase().includes('gemini') ||
                       cleanTitle.toLowerCase().includes('deepmind');
    
    if (isAIArticle) {
      aiArticles.push(article);
    } else {
      otherArticles.push(article);
    }
    
    // 如果已经有6条AI文章，提前结束
    if (aiArticles.length >= 6) break;
  }
  
  // 优先使用 AI 文章，如果不足6条则补充其他文章
  articles.push(...aiArticles);
  if (articles.length < 6) {
    articles.push(...otherArticles.slice(0, 6 - articles.length));
  }
  
  return articles.slice(0, 6);
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
 * 支持多种 URL 格式和备用提取策略
 */
function parseEvery(html, baseUrl) {
  const articles = [];
  const seenUrls = new Set();
  const lines = html.split('\n');
  
  // 策略 1: 标准格式 [标题](https://every.to/...)
  // 匹配所有 every.to 的文章链接，不限于特定分类
  const standardRegex = /\[([^\]]+)\]\((https:\/\/every\.to\/[^/)]+\/[^)]+)\)/;
  
  // 策略 2: 带 ### 的格式 [### 标题](https://every.to/...)
  const hashRegex = /\[###\s*([^\]]+)\]\((https:\/\/every\.to\/[^/)]+\/[^)]+)\)/;
  
  // 策略 3: 备用格式，匹配任何 every.to 链接
  const fallbackRegex = /\[([^\]]{10,200})\]\((https:\/\/every\.to\/[^)]+)\)/;
  
  const strategies = [
    { name: 'standard', regex: standardRegex },
    { name: 'hash', regex: hashRegex },
    { name: 'fallback', regex: fallbackRegex },
  ];
  
  for (const strategy of strategies) {
    console.log(`  [Every.to] 使用 ${strategy.name} 策略提取...`);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行、图片、SVG图标链接
      if (!trimmedLine || trimmedLine.startsWith('![')) continue;
      
      const match = trimmedLine.match(strategy.regex);
      if (!match) continue;
      
      const title = match[1].trim().replace(/^###\s*/, '');
      const url = match[2].trim();
      
      // 跳过非文章链接（SVG图标、图片、静态资源）
      if (url.includes('/authors/') || 
          url.endsWith('/newsletter') ||
          url.endsWith('/about') ||
          url.endsWith('/search') ||
          url.endsWith('/subscribe') ||
          url.includes('/assets/') ||
          url.endsWith('.svg') ||
          url.endsWith('.png') ||
          url.endsWith('.jpg') ||
          url.endsWith('.gif')) {
        continue;
      }
      
      // 去重
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      
      // 跳过导航链接和图片标题
      const lowerTitle = title.toLowerCase();
      const skipWords = ['sign in', 'subscribe', 'home', 'newsletter', 'columnists', 
        'columns', 'products', 'events', 'consulting', 'store', 'search', 
        'about us', 'jobs', 'advertise', 'the team', 'faq', 'help center',
        'popular', 'newest', 'oldest', 'podcasts', 'image', 'arrow', 'logo'];
      
      if (skipWords.some(word => lowerTitle.includes(word))) continue;
      
      // 跳过太短的标题
      if (title.length < 10) continue;
      
      // 提取分类
      const category = extractEveryCategory(url);
      
      // 清理标题
      const cleanTitle = title.replace(/\s+/g, ' ').trim();
      
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
    
    if (articles.length >= 6) break;
    console.log(`  [Every.to] ${strategy.name} 策略提取到 ${articles.length} 条`);
  }
  
  console.log(`  [Every.to] 总共提取到 ${articles.length} 条文章`);
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
    // 尝试多个 URL（主 URL + 备用 URL）
    const urlsToTry = [source.jinaUrl, ...(source.fallbackUrls || [])];
    let html = null;
    let lastError = null;
    
    for (const url of urlsToTry) {
      try {
        console.log(`[${source.name}] 尝试: ${url}`);
        html = await fetchHTML(url);
        if (html && html.length > 100) {
          console.log(`[${source.name}] ✓ 成功获取内容 (${html.length} 字符)`);
          break;
        }
      } catch (error) {
        console.log(`[${source.name}] ✗ ${url} 失败: ${error.message}`);
        lastError = error;
      }
    }
    
    if (!html) {
      throw lastError || new Error('无法从任何 URL 获取内容');
    }
    
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
