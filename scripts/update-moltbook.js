/**
 * Moltbook 热帖翻译脚本
 * 抓取 Moltbook 热门帖子并翻译标题
 */

const fs = require("fs");
const path = require("path");

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_AUTH_KEY = "bf44d4b3-920d-4647-96ef-6dd041acfb91:fx";
const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
const MOLTBOOK_API_KEY = "moltbook_sk__c-otDzzeAd2f-wpAq3VxGYylKUr6dn7";

// 翻译缓存文件路径
const DATA_DIR = path.join(__dirname, "..", "public", "data", "ai-news");
const TRANSLATIONS_FILE = path.join(DATA_DIR, "moltbook-translations.json");
const POSTS_FILE = path.join(DATA_DIR, "moltbook-posts.json");

/**
 * 读取翻译缓存
 */
function readTranslationsCache() {
  try {
    if (fs.existsSync(TRANSLATIONS_FILE)) {
      const content = fs.readFileSync(TRANSLATIONS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn("读取翻译缓存失败:", error.message);
  }
  return { fetch_time: new Date().toISOString(), translations: {} };
}

/**
 * 保存翻译缓存
 */
function saveTranslationsCache(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(data, null, 2));
    console.log("✓ Moltbook 翻译缓存已保存");
  } catch (error) {
    console.error("保存翻译缓存失败:", error.message);
  }
}

/**
 * 保存 Moltbook 帖子数据
 */
function savePosts(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2));
    console.log("✓ Moltbook 帖子数据已保存");
  } catch (error) {
    console.error("保存帖子数据失败:", error.message);
  }
}

/**
 * 调用 DeepL API 翻译文本
 */
async function translateWithDeepL(texts, targetLang = "ZH") {
  if (!texts || texts.length === 0) {
    return [];
  }

  const validTexts = texts.filter((t) => t && t.trim().length > 0);
  if (validTexts.length === 0) {
    return texts;
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_AUTH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: validTexts,
        target_lang: targetLang,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API 错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.translations || data.translations.length === 0) {
      throw new Error("DeepL API 返回空翻译结果");
    }

    return data.translations.map((t) => t.text);
  } catch (error) {
    console.error("DeepL 翻译失败:", error.message);
    // 翻译失败时返回原文
    return validTexts;
  }
}

/**
 * 生成翻译键
 */
function generateTranslationKey(title) {
  // 简化标题作为键
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `moltbook-${simplified}`;
}

/**
 * 检测文本是否为英文
 */
function isEnglishText(text) {
  if (!text || text.trim().length === 0) return false;
  // 简单检测：如果包含英文字符且中文字符少于 10%，认为是英文
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return englishChars > 10 && chineseChars < text.length * 0.1;
}

/**
 * 获取 Moltbook 热门帖子
 */
async function fetchMoltbookHotPosts() {
  try {
    const response = await fetch(`${MOLTBOOK_API}/posts?sort=hot&limit=10`, {
      headers: {
        Authorization: `Bearer ${MOLTBOOK_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Moltbook API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "获取 Moltbook 数据失败");
    }

    // 处理响应数据
    const posts = (data.posts || []).map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content || "",
      author: post.author?.name || "Unknown",
      submolt: post.submolt?.name || "general",
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      commentCount: post.comment_count || 0,
      createdAt: post.created_at,
    }));

    return posts;
  } catch (error) {
    console.error("获取 Moltbook 帖子失败:", error.message);
    throw error;
  }
}

/**
 * 翻译帖子标题
 */
async function translatePostTitles(posts) {
  const cache = readTranslationsCache();
  const translations = cache.translations || {};

  // 收集需要翻译的标题
  const titlesToTranslate = [];
  const titleKeys = [];

  for (const post of posts) {
    const key = generateTranslationKey(post.title);
    // 如果没有缓存且是英文标题
    if (!translations[key] && isEnglishText(post.title)) {
      titlesToTranslate.push(post.title);
      titleKeys.push(key);
    }
  }

  if (titlesToTranslate.length === 0) {
    console.log("没有需要翻译的新标题");
    return cache;
  }

  console.log(`需要翻译 ${titlesToTranslate.length} 个标题...`);

  // 批量翻译（DeepL 免费版每次最多 50 个文本）
  const batchSize = 50;
  for (let i = 0; i < titlesToTranslate.length; i += batchSize) {
    const batch = titlesToTranslate.slice(i, i + batchSize);
    const batchKeys = titleKeys.slice(i, i + batchSize);

    console.log(
      `翻译批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        titlesToTranslate.length / batchSize
      )}: ${batch.length} 个标题`
    );

    const translatedTexts = await translateWithDeepL(batch, "ZH");

    batchKeys.forEach((key, index) => {
      translations[key] = translatedTexts[index] || batch[index];
    });

    // 添加小延迟避免触发速率限制
    if (i + batchSize < titlesToTranslate.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // 更新缓存
  const updatedCache = {
    fetch_time: new Date().toISOString(),
    translations,
  };

  saveTranslationsCache(updatedCache);
  return updatedCache;
}

/**
 * 主函数
 */
async function main() {
  console.log("=== Moltbook 热帖翻译脚本 ===");
  console.log(`开始时间: ${new Date().toISOString()}`);

  try {
    // 获取帖子
    console.log("\n正在获取 Moltbook 热门帖子...");
    const posts = await fetchMoltbookHotPosts();
    console.log(`✓ 获取到 ${posts.length} 个帖子`);

    // 翻译标题
    console.log("\n=== 开始翻译帖子标题 ===");
    await translatePostTitles(posts);

    // 保存帖子数据
    const postsData = {
      fetch_time: new Date().toISOString(),
      posts,
    };
    savePosts(postsData);

    console.log("\n=== 更新完成 ===");
    console.log(`结束时间: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }
}

// 运行主函数
main();
