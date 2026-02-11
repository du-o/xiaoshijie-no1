import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

// 更新检查间隔（1小时 = 3600000毫秒）
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

// meta.json 路径
const META_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "ai-news",
  "meta.json"
);

// 更新脚本路径
const UPDATE_SCRIPT_PATH = path.join(
  process.cwd(),
  "scripts",
  "update-ai-news.js"
);

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
 * 执行更新脚本
 */
async function runUpdateScript(): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  try {
    // 检查脚本是否存在
    if (!fs.existsSync(UPDATE_SCRIPT_PATH)) {
      return {
        success: false,
        message: "更新脚本不存在",
        details: `脚本路径: ${UPDATE_SCRIPT_PATH}`,
      };
    }

    // 执行更新脚本
    const { stdout, stderr } = await execAsync(`node "${UPDATE_SCRIPT_PATH}"`, {
      timeout: 5 * 60 * 1000, // 5分钟超时
      cwd: process.cwd(),
    });

    if (stderr) {
      console.warn("更新脚本警告:", stderr);
    }

    console.log("更新脚本输出:", stdout);

    return {
      success: true,
      message: "更新完成",
      details: stdout,
    };
  } catch (error) {
    console.error("执行更新脚本失败:", error);
    return {
      success: false,
      message: "更新失败",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * POST /api/ai-news/update
 * 触发 AI 新闻更新
 */
export async function POST(request: NextRequest) {
  try {
    // 读取当前元数据
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

    // 检查是否需要更新
    const shouldUpdate = needsUpdate(meta.lastUpdated);

    if (!shouldUpdate) {
      return NextResponse.json({
        success: true,
        message: "数据已是最新",
        needsUpdate: false,
        lastUpdated: meta.lastUpdated,
        nextUpdateIn: UPDATE_INTERVAL_MS - (Date.now() - new Date(meta.lastUpdated).getTime()),
      });
    }

    // 执行更新
    console.log("[AI News Update] 数据超过1小时未更新，开始后台更新...");
    const result = await runUpdateScript();

    if (result.success) {
      // 重新读取更新后的元数据
      const updatedMeta = await readMetaFile();

      return NextResponse.json({
        success: true,
        message: "更新成功",
        needsUpdate: false,
        lastUpdated: updatedMeta?.lastUpdated || meta.lastUpdated,
        details: result.details,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          needsUpdate: true,
          error: result.details,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("更新 API 错误:", error);
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
        needsUpdate: true,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-news/update
 * 检查是否需要更新（不执行更新）
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

    return NextResponse.json({
      success: true,
      needsUpdate: shouldUpdate,
      lastUpdated: meta.lastUpdated,
      timeSinceLastUpdate,
      updateInterval: UPDATE_INTERVAL_MS,
      nextUpdateIn: shouldUpdate ? 0 : UPDATE_INTERVAL_MS - timeSinceLastUpdate,
      sources: meta.sources,
    });
  } catch (error) {
    console.error("检查更新状态失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "检查更新状态失败",
        needsUpdate: true,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
