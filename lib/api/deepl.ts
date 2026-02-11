/**
 * DeepL 翻译 API 模块
 * 用于将英文标题翻译为中文
 */

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_AUTH_KEY = "bf44d4b3-920d-4647-96ef-6dd041acfb91:fx";

export interface DeepLTranslationRequest {
  text: string[];
  target_lang: string;
  source_lang?: string;
}

export interface DeepLTranslationResponse {
  translations: {
    detected_source_language?: string;
    text: string;
  }[];
}

/**
 * 使用 DeepL API 翻译文本
 * @param texts 要翻译的文本数组
 * @param targetLang 目标语言代码（默认 ZH 中文）
 * @returns 翻译后的文本数组
 */
export async function translateTexts(
  texts: string[],
  targetLang: string = "ZH"
): Promise<string[]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // 过滤掉空字符串
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

    const data: DeepLTranslationResponse = await response.json();

    if (!data.translations || data.translations.length === 0) {
      throw new Error("DeepL API 返回空翻译结果");
    }

    return data.translations.map((t) => t.text);
  } catch (error) {
    console.error("DeepL 翻译失败:", error);
    // 翻译失败时返回原文
    return validTexts;
  }
}

/**
 * 翻译单个文本
 * @param text 要翻译的文本
 * @param targetLang 目标语言代码
 * @returns 翻译后的文本
 */
export async function translateText(
  text: string,
  targetLang: string = "ZH"
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const results = await translateTexts([text], targetLang);
  return results[0] || text;
}

/**
 * 批量翻译标题（带缓存检查）
 * @param titles 标题数组
 * @param existingTranslations 已有翻译映射
 * @returns 新的翻译映射
 */
export async function translateTitlesWithCache(
  titles: string[],
  existingTranslations: Record<string, string> = {}
): Promise<Record<string, string>> {
  // 过滤出需要翻译的标题（不在缓存中且为英文）
  const titlesToTranslate = titles.filter((title) => {
    // 如果已有翻译，跳过
    if (existingTranslations[title]) {
      return false;
    }
    // 检测是否为英文（简单检测：包含英文字符）
    return /[a-zA-Z]/.test(title);
  });

  if (titlesToTranslate.length === 0) {
    return existingTranslations;
  }

  console.log(`需要翻译 ${titlesToTranslate.length} 个标题...`);

  // 批量翻译（DeepL 免费版每次最多 50 个文本）
  const batchSize = 50;
  const translations: Record<string, string> = { ...existingTranslations };

  for (let i = 0; i < titlesToTranslate.length; i += batchSize) {
    const batch = titlesToTranslate.slice(i, i + batchSize);
    console.log(`翻译批次 ${Math.floor(i / batchSize) + 1}: ${batch.length} 个标题`);

    const translatedTexts = await translateTexts(batch, "ZH");

    batch.forEach((original, index) => {
      translations[original] = translatedTexts[index] || original;
    });

    // 添加小延迟避免触发速率限制
    if (i + batchSize < titlesToTranslate.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return translations;
}

/**
 * 生成翻译键（用于 translations.json）
 * @param source 来源标识
 * @param title 标题
 * @returns 翻译键
 */
export function generateTranslationKey(source: string, title: string): string {
  // 简化标题作为键：小写，替换空格为连字符，移除特殊字符
  const simplified = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50); // 限制长度

  return `${source}-${simplified}`;
}
