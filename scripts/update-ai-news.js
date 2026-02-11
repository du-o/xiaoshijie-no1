const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { translateArticles } = require('./translate');

// 配置
const DATA_DIR = path.join(__dirname, '..', 'public', 'data', 'ai-news');
const META_FILE = path.join(DATA_DIR, 'meta.json');
// Python 脚本可能在项目根目录或父目录
const PYTHON_SCRIPT = fs.existsSync(path.join(__dirname, '..', 'filter_rss_24h.py'))
  ? path.join(__dirname, '..', 'filter_rss_24h.py')
  : path.join(__dirname, '..', '..', 'filter_rss_24h.py');

// 数据源配置（移除ainow，添加量子位）
const SOURCES = [
  { name: 'openai', file: 'openai-news-latest.json', url: 'https://openai.com/news/rss.xml' },
  { name: 'arxiv', file: 'arxiv-cs-ai-latest.json', url: 'https://export.arxiv.org/rss/cs.AI' },
  { name: '机器之心', file: '机器之心-latest.json', url: 'https://www.jiqizhixin.com/rss' },
  { name: 'qbitai', file: 'qbitai-latest.json', url: 'https://www.qbitai.com/feed' },
];

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
 * 执行 Python RSS 抓取脚本
 */
function runPythonScript() {
  console.log('正在执行 RSS 抓取脚本...');
  try {
    // 检查 Python 脚本是否存在
    if (!fs.existsSync(PYTHON_SCRIPT)) {
      console.warn(`Python 脚本不存在: ${PYTHON_SCRIPT}`);
      console.log('跳过 RSS 抓取，仅更新元数据...');
      return false;
    }

    const result = execSync(`python3 "${PYTHON_SCRIPT}"`, {
      encoding: 'utf-8',
      timeout: 5 * 60 * 1000, // 5分钟超时
      cwd: path.dirname(PYTHON_SCRIPT),
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
  
  const englishSources = [
    { name: 'openai', file: 'openai-news-latest.json' },
    { name: 'arxiv', file: 'arxiv-cs-ai-latest.json' },
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

  // 执行 RSS 抓取（如果 Python 脚本存在）
  const pythonSuccess = runPythonScript();

  if (!pythonSuccess) {
    console.log('注意: RSS 抓取未执行或失败，将仅更新元数据');
  }

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
