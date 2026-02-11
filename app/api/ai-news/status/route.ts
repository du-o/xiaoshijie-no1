import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// meta.json 路径
const META_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "ai-news",
  "meta.json"
);

// 更新检查间隔（1小时 = 3600000毫秒）
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * 读取 meta.json
 */
async function readMetaFile(): Promise<{
  lastUpdated: string;
  sources: Record<string, { lastUpdated: string; articleCount: number }>;
} | null> {
  try {
    const content = await fs.promises.readFile(META_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("读取 meta.json 失败:", error);
    return null;
  }
}

/**
 * 检查是否需要更新
 */
function needsUpdate(lastUpdated: string): boolean {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdateTime > UPDATE_INTERVAL_MS;
}

/**
 * GET /api/ai-news/status
 * 获取 AI 新闻更新状态
 */
export async function GET(request: NextRequest) {
  try {
    const meta = await readMetaFile();

    if (!meta) {
      return NextResponse.json(
        {
          success: false,
          message: "无法读取元数据文件",
          needsUpdate: true,
        },
        { status: 500 }
      );
    }

    const shouldUpdate = needsUpdate(meta.lastUpdated);
    const lastUpdateTime = new Date(meta.lastUpdated).getTime();
    const timeSinceLastUpdate = Date.now() - lastUpdateTime;

    // 计算友好格式的时间
    const hoursSinceUpdate = Math.floor(timeSinceLastUpdate / (60 * 60 * 1000));
    const minutesSinceUpdate = Math.floor(
      (timeSinceLastUpdate % (60 * 60 * 1000)) / (60 * 1000)
    );

    // 计算下次更新时间
    const nextUpdateTime = lastUpdateTime + UPDATE_INTERVAL_MS;
    const timeUntilNextUpdate = Math.max(0, nextUpdateTime - Date.now());
    const hoursUntilUpdate = Math.floor(timeUntilNextUpdate / (60 * 60 * 1000));
    const minutesUntilUpdate = Math.floor(
      (timeUntilNextUpdate % (60 * 60 * 1000)) / (60 * 1000)
    );

    return NextResponse.json({
      success: true,
      needsUpdate: shouldUpdate,
      lastUpdated: meta.lastUpdated,
      timeSinceLastUpdate,
      timeSinceLastUpdateFormatted:
        hoursSinceUpdate > 0
          ? `${hoursSinceUpdate}小时${minutesSinceUpdate}分钟前`
          : `${minutesSinceUpdate}分钟前`,
      updateInterval: UPDATE_INTERVAL_MS,
      nextUpdateIn: shouldUpdate ? 0 : timeUntilNextUpdate,
      nextUpdateInFormatted:
        hoursUntilUpdate > 0
          ? `${hoursUntilUpdate}小时${minutesUntilUpdate}分钟后`
          : `${minutesUntilUpdate}分钟后`,
      sources: meta.sources,
      totalArticles: Object.values(meta.sources).reduce(
        (sum, source) => sum + source.articleCount,
        0
      ),
    });
  } catch (error) {
    console.error("获取状态失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取状态失败",
        needsUpdate: true,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
