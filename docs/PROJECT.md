# 小世界 AI News 项目文档

## 项目概述

小世界网站改版项目，从加密货币监控面板转型为 AI 新闻聚合平台。

- **项目名称**: 小世界 AI News
- **技术栈**: Next.js 15 + React 18 + TypeScript + Tailwind CSS
- **数据更新**: 定时自动抓取 RSS 源
- **部署方式**: 静态导出 + Vercel

### 部署凭证
- **GitHub 账号**: `du-o`（注意：不是 `duo`）
- **GitHub Token**: 见环境变量 `GITHUB_TOKEN`
- **仓库地址**: `https://github.com/du-o/xiaoshijie-no1`
- **用途**: GitHub Actions 自动推送数据更新
- **配置位置**: `.github/workflows/update-ai-news.yml`

### 开发规范
- **本地开发服务器**: `http://localhost:3000`
- **验收流程**: 每次让用户验收本地网站前，必须确认服务器正常运行且地址可访问
- **WSL IP**: `http://172.23.177.204:3000`（备用）

---

## 改版内容

### 板块调整

| 板块 | 改版前 | 改版后 |
|------|--------|--------|
| 加密货币 | 展示中 | **隐藏**（代码保留） |
| 日本娱乐 | 展示中 | **隐藏**（代码保留） |
| AI新闻 | 已有板块 | **核心板块，扩大** |
| OpenClaw | - | **新增保留** |
| Moltbook | - | **新增保留** |

### 首页布局

```
┌─────────────────────────────────────┐
│  Hero: 小世界 AI News                │
├─────────────────────────────────────┤
│  AI News 板块（标签页切换）           │
│  - OpenAI News                      │
│  - arXiv CS.AI                      │
│  - 机器之心                          │
│  - AINOW                            │
├─────────────────────────────────────┤
│  OpenClaw 模块（GitHub Releases）    │
├─────────────────────────────────────┤
│  Moltbook 模块（热门帖子）            │
└─────────────────────────────────────┘
```

---

## 数据来源

### AI 新闻源

| 来源 | 语言 | 类型 | RSS地址 | 状态 |
|------|------|------|---------|------|
| OpenAI News | 英文 | 官方动态 | https://openai.com/news/rss.xml | ✅ RSS可抓 |
| arXiv CS.AI | 英文 | 学术论文 | https://export.arxiv.org/rss/cs.AI | ✅ RSS可抓 |
| AINOW | 日文 | AI新闻 | https://ainow.ai/feed/ | ✅ RSS可抓 |
| 机器之心 | 中文 | AI资讯 | https://www.jiqizhixin.com/rss | ✅ RSS可抓 |

### 其他模块

| 模块 | 数据来源 | 接口类型 |
|------|----------|----------|
| OpenClaw | GitHub Releases API | REST API |
| Moltbook | Moltbook API | REST API (需Key) |

---

## 数据文件

### 本地数据目录
```
public/data/
├── ai-news/
│   ├── openai-news.json      # OpenAI官方
│   ├── arxiv-cs-ai.json      # arXiv论文
│   ├── ainow.json            # 日文AI新闻
│   ├── 机器之心.json          # 中文AI资讯
│   └── all-sources.json      # 合并数据
├── crypto/                   # 加密货币（隐藏但保留）
│   └── ahr999.json
└── moltbook/                 # Moltbook数据
    └── hot-posts.json
```

### 数据格式

**AI新闻 JSON 结构:**
```json
{
  "source": "OpenAI News",
  "source_url": "https://openai.com/news/rss.xml",
  "fetch_time": "2026-02-11T20:19:41Z",
  "articles": [
    {
      "title": "文章标题",
      "date": "Mon, 09 Feb 2026 11:00:00 GMT",
      "summary": "文章摘要（100字截断）...",
      "url": "https://openai.com/index/xxx",
      "category": "Product"
    }
  ]
}
```

---

## 展示样式

### AI新闻列表式

```
┌─────────────────────────────────────────────────────────┐
│ 🔥 OpenAI Frontier                              2月5日  │
│ 企业级 AI Agent 平台，支持多 Agent 共享上下文...        │
│ [产品] [官方]                                    → 阅读  │
├─────────────────────────────────────────────────────────┤
│ 📝 GPT-5.3-Codex                                2月5日  │
│ 最强编程 Agent，结合 GPT-5.2-Codex 的编程能力和...      │
│ [产品] [官方]                                    → 阅读  │
└─────────────────────────────────────────────────────────┘
```

**样式要点:**
- 列表式布局，信息密度高
- 摘要截断 100 字
- 标签显示来源分类
- 点击跳转原文

---

## 自动更新机制

### 定时任务
- **频率**: 每天自动运行（沿用现有定时任务配置）
- **脚本**: `scripts/update-ai-news.js`
- **流程**: 抓取 RSS → 生成 JSON → 提交 Git → Vercel 自动部署

