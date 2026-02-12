const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { translateArticles } = require('./translate');

// 配置
const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'ai-news');
const META_FILE = path.join(DATA_DIR, 'meta.json');
// RSS 抓取脚本路径（Node.js 版本）
const RSS_SCRIPT = path.join(__dirname, 'filter_rss_24h.js');
// HTML 抓取脚本路径
const HTML_SCRIPT = path.join(__dirname, 'fetch-html.js');

// 数据源配置（8个源：OpenAI、arXiv、机器之心、量子位、Google Blog、Every.to、OpenClaw、Moltbook）
const SOURCES = [
  { name: 'openai', file: 'openai-news-latest.json', url: 'https://openai.com/news/rss.xml' },
  { name: 'arxiv', file: 'arxiv-cs-ai-latest.json', url: 'https://export.arxiv.org/rss/cs.AI' },
  { name: '机器之心', file: '机器之心-latest.json', url: 'https://www.jiqizhixin.com/rss' },
  { name: 'qbitai', file: 'qbitai-latest.json', url: 'https://www.qbitai.com/feed' },
  { name: 'google-blog', file: 'google-blog-latest.json', url: 'https://blog.google' },
  { name: 'every', file: 'every-latest.json', url: 'https://every.to/newsletter' },
  { name: 'openclaw', file: 'openclaw-latest.json', url: 'https://github.com/openclaw/openclaw/releases' },
  { name: 'moltbook', file: 'moltbook-latest.json', url: 'https://www.moltbook.com' },
];

// API 配置
const GITHUB_API = 'https://api.github.com/repos/openclaw/openclaw';
const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || '';

/**
 * 读取现有的 meta.json
 */
function readMetaFile() {
  try {
    if (fs.existsSync(META_FILE)) {
      const content = fs.readFileSync(META_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('读取 meta.json 失败，将创建新文件:', error.message);
  }
  return null;
}

/**
 * 写入 meta.json
 */
function writeMetaFile(meta) {
  try {
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
    console.log('✓ meta.json 已更新');
  } catch (error) {
    console.error('写入 meta.json 失败:', error.message);
    throw error;
  }
}

/**
 * 读取数据源文件获取文章数量
 */
function getArticleCount(fileName) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return data.articles?.length || 0;
    }
  } catch (error) {
    console.warn(`读取 ${fileName} 失败:`, error.message);
  }
  return 0;
}

/**
 * 执行 RSS 抓取脚本
 */
function runRSSScript() {
  console.log('正在执行 RSS 抓取脚本...');
  try {
    // 检查脚本是否存在
    if (!fs.existsSync(RSS_SCRIPT)) {
      console.warn(`RSS 脚本不存在: ${RSS_SCRIPT}`);
      console.log('跳过 RSS 抓取...');
      return false;
    }

    const result = execSync(`node "${RSS_SCRIPT}"`, {
      encoding: 'utf-8',
      timeout: 5 * 60 * 1000, // 5分钟超时
      cwd: path.dirname(RSS_SCRIPT),
    });
    console.log('RSS 抓取完成:', result);
    return true;
  } catch (error) {
    console.error('执行 RSS 抓取脚本失败:', error.message);
    if (error.stderr) {
      console.error('错误输出:', error.stderr);
    }
    return false;
  }
}

/**
 * 执行 HTML 抓取脚本
 */
function runHTMLScript() {
  console.log('正在执行 HTML 抓取脚本...');
  try {
    // 检查脚本是否存在
    if (!fs.existsSync(HTML_SCRIPT)) {
      console.warn(`HTML 脚本不存在: ${HTML_SCRIPT}`);
      console.log('跳过 HTML 抓取...');
      return false;
    }

    const result = execSync(`node "${HTML_SCRIPT}"`, {
      encoding: 'utf-8',
      timeout: 5 * 60 * 1000, // 5分钟超时
      cwd: path.dirname(HTML_SCRIPT),
    });
    console.log('HTML 抓取完成:', result);
    return true;
  } catch (error) {
    console.error('执行 HTML 抓取脚本失败:', error.message);
    if (error.stderr) {
      console.error('错误输出:', error.stderr);
    }
    return false;
  }
}

/**
 * 获取 OpenClaw GitHub Releases
 */
async function fetchOpenClawReleases() {
  console.log('\n=== 获取 OpenClaw Releases ===');
  try {
    const response = await fetch(`${GITHUB_API}/releases?per_page=6`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-News-Updater',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    const articles = data.map((release) => ({
      title: release.name || release.tag_name,
      date: release.published_at,
      summary: release.body?.substring(0, 200) + (release.body?.length > 200 ? '...' : '') || '',
      url: release.html_url,
      category: 'Release',
      author: release.author?.login || 'unknown',
      tagName: release.tag_name,
      downloadCount: release.assets?.reduce((sum, asset) => sum + asset.download_count, 0) || 0,
    }));

    const outputData = {
      source: 'OpenClaw',
      source_url: 'https://github.com/openclaw/openclaw/releases',
      fetch_time: new Date().toISOString(),
      articles,
      status: 'success',
      error: null,
    };

    const outputPath = path.join(DATA_DIR, 'openclaw-latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✓ OpenClaw: 获取 ${articles.length} 条 releases`);
    return true;
  } catch (error) {
    console.error('获取 OpenClaw releases 失败:', error.message);
    
    // 写入错误状态
    const errorData = {
      source: 'OpenClaw',
      source_url: 'https://github.com/openclaw/openclaw/releases',
      fetch_time: new Date().toISOString(),
      articles: [],
      status: 'error',
      error: error.message,
    };
    const outputPath = path.join(DATA_DIR, 'openclaw-latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(errorData, null, 2));
    return false;
  }
}

