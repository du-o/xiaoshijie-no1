/**
 * RSS 抓取脚本 - Node.js 版本
 * 抓取多个 AI 新闻源的 RSS feed，过滤出最近 24 小时的文章
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { XMLParser } = require('fast-xml-parser');

// 配置
const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'ai-news');
const HOURS_24 = 24 * 60 * 60 * 1000; // 24小时毫秒数

// RSS 数据源配置（4个）
const RSS_SOURCES = [
  {
    name: 'openai',
    displayName: 'OpenAI News',
    file: 'openai-news-latest.json',
    url: 'https://openai.com/news/rss.xml',
  },
  {
    name: 'arxiv',
    displayName: 'arXiv CS.AI',
    file: 'arxiv-cs-ai-latest.json',
    url: 'https://export.arxiv.org/rss/cs.AI',
  },
  {
    name: '机器之心',
    displayName: '机器之心',
    file: '机器之心-latest.json',
    url: 'https://www.jiqizhixin.com/rss',
  },
  {
    name: 'qbitai',
    displayName: '量子位',
    file: 'qbitai-latest.json',
    url: 'https://www.qbitai.com/feed',
  },
];

// HTML 数据源配置（2个）
const HTML_SOURCES = [
  {
    name: 'google-blog',
    displayName: 'Google Blog',
    file: 'google-blog-latest.json',
  },
  {
    name: 'every',
    displayName: 'Every.to',
    file: 'every-latest.json',
  },
];

/**
 * 获取当前时间的 ISO 字符串
 */
function getNowISO() {
  return new Date().toISOString();
}

/**
 * 解析 RSS 日期字符串
 */
function parseRSSDate(dateStr) {
  if (!dateStr) return null;
  try {
    // 尝试多种日期格式
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // 尝试其他格式
    const formats = [
      // RFC 2822: Mon, 09 Feb 2026 11:00:00 GMT
      /^(\w{3}),\s+(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,
    ];

    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = parseInt(match[2]);
        const month = monthNames.indexOf(match[3]);
        const year = parseInt(match[4]);
        const hour = parseInt(match[5]);
        const minute = parseInt(match[6]);
        const second = parseInt(match[7]);

        if (month !== -1) {
          return new Date(Date.UTC(year, month, day, hour, minute, second));
        }
      }
    }
  }
  return null;
}

/**
 * 获取 24 小时前的时间
 */
function get24HoursAgo() {
  return new Date(Date.now() - HOURS_24);
}

/**
 * 发送 HTTP 请求获取 RSS
 */
function fetchRSS(url, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const options = {
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    };

    const req = client.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 重定向
        return fetchRSS(res.headers.location, retryCount).then(resolve).catch(reject);
      }

      if (res.statusCode === 403 && retryCount < 3) {
        // 403 时重试，增加延迟
        console.log(`  403 Forbidden，第 ${retryCount + 1} 次重试...`);
        setTimeout(() => {
          fetchRSS(url, retryCount + 1).then(resolve).catch(reject);
        }, 2000 * (retryCount + 1)); // 递增延迟
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * 解析 RSS XML
 */
function parseRSS(xmlData) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true,
  });

  try {
    const result = parser.parse(xmlData);

    // RSS 2.0 格式
    if (result.rss && result.rss.channel && result.rss.channel.item) {
      const channel = result.rss.channel;
      const items = Array.isArray(channel.item) ? channel.item : [channel.item];
      return {
        title: channel.title || '',
        link: channel.link || '',
        description: channel.description || '',
        items: items.map((item) => ({
          title: item.title || '',
          link: item.link || item.guid || '',
          description: item.description || '',
          pubDate: item.pubDate || item.date || '',
          category: item.category || '',
          author: item.author || item['dc:creator'] || '',
        })),
      };
    }

    // Atom 格式
    if (result.feed && result.feed.entry) {
      const feed = result.feed;
      const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      return {
        title: feed.title || '',
        link: feed.link?.href || feed.link || '',
        description: feed.subtitle || '',
        items: entries.map((entry) => ({
          title: entry.title || '',
          link: entry.link?.href || entry.id || '',
          description: entry.summary || entry.content || '',
          pubDate: entry.published || entry.updated || '',
          category: entry.category?.term || '',
          author: entry.author?.name || '',
        })),
      };
    }

    throw new Error('Unknown RSS format');
  } catch (error) {
    throw new Error(`Parse error: ${error.message}`);
  }
}

/**
 * 清理 HTML 标签
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^\u003e]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500); // 限制长度
}

/**
 * 过滤文章：优先保证6条，展示时间最近的6条
 */