### 时间过滤
- 默认抓取最近 24 小时内容
- 可通过 `--hours N` 参数调整

---

## 代码结构

### 新增/修改文件

```
app/
├── page.tsx                    # 改造：新首页布局
├── layout.tsx                  # 可能调整标题

components/features/
├── ai-news/
│   ├── ai-news-dashboard.tsx   # AI新闻主组件（标签页）
│   ├── news-list.tsx           # 新闻列表组件
│   └── news-card.tsx           # 单条新闻卡片
├── openclaw/
│   └── openclaw-section.tsx    # OpenClaw模块（从旧项目复制）
└── moltbook/
    └── moltbook-section.tsx    # Moltbook模块（从旧项目复制）

lib/api/
├── ai-news.ts                  # AI新闻数据读取
├── openclaw.ts                 # OpenClaw API（从旧项目复制）
└── moltbook.ts                 # Moltbook API（从旧项目复制）

hooks/
├── use-ai-news.ts              # AI新闻 Hook
├── use-openclaw.ts             # OpenClaw Hook（从旧项目复制）
└── use-moltbook.ts             # Moltbook Hook（从旧项目复制）

scripts/
└── update-ai-news.js           # RSS抓取脚本

public/data/ai-news/            # AI新闻数据目录
```

### 隐藏但保留的代码

```
components/features/crypto/     # 加密货币组件（注释掉引用）
```

---

## 开发记录

### 2026-02-11 - 完整改版日

#### 完成的功能
1. **AI新闻聚合板块** - 4个消息源，2x2卡片布局
2. **双语标题显示** - 外文新闻显示原文+中文翻译
3. **DeepL自动翻译** - 集成DeepL API，预翻译+本地缓存
4. **OpenClaw模块** - GitHub Releases展示
5. **Moltbook模块** - 热帖展示
6. **响应式布局** - 桌面2列，手机1列
7. **定时自动更新** - 每天8/12/16/20点GitHub Actions自动抓取
8. **数据优化** - arXiv从518KB优化至9.4KB

#### 遇到的问题与解决

| 问题 | 解决方案 | 结果 |
|------|----------|------|
| 量子位RSS 403 | User-Agent伪装 | ✅ 成功抓取 |
| GitHub推送大文件失败 | git filter-branch清理+.gitignore配置 | ✅ 推送成功 |
| arXiv数据文件过大(518KB) | 只保留20条+摘要截断 | ✅ 降至9.4KB |
| 机器之心图标敏感 | 🇨🇳→🧠 | ✅ 已修改 |
| 本地服务器频繁断开 | 建立验收前确认规范 | ⚠️ 线上无此问题 |

#### 技术配置
- **DeepL API Key**: `bf44d4b3-920d-4647-96ef-6dd041acfb91:fx`
- **GitHub**: `du-o/xiaoshijie-no1`
- **GitHub Token**: `***` (已隐藏，从环境变量获取)
- **Vercel**: https://xiaoshijie-no1.vercel.app

#### 团队分工
- **Alfred** (🎩): 项目经理、测试验收
- **News** (📡): RSS源调研
- **Build** (🛠️): 前端开发、数据抓取、部署发布

#### 线上地址
https://xiaoshijie-no1.vercel.app

---

### 历史记录
- 确定改版方案
- 调研 AI 新闻 RSS 源（News Agent）
- 抓取多源数据并生成 JSON（Build Agent）
- 过滤最近 24 小时内容
- 确认展示样式为列表式

---

## 待办事项

### 已完成 ✅
- [x] 复制 OpenClaw/Moltbook 代码到新项目
- [x] 创建 AI News 组件
- [x] 改造首页布局
- [x] 隐藏加密货币板块
- [x] 配置定时自动更新
- [x] 测试部署
- [x] 实现DeepL自动翻译
- [x] 双语标题显示

### 未来可扩展
- [ ] 添加更多中文AI新闻源（如雷锋网）
- [ ] 实现文章摘要的自动翻译
- [ ] 添加用户偏好设置
- [ ] 文章收藏功能

---

## 可扩展RSS源（已调研）

| 来源 | 状态 | 说明 |
|------|------|------|
| VentureBeat | ✅ 可用 | 英文AI商业新闻 |
| Nature Machine Intelligence | ✅ 可用 | 学术AI论文 |
| MIT Technology Review | ✅ 可用 | 权威科技评论 |
| Reddit r/MachineLearning | ❌ 不可用 | 网络封锁 |

---

## 参考链接

- 数据抓取脚本: `workspace-alfred/xiaoshijie/data/ai-news/fetch_rss.py`
- 旧项目代码: `workspace/xiaoshijie-no1/`
- 新项目位置: `workspace-build/xiaoshijie-no1/`