/**
 * 获取 Moltbook 热门帖子
 */
async function fetchMoltbookPosts() {
  console.log('\n=== 获取 Moltbook 热帖 ===');
  
  if (!MOLTBOOK_API_KEY) {
    console.warn('警告: 未设置 MOLTBOOK_API_KEY 环境变量');
  }
  
  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'AI-News-Updater',
    };
    
    if (MOLTBOOK_API_KEY) {
      headers['Authorization'] = `Bearer ${MOLTBOOK_API_KEY}`;
    }

    const response = await fetch(`${MOLTBOOK_API}/posts?sort=hot&limit=6`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Moltbook API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '获取 Moltbook 数据失败');
    }

    const articles = (data.posts || []).map((post) => ({
      title: post.title,
      date: post.created_at,
      summary: post.content?.substring(0, 200) + (post.content?.length > 200 ? '...' : '') || '',
      url: `https://www.moltbook.com/post/${post.id}`,
      category: post.submolt?.name || 'general',
      author: post.author?.name || 'Unknown',
      upvotes: post.upvotes || 0,
      commentCount: post.comment_count || 0,
    }));

    const outputData = {
      source: 'Moltbook',
      source_url: 'https://www.moltbook.com',
      fetch_time: new Date().toISOString(),
      articles,
      status: 'success',
      error: null,
    };

    const outputPath = path.join(DATA_DIR, 'moltbook-latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✓ Moltbook: 获取 ${articles.length} 条热帖`);
    return true;
  } catch (error) {
    console.error('获取 Moltbook 热帖失败:', error.message);
    
    // 写入错误状态
    const errorData = {
      source: 'Moltbook',
      source_url: 'https://www.moltbook.com',
      fetch_time: new Date().toISOString(),
      articles: [],
      status: 'error',
      error: error.message,
    };
    const outputPath = path.join(DATA_DIR, 'moltbook-latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(errorData, null, 2));
    return false;
  }
}

/**
 * 更新元数据
 */
function updateMeta() {
  const now = new Date().toISOString();
  const existingMeta = readMetaFile();

  const sources = {};
  for (const source of SOURCES) {
    sources[source.name] = {
      lastUpdated: now,
      articleCount: getArticleCount(source.file),
    };
  }

  const meta = {
    lastUpdated: now,
    sources,
  };

  writeMetaFile(meta);
  return meta;
}

/**
 * 翻译英文源的标题
 */
async function translateSourceTitles() {
  console.log('\n=== 开始翻译英文源标题 ===');
  
  // 英文源：OpenAI、arXiv、Google Blog、Every.to、OpenClaw、Moltbook
  const englishSources = [
    { name: 'openai', file: 'openai-news-latest.json' },
    { name: 'arxiv', file: 'arxiv-cs-ai-latest.json' },
    { name: 'google-blog', file: 'google-blog-latest.json' },
    { name: 'every', file: 'every-latest.json' },
    { name: 'openclaw', file: 'openclaw-latest.json' },
    { name: 'moltbook', file: 'moltbook-latest.json' },
  ];

  for (const source of englishSources) {
    try {
      const filePath = path.join(DATA_DIR, source.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`文件不存在，跳过: ${source.file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const articles = data.articles || [];

      if (articles.length === 0) {
        console.log(`${source.name}: 没有文章需要翻译`);
        continue;
      }

      console.log(`\n处理 ${source.name}: ${articles.length} 篇文章`);
      await translateArticles(articles, source.name);
    } catch (error) {
      console.error(`翻译 ${source.name} 失败:`, error.message);
    }
  }

  console.log('\n=== 翻译完成 ===');
}

/**
 * 主函数
 */
async function main() {
  console.log('=== AI News 更新脚本 ===');
  console.log(`开始时间: ${new Date().toISOString()}`);

  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('✓ 创建数据目录:', DATA_DIR);
  }

  // 检查是否需要增量更新
  const meta = readMetaFile();
  if (meta) {
    const lastUpdate = new Date(meta.lastUpdated).getTime();
    const now = Date.now();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    console.log(`上次更新: ${hoursSinceUpdate.toFixed(1)} 小时前`);
  }

  // 执行 RSS 抓取
  const rssSuccess = runRSSScript();

  if (!rssSuccess) {
    console.log('注意: RSS 抓取未执行或失败');
  }

  // 执行 HTML 抓取（Google Blog + Every.to）
  const htmlSuccess = runHTMLScript();

  if (!htmlSuccess) {
    console.log('注意: HTML 抓取未执行或失败');
  }

  // 获取 OpenClaw Releases
  await fetchOpenClawReleases();

  // 获取 Moltbook 热帖
  await fetchMoltbookPosts();

  // 翻译英文源标题
  await translateSourceTitles();

  // 更新元数据
  const newMeta = updateMeta();
  console.log('\n更新后的元数据:');
  console.log(JSON.stringify(newMeta, null, 2));

  console.log('\n=== 更新完成 ===');
  console.log(`结束时间: ${new Date().toISOString()}`);
}

// 运行主函数
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