function filterRecentArticles(items, maxCount = 6) {
  // 解析日期并排序（最新的在前）
  const sortedItems = items
    .map((item) => {
      const pubDate = parseRSSDate(item.pubDate);
      return {
        ...item,
        parsedDate: pubDate,
      };
    })
    .sort((a, b) => {
      // 按日期降序排列（最新的在前）
      if (!a.parsedDate) return 1;
      if (!b.parsedDate) return -1;
      return b.parsedDate - a.parsedDate;
    });

  // 取前 maxCount 条
  return sortedItems.slice(0, maxCount);
}

/**
 * 格式化文章数据
 */
function formatArticle(item, sourceName) {
  const pubDate = item.parsedDate || parseRSSDate(item.pubDate);

  return {
    title: item.title || '',
    date: pubDate ? pubDate.toUTCString() : item.pubDate || '',
    summary: stripHtml(item.description || ''),
    url: item.link || '',
    category: item.category || '',
  };
}

/**
 * 抓取单个 RSS 数据源
 */
async function fetchRSSSource(source) {
  console.log(`\n[${source.name}] 开始抓取...`);

  try {
    const xmlData = await fetchRSS(source.url);
    const feed = parseRSS(xmlData);

    console.log(`[${source.name}] 获取到 ${feed.items.length} 篇文章`);

    // 取时间最近的 6 篇文章
    const recentItems = filterRecentArticles(feed.items, 6);
    console.log(`[${source.name}] 最近 6 条: ${recentItems.length} 篇`);

    // 格式化文章
    const articles = recentItems.map((item) => formatArticle(item, source.name));

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
 * 合并所有源到 all-sources-latest.json
 */
function mergeAllSources() {
  console.log('\n[合并] 开始合并所有源...');

  const allArticles = [];
  const errors = [];

  // 合并 RSS 源
  for (const source of RSS_SOURCES) {
    try {
      const filePath = path.join(DATA_DIR, source.file);
      if (!fs.existsSync(filePath)) {
        errors.push(`${source.name}: 文件不存在`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.status === 'error') {
        errors.push(`${source.name}: ${data.error}`);
        continue;
      }

      const articles = (data.articles || []).map((article) => ({
        ...article,
        source: source.displayName,
        source_name: source.name,
      }));

      allArticles.push(...articles);
    } catch (error) {
      errors.push(`${source.name}: ${error.message}`);
    }
  }

  // 合并 HTML 源
  for (const source of HTML_SOURCES) {
    try {
      const filePath = path.join(DATA_DIR, source.file);
      if (!fs.existsSync(filePath)) {
        errors.push(`${source.name}: 文件不存在`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.status === 'error') {
        errors.push(`${source.name}: ${data.error}`);
        continue;
      }

      const articles = (data.articles || []).map((article) => ({
        ...article,
        source: source.displayName,
        source_name: source.name,
      }));

      allArticles.push(...articles);
    } catch (error) {
      errors.push(`${source.name}: ${error.message}`);
    }
  }

  // 按日期排序
  allArticles.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  const output = {
    fetch_time: getNowISO(),
    total_count: allArticles.length,
    sources_count: RSS_SOURCES.length + HTML_SOURCES.length,
    errors: errors.length > 0 ? errors : null,
    articles: allArticles,
  };

  const outputPath = path.join(DATA_DIR, 'all-sources-latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`[合并] ✓ 已保存 all-sources-latest.json (${allArticles.length} 篇文章)`);
  if (errors.length > 0) {
    console.log(`[合并] 警告: ${errors.length} 个源出错`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== RSS 抓取脚本 ===');
  console.log(`开始时间: ${getNowISO()}`);
  console.log(`规则: 每个源取时间最近的 6 条新闻`);

  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`创建目录: ${DATA_DIR}`);
  }

  // 检查 fast-xml-parser 是否安装
  try {
    require.resolve('fast-xml-parser');
  } catch (e) {
    console.error('\n错误: 需要先安装 fast-xml-parser');
    console.log('请运行: npm install fast-xml-parser');
    process.exit(1);
  }

  // 抓取所有 RSS 源
  const results = [];
  for (const source of RSS_SOURCES) {
    const result = await fetchRSSSource(source);
    results.push(result);
  }

  // 合并所有源（包括 HTML 源）
  mergeAllSources();

  // 输出统计
  console.log('\n=== 抓取统计 ===');
  const successCount = results.filter((r) => r.success).length;
  const totalArticles = results.reduce((sum, r) => sum + (r.count || 0), 0);
  console.log(`成功: ${successCount}/${RSS_SOURCES.length}`);
  console.log(`文章总数: ${totalArticles}`);

  results.forEach((r) => {
    const status = r.success ? '✓' : '✗';
    const count = r.count !== undefined ? `(${r.count}篇)` : '';
    const error = r.error ? `: ${r.error}` : '';
    console.log(`  ${status} ${r.source} ${count}${error}`);
  });

  console.log(`\n结束时间: ${getNowISO()}`);

  // 如果有失败，返回非零退出码
  if (successCount < RSS_SOURCES.length) {
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
