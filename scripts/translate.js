/**
 * DeepL 翻译模块（Node.js 版本）
 * 用于 RSS 抓取脚本
 */

const fs = require("fs");
const path = require("path");

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_AUTH_KEY = "bf44d4b3-920d-4647-96ef-6dd041acfb91:fx";

// 翻译缓存文件路径
const TRANSLATIONS_FILE = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "ai-news",
  "translations.json"
);

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
    const dir = path.dirname(TRANSLATIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(data, null, 2));
    console.log("✓ 翻译缓存已保存");
  } catch (error) {
    console.error("保存翻译缓存失败:", error.message);
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
function generateTranslationKey(source, title) {
  // 简化标题作为键
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${source}-${simplified}`;
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
 * 翻译 RSS 文章标题
 * @param articles 文章数组
 * @param source 来源标识
 * @returns 翻译后的缓存数据
 */
async function translateArticles(articles, source) {
  const cache = readTranslationsCache();
  const translations = cache.translations || {};

  // 只翻译英文源的标题
  const englishSources = ["openai", "arxiv", "google-blog", "every", "openclaw", "moltbook"];
  if (!englishSources.includes(source)) {
    console.log(`跳过翻译: ${source} 不是英文源`);
    return cache;
  }

  // 收集需要翻译的标题
  const titlesToTranslate = [];
  const titleKeys = [];

  for (const article of articles) {
    const key = generateTranslationKey(source, article.title);
    // 如果没有缓存且是英文标题
    if (!translations[key] && isEnglishText(article.title)) {
      titlesToTranslate.push(article.title);
      titleKeys.push(key);
    }
  }

  if (titlesToTranslate.length === 0) {
    console.log(`没有需要翻译的新标题 (${source})`);
    return cache;
  }

  console.log(`需要翻译 ${titlesToTranslate.length} 个标题 (${source})...`);

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
 * 获取翻译后的标题
 * @param title 原标题
 * @param source 来源
 * @returns 中文标题（如有翻译）或原标题
 */
function getTranslatedTitle(title, source) {
  const cache = readTranslationsCache();
  const translations = cache.translations || {};
  const key = generateTranslationKey(source, title);
  return translations[key] || title;
}

module.exports = {
  translateArticles,
  getTranslatedTitle,
  readTranslationsCache,
  saveTranslationsCache,
  generateTranslationKey,
  isEnglishText,
};
